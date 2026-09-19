#include  <memory>
#include  <cstddef>
#include  <type_traits>
#include  <variant>
#include  <string>
#include  <vector>
#include  <iostream>

// define classes here to avoid compiler errors
class ParseOutcome_Err;
class ParseOutcome_Err;
class ParseOutcome__ops;
class Lookup;
class OptionResultMain;
class ParseOutcome_Ok;
class ParseOutcome_Err;
class ParseOutcome__ops;
class Lookup;
class OptionResultMain;

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
typedef std::variant<ParseOutcome_Ok, std::shared_ptr<ParseOutcome_Err>>  r_union_ParseOutcome;
typedef std::variant<ParseOutcome_Ok, std::shared_ptr<ParseOutcome_Err>, std::shared_ptr<ParseOutcome__ops>, std::shared_ptr<Lookup>, std::shared_ptr<OptionResultMain>, int, std::string, bool, double>  r_union_Any;

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

r_optional_primitive<int> cpp_str_to_int(std::string s) {
    r_optional_primitive<int> result;
    try {
        // Ranger `int` is 64-bit on Go, Rust, Java, Kotlin and Python and 32-bit
        // here, so a literal between INT_MAX and INT64_MAX has no C++ int to
        // land in. stoi threw for those and the value stayed 0 -- the compiler
        // read its own `2147483648` bound as zero. Saturating keeps the sign
        // and the magnitude order, which is what a bound check needs.
        long long wide = std::stoll(s);
        if (wide > 2147483647LL) { wide = 2147483647LL; }
        if (wide < -2147483648LL) { wide = -2147483648LL; }
        result.value = (int)wide;
        result.has_value = true;
    } catch (...) {

    }
    return result;
}

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
class ParseOutcome_Ok { 
  public :
    int value;
    /* class constructor */ 
    ParseOutcome_Ok( int value  );
    /* a value case of a closed family compares by content */ 
    bool operator==(const ParseOutcome_Ok& o) const {
      return value == o.value;
    }
    bool operator!=(const ParseOutcome_Ok& o) const { return !(*this == o); }
};
class ParseOutcome_Err { 
  public :
    std::string message;
    /* class constructor */ 
    ParseOutcome_Err( const std::string& message  );
};
class ParseOutcome__ops { 
  public :
    /* class constructor */ 
    ParseOutcome__ops( );
    /* static methods */ 
    static bool equals( const r_union_ParseOutcome& a , const r_union_ParseOutcome& b );
    static bool notEquals( const r_union_ParseOutcome& a , const r_union_ParseOutcome& b );
};
class Lookup { 
  public :
    /* class constructor */ 
    Lookup( );
    /* instance methods */ 
    std::string findName( const std::vector<std::string>& names , const std::string& key );
    r_union_ParseOutcome parseInt( const std::string& text );
    std::string describe( const r_union_ParseOutcome& r );
};
class OptionResultMain { 
  public :
    /* class constructor */ 
    OptionResultMain( );
    /* static methods */ 
    static void main();
};

int __g_argc;
char **__g_argv;
ParseOutcome_Ok::ParseOutcome_Ok( int value  ) {
  this->value = 0;
  this->value = value;
}
ParseOutcome_Err::ParseOutcome_Err( const std::string& message  ) {
  this->message = message;
}
ParseOutcome__ops::ParseOutcome__ops( ) {
}
bool  ParseOutcome__ops::equals( const r_union_ParseOutcome& a , const r_union_ParseOutcome& b ) {
  if( std::holds_alternative<ParseOutcome_Ok>(a) ) {
    ParseOutcome_Ok __ea0 = std::get<ParseOutcome_Ok>(a);
    if( std::holds_alternative<ParseOutcome_Ok>(b) ) {
      ParseOutcome_Ok __eb0 = std::get<ParseOutcome_Ok>(b);
      if ( __ea0.value != __eb0.value ) {
        return false;
      }
      return true;
    };
    return false;
  };
  if( std::holds_alternative<std::shared_ptr<ParseOutcome_Err>>(a) ) {
    std::shared_ptr<ParseOutcome_Err> __ea1 = std::get<std::shared_ptr<ParseOutcome_Err>>(a);
    if( std::holds_alternative<std::shared_ptr<ParseOutcome_Err>>(b) ) {
      std::shared_ptr<ParseOutcome_Err> __eb1 = std::get<std::shared_ptr<ParseOutcome_Err>>(b);
      if ( (__ea1->message != __eb1->message) ) {
        return false;
      }
      return true;
    };
    return false;
  };
  return false;
}
bool  ParseOutcome__ops::notEquals( const r_union_ParseOutcome& a , const r_union_ParseOutcome& b ) {
  if ( ParseOutcome__ops::equals(a, b) ) {
    return false;
  }
  return true;
}
Lookup::Lookup( ) {
}
std::string  Lookup::findName( const std::vector<std::string>& names , const std::string& key ) {
  std::string found;
  for ( int i = 0; i != (int)(names.size()); i++) {
    std::string n = names.at(i);
    if ( (n == key) ) {
      found  = n;
      return found;
    }
  };
  return found;
}
r_union_ParseOutcome  Lookup::parseInt( const std::string& text ) {
  if ( (std::string_view(text) == std::string_view("", 0)) ) {
    return  std::make_shared<ParseOutcome_Err>(std::string("empty"));
  }
   r_optional_primitive<int>  parsed = cpp_str_to_int(text);
  if ( parsed.has_value == false ) {
    return  std::make_shared<ParseOutcome_Err>(std::string("not a number"));
  }
  return  ParseOutcome_Ok((/*unwrap int*/parsed.value));
}
std::string  Lookup::describe( const r_union_ParseOutcome& r ) {
  std::string out = std::string("?");
  if( std::holds_alternative<ParseOutcome_Ok>(r) ) {
    ParseOutcome_Ok o = std::get<ParseOutcome_Ok>(r);
    out = std::string("ok:") + std::to_string(o.value);
  };
  if( std::holds_alternative<std::shared_ptr<ParseOutcome_Err>>(r) ) {
    std::shared_ptr<ParseOutcome_Err> e = std::get<std::shared_ptr<ParseOutcome_Err>>(r);
    out = std::string("err:") + e->message;
  };
  return out;
}
OptionResultMain::OptionResultMain( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<Lookup> box =  std::make_shared<Lookup>();
  std::vector<std::string> names = std::vector<std::string>{std::string("ada"), std::string("grace")};
  std::string hit = box->findName(names, std::string("ada"));
  std::cout << std::string("found ") + ((hit.empty() == false ) ? hit : std::string("unknown")) << std::endl;
  std::string miss = box->findName(names, std::string("alan"));
  std::cout << std::string("miss ") + ((miss.empty() == false ) ? miss : std::string("unknown")) << std::endl;
  if ( miss.empty() ) {
    std::cout << std::string("miss is empty") << std::endl;
  }
  std::cout << box->describe(box->parseInt(std::string("42"))) << std::endl;
  std::cout << box->describe(box->parseInt(std::string(""))) << std::endl;
  std::cout << box->describe(box->parseInt(std::string("nope"))) << std::endl;
  return 0;
}
