#include  <memory>
#include  <cstddef>
#include  <type_traits>
#include  <variant>
#include  <string>
#include  <iostream>
#include  <vector>

// define classes here to avoid compiler errors
class GenericsMain;
class GenericsMain;
class Stack_int;
class Stack_string;

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
typedef std::variant<std::shared_ptr<GenericsMain>, int, std::string, bool, double>  r_union_Any;

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
class GenericsMain { 
  public :
    /* class constructor */ 
    GenericsMain( );
    /* static methods */ 
    static void main();
};
class Stack_int { 
  public :
    std::vector<int> items;
    /* class constructor */ 
    Stack_int( );
    /* instance methods */ 
    void put( int item );
    int size();
     r_optional_primitive<int>  peek();
};
class Stack_string { 
  public :
    std::vector<std::string> items;
    /* class constructor */ 
    Stack_string( );
    /* instance methods */ 
    void put( const std::string& item );
    int size();
    std::string peek();
};

int __g_argc;
char **__g_argv;
GenericsMain::GenericsMain( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<Stack_int> ints =  std::make_shared<Stack_int>();
  ints->put(7);
  ints->put(8);
  std::cout << std::string("int-size ") + std::to_string(ints->size()) << std::endl;
   r_optional_primitive<int>  top = ints->peek();
  std::cout << std::string("int-top ") + std::to_string((top.has_value ? (/*unwrap int*/top.value) : 0)) << std::endl;
  std::shared_ptr<Stack_string> words =  std::make_shared<Stack_string>();
  words->put(std::string("ada"));
  words->put(std::string("grace"));
  std::cout << std::string("str-size ") + std::to_string(words->size()) << std::endl;
  std::string lastWord = words->peek();
  std::cout << std::string("str-top ") + ((lastWord.empty() == false ) ? lastWord : std::string("?")) << std::endl;
  return 0;
}
Stack_int::Stack_int( ) {
}
void  Stack_int::put( int item ) {
  items.push_back( item  );
}
int  Stack_int::size() {
  return (int)(items.size());
}
 r_optional_primitive<int>   Stack_int::peek() {
   r_optional_primitive<int>  found;
  int n = (int)(items.size());
  if ( n == 0 ) {
    return found;
  }
  found  = items.at((n - 1));
  return found;
}
Stack_string::Stack_string( ) {
}
void  Stack_string::put( const std::string& item ) {
  items.push_back( item  );
}
int  Stack_string::size() {
  return (int)(items.size());
}
std::string  Stack_string::peek() {
  std::string found;
  int n = (int)(items.size());
  if ( n == 0 ) {
    return found;
  }
  found  = items.at((n - 1));
  return found;
}
