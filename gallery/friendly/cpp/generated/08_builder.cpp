#include  <memory>
#include  <cstddef>
#include  <type_traits>
#include  <variant>
#include  <string>
#include  <iostream>

// define classes here to avoid compiler errors
class Request;
class RequestBuild;
class MutRequest;
class BuilderMain;
class Request;
class RequestBuild;
class MutRequest;
class BuilderMain;

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
typedef std::variant<std::shared_ptr<Request>, std::shared_ptr<RequestBuild>, std::shared_ptr<MutRequest>, std::shared_ptr<BuilderMain>, int, std::string, bool, double>  r_union_Any;

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
class Request { 
  public :
    std::string host;
    std::string path;
    int port;
    /* class constructor */ 
    Request( const std::string& host , const std::string& path , int port  );
};
class RequestBuild { 
  public :
    /* class constructor */ 
    RequestBuild( );
    /* instance methods */ 
    std::shared_ptr<Request> withHost( const std::shared_ptr<Request>& r , const std::string& h );
    std::shared_ptr<Request> withPath( const std::shared_ptr<Request>& r , const std::string& p );
    std::shared_ptr<Request> withPort( const std::shared_ptr<Request>& r , int n );
    std::string url( const std::shared_ptr<Request>& r );
};
class MutRequest : public std::enable_shared_from_this<MutRequest>  { 
  public :
    std::string host;
    std::string path;
    int port;
    /* class constructor */ 
    MutRequest( );
    /* instance methods */ 
    std::shared_ptr<MutRequest> withHost( const std::string& h );
    std::shared_ptr<MutRequest> withPath( const std::string& p );
    std::shared_ptr<MutRequest> withPort( int n );
    std::string url();
};
class BuilderMain { 
  public :
    /* class constructor */ 
    BuilderMain( );
    /* static methods */ 
    static void main();
};

int __g_argc;
char **__g_argv;
Request::Request( const std::string& host , const std::string& path , int port  ) {
  this->path = std::string("/");
  this->port = 80;
  this->host = host;
  this->path = path;
  this->port = port;
}
RequestBuild::RequestBuild( ) {
}
std::shared_ptr<Request>  RequestBuild::withHost( const std::shared_ptr<Request>& r , const std::string& h ) {
  return  std::make_shared<Request>(h, r->path, r->port);
}
std::shared_ptr<Request>  RequestBuild::withPath( const std::shared_ptr<Request>& r , const std::string& p ) {
  return  std::make_shared<Request>(r->host, p, r->port);
}
std::shared_ptr<Request>  RequestBuild::withPort( const std::shared_ptr<Request>& r , int n ) {
  return  std::make_shared<Request>(r->host, r->path, n);
}
std::string  RequestBuild::url( const std::shared_ptr<Request>& r ) {
  return (r->host + std::string(":")) + (std::to_string(r->port) + r->path);
}
MutRequest::MutRequest( ) {
  this->path = std::string("/");
  this->port = 80;
}
std::shared_ptr<MutRequest>  MutRequest::withHost( const std::string& h ) {
  host = h;
  return shared_from_this();
}
std::shared_ptr<MutRequest>  MutRequest::withPath( const std::string& p ) {
  path = p;
  return shared_from_this();
}
std::shared_ptr<MutRequest>  MutRequest::withPort( int n ) {
  port = n;
  return shared_from_this();
}
std::string  MutRequest::url() {
  return (host + std::string(":")) + (std::to_string(port) + path);
}
BuilderMain::BuilderMain( ) {
}
int main(int argc, char* argv[]) {
  __g_argc = argc;
  __g_argv = argv;
  std::shared_ptr<RequestBuild> b =  std::make_shared<RequestBuild>();
  std::shared_ptr<Request> start =  std::make_shared<Request>(std::string(""), std::string("/"), 80);
  std::shared_ptr<Request> step1 = b->withHost(start, std::string("localhost"));
  std::shared_ptr<Request> step2 = b->withPort(step1, 8080);
  std::shared_ptr<Request> done = b->withPath(step2, std::string("/api"));
  std::cout << std::string("copy ") + b->url(done) << std::endl;
  std::shared_ptr<MutRequest> m =  std::make_shared<MutRequest>();
  std::shared_ptr<MutRequest> chained = m->withHost(std::string("localhost"))
    ->withPort(8080)
    ->withPath(std::string("/api"));
  std::cout << std::string("mut ") + chained->url() << std::endl;
  return 0;
}
