#include  <memory>
#include  <cstddef>
#include  <type_traits>
#include  <variant>
#include  <string>
#include  <iostream>

// define classes here to avoid compiler errors
class Message_Text;
class Message_Text;
class Message__ops;
class EnumsMain;
class Message_Ping;
class Message_Text;
class Message_Move;
class Message__ops;
class EnumsMain;

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
typedef std::variant<Message_Ping, std::shared_ptr<Message_Text>, Message_Move>  r_union_Message;
typedef std::variant<Message_Ping, std::shared_ptr<Message_Text>, Message_Move, std::shared_ptr<Message__ops>, std::shared_ptr<EnumsMain>, int, std::string, bool, double>  r_union_Any;

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
    std::string body;
    /* class constructor */ 
    Message_Text( const std::string& body  );
};
class Message_Move { 
  public :
    int dx;
    int dy;
    /* class constructor */ 
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
    std::string colorName( int c );
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
      if ( (__ea1->body != __eb1->body) ) {
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
      if ( __ea2.dx != __eb2.dx ) {
        return false;
      }
      if ( __ea2.dy != __eb2.dy ) {
        return false;
      }
      return true;
    };
    return false;
  };
  return false;
}
bool  Message__ops::notEquals( const r_union_Message& a , const r_union_Message& b ) {
  if ( Message__ops::equals(a, b) ) {
    return false;
  }
  return true;
}
EnumsMain::EnumsMain( ) {
}
std::string  EnumsMain::colorName( int c ) {
  if ( c == 0 ) {
    return std::string("red");
  }
  if ( c == 1 ) {
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
  std::cout << std::string("color ") + app->colorName(1) << std::endl;
  std::cout << app->describe(( Message_Ping())) << std::endl;
  std::cout << app->describe(( std::make_shared<Message_Text>(std::string("hi")))) << std::endl;
  std::cout << app->describe(( Message_Move(2, 3))) << std::endl;
  return 0;
}
