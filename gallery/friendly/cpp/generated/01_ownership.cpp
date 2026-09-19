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

#include <string_view>
#include <vector>
#include <cstring>
// String hashing for the map below. std::hash<std::string> is
// _Hash_bytes, an out-of-line MurmurHash in libstdc++ that costs a call
// and a per-byte mix; profiling the interpreter put it at ~10% of all
// instructions, since every scope lookup and every property read hashes
// a name. This is FxHash -- the one rustc uses for its own identifier
// maps -- which consumes 8 bytes per multiply-rotate and inlines.
//
// The string and string_view paths MUST agree, because the const char*
// overloads probe the same index; they share this one function, so they
// agree by construction rather than by the standard's promise about
// hash<string> and hash<string_view>.
static inline size_t rg_hash_bytes(const char* p, size_t n) {
    const size_t K = (size_t)0x517cc1b727220a95ULL;
    size_t h = n;
    size_t i = 0;
    while (n - i >= sizeof(size_t)) {
        size_t w; std::memcpy(&w, p + i, sizeof(size_t));
        h = ((h << 5) | (h >> (8 * sizeof(size_t) - 5))) ^ w; h *= K;
        i += sizeof(size_t);
    }
    while (i < n) {
        h = ((h << 5) | (h >> (8 * sizeof(size_t) - 5))) ^ (size_t)(unsigned char)p[i]; h *= K;
        i++;
    }
    return h;
}
// Any other key type keeps the standard hash; only strings are hot.
template<typename K> struct rg_key_hash {
    size_t operator()(const K& k) const { return std::hash<K>{}(k); }
};
template<> struct rg_key_hash<std::string> {
    size_t operator()(const std::string& s) const { return rg_hash_bytes(s.data(), s.size()); }
};
// Insertion-ordered map: vector storage + open-addressed hash index.
// Replaces std::map (sorted, O(log n) with a string compare per level):
// lookups hash once, and iteration follows INSERTION order, which is
// what JavaScript object key enumeration semantics need.
template<typename K, typename V>
class rg_ordered_map {
public:
    typedef K key_type;
    typedef V mapped_type;
    std::vector<std::pair<K, V>> entries;
    std::vector<int32_t> index_;
    typedef typename std::vector<std::pair<K, V>>::iterator iterator;
    typedef typename std::vector<std::pair<K, V>>::const_iterator const_iterator;
    iterator begin() { return entries.begin(); }
    iterator end() { return entries.end(); }
    const_iterator begin() const { return entries.begin(); }
    const_iterator end() const { return entries.end(); }
    size_t size() const { return entries.size(); }
    void clear() { entries.clear(); index_.clear(); }
    void rehash_() {
        size_t cap = 8;
        while (cap < (entries.size() + 1) * 2) { cap <<= 1; }
        index_.assign(cap, -1);
        for (size_t i = 0; i < entries.size(); i++) {
            size_t h = rg_key_hash<K>{}(entries[i].first) & (cap - 1);
            while (index_[h] != -1) { h = (h + 1) & (cap - 1); }
            index_[h] = (int32_t)i;
        }
    }
    int32_t slot_(const K& k) const {
        if (index_.empty()) { return -1; }
        size_t mask = index_.size() - 1;
        size_t h = rg_key_hash<K>{}(k) & mask;
        while (true) {
            int32_t s = index_[h];
            if (s == -1) { return -1; }
            if (entries[(size_t)s].first == k) { return s; }
            h = (h + 1) & mask;
        }
    }
    size_t count(const K& k) const { return slot_(k) == -1 ? 0 : 1; }
    iterator find(const K& k) {
        int32_t s = slot_(k);
        return s == -1 ? entries.end() : entries.begin() + s;
    }
    const_iterator find(const K& k) const {
        int32_t s = slot_(k);
        return s == -1 ? entries.end() : entries.begin() + s;
    }
    V& at(const K& k) {
        int32_t s = slot_(k);
        if (s == -1) { throw std::out_of_range("rg_ordered_map::at"); }
        return entries[(size_t)s].second;
    }
    const V& at(const K& k) const {
        int32_t s = slot_(k);
        if (s == -1) { throw std::out_of_range("rg_ordered_map::at"); }
        return entries[(size_t)s].second;
    }
    // const char* overloads: a literal key probes WITHOUT constructing a
    // std::string temporary. C++17 guarantees hash<string> and
    // hash<string_view> agree on equal character sequences. Instantiated
    // lazily, so non-string-keyed maps never touch them.
    int32_t slot_sv_(std::string_view k) const {
        if (index_.empty()) { return -1; }
        size_t mask = index_.size() - 1;
        size_t h = rg_hash_bytes(k.data(), k.size()) & mask;
        while (true) {
            int32_t s = index_[h];
            if (s == -1) { return -1; }
            if (entries[(size_t)s].first.compare(k) == 0) { return s; }
            h = (h + 1) & mask;
        }
    }
    size_t count(const char* k) const { return slot_sv_(k) == -1 ? 0 : 1; }
    iterator find(const char* k) {
        int32_t s = slot_sv_(k);
        return s == -1 ? entries.end() : entries.begin() + s;
    }
    const_iterator find(const char* k) const {
        int32_t s = slot_sv_(k);
        return s == -1 ? entries.end() : entries.begin() + s;
    }
    V& at(const char* k) {
        int32_t s = slot_sv_(k);
        if (s == -1) { throw std::out_of_range("rg_ordered_map::at"); }
        return entries[(size_t)s].second;
    }
    const V& at(const char* k) const {
        int32_t s = slot_sv_(k);
        if (s == -1) { throw std::out_of_range("rg_ordered_map::at"); }
        return entries[(size_t)s].second;
    }
    V& operator[](const char* k) {
        int32_t s = slot_sv_(k);
        if (s != -1) { return entries[(size_t)s].second; }
        return (*this)[K(k)];
    }
    V& operator[](const K& k) {
        int32_t s = slot_(k);
        if (s != -1) { return entries[(size_t)s].second; }
        entries.push_back(std::make_pair(k, V()));
        if (index_.empty() || (entries.size() + 1) * 2 > index_.size()) {
            rehash_();
        } else {
            size_t mask = index_.size() - 1;
            size_t h = rg_key_hash<K>{}(k) & mask;
            while (index_[h] != -1) { h = (h + 1) & mask; }
            index_[h] = (int32_t)(entries.size() - 1);
        }
        return entries.back().second;
    }
};

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
