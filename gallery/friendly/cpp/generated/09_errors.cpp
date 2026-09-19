#include  <memory>
#include  <cstddef>
#include  <type_traits>
#include  <variant>
#include  <string>
#include  <iostream>

// define classes here to avoid compiler errors
class Guarded_Err;
class Guarded_Err;
class Guarded__ops;
class Guard;
class ErrorsMain;
class Guarded_Ok;
class Guarded_Err;
class Guarded__ops;
class Guard;
class ErrorsMain;

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
typedef std::variant<Guarded_Ok, std::shared_ptr<Guarded_Err>>  r_union_Guarded;
typedef std::variant<Guarded_Ok, std::shared_ptr<Guarded_Err>, std::shared_ptr<Guarded__ops>, std::shared_ptr<Guard>, std::shared_ptr<ErrorsMain>, int, std::string, bool, double>  r_union_Any;

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

template <class T> inline T& rg_arg_ref(T&& v) { return v; }

// header definitions
class Guarded_Ok { 
  public :
    int value;
    /* class constructor */ 
    Guarded_Ok( int value  );
    /* a value case of a closed family compares by content */ 
    bool operator==(const Guarded_Ok& o) const {
      return value == o.value;
    }
    bool operator!=(const Guarded_Ok& o) const { return !(*this == o); }
};
class Guarded_Err { 
  public :
    std::string message;
    /* class constructor */ 
    Guarded_Err( const std::string& message  );
};
class Guarded__ops { 
  public :
    /* class constructor */ 
    Guarded__ops( );
    /* static methods */ 
    static bool equals( const r_union_Guarded& a , const r_union_Guarded& b );
    static bool notEquals( const r_union_Guarded& a , const r_union_Guarded& b );
};
class Guard { 
  public :
    /* class constructor */ 
    Guard( );
    /* instance methods */ 
    r_union_Guarded check( int value );
    std::string describe( const r_union_Guarded& g );
};
class ErrorsMain { 
  public :
    /* class constructor */ 
    ErrorsMain( );
    /* static methods */ 
    static void main();
};

int __g_argc;
char **__g_argv;
Guarded_Ok::Guarded_Ok( int value  ) {
  this->value = 0;
  this->value = value;
}
Guarded_Err::Guarded_Err( const std::string& message  ) {
  this->message = message;
}
Guarded__ops::Guarded__ops( ) {
}
bool  Guarded__ops::equals( const r_union_Guarded& a , const r_union_Guarded& b ) {
  if( std::holds_alternative<Guarded_Ok>(a) ) {
    Guarded_Ok __ea0 = std::get<Guarded_Ok>(a);
    if( std::holds_alternative<Guarded_Ok>(b) ) {
      Guarded_Ok __eb0 = std::get<Guarded_Ok>(b);
      if ( __ea0.value != __eb0.value ) {
        return false;
      }
      return true;
    };
    return false;
  };
  if( std::holds_alternative<std::shared_ptr<Guarded_Err>>(a) ) {
    std::shared_ptr<Guarded_Err> __ea1 = std::get<std::shared_ptr<Guarded_Err>>(a);
    if( std::holds_alternative<std::shared_ptr<Guarded_Err>>(b) ) {
      std::shared_ptr<Guarded_Err> __eb1 = std::get<std::shared_ptr<Guarded_Err>>(b);
      if ( (__ea1->message != __eb1->message) ) {
        return false;
      }
      return true;
    };
    return false;
  };
  return false;
}
bool  Guarded__ops::notEquals( const r_union_Guarded& a , const r_union_Guarded& b ) {
  if ( Guarded__ops::equals(a, b) ) {
    return false;
  }
  return true;
}
Guard::Guard( ) {
}
r_union_Guarded  Guard::check( int value ) {
  if ( value < 0 ) {
    return  std::make_shared<Guarded_Err>(std::string("negative"));
  }
  return  Guarded_Ok(value);
}
std::string  Guard::describe( const r_union_Guarded& g ) {
  std::string out = std::string("?");
  if( std::holds_alternative<Guarded_Ok>(g) ) {
    Guarded_Ok o = std::get<Guarded_Ok>(g);
    out = std::string("ok:") + std::to_string(o.value);
  };
  if( std::holds_alternative<std::shared_ptr<Guarded_Err>>(g) ) {
    std::shared_ptr<Guarded_Err> e = std::get<std::shared_ptr<Guarded_Err>>(g);
    out = std::string("err:") + e->message;
  };
  return out;
}
ErrorsMain::ErrorsMain( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<Guard> g =  std::make_shared<Guard>();
  std::cout << g->describe(g->check(3)) << std::endl;
  std::cout << g->describe(g->check((0 - 1))) << std::endl;
  return 0;
}
