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
