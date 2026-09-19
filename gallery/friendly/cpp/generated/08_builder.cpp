#include  <memory>
#include  <string>
#include  <iostream>

// define classes here to avoid compiler errors
class Request;
class RequestBuild;
class MutRequest;
class BuilderMain;



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
    Request withHost( const Request& r , const std::string& h );
    Request withPath( const Request& r , const std::string& p );
    Request withPort( const Request& r , int n );
    std::string url( const Request& r );
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
Request  RequestBuild::withHost( const Request& r , const std::string& h ) {
  return  Request(h, r.path, r.port);
}
Request  RequestBuild::withPath( const Request& r , const std::string& p ) {
  return  Request(r.host, p, r.port);
}
Request  RequestBuild::withPort( const Request& r , int n ) {
  return  Request(r.host, r.path, n);
}
std::string  RequestBuild::url( const Request& r ) {
  return (r.host + std::string(":")) + (std::to_string(r.port) + r.path);
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
  Request start =  Request(std::string(""), std::string("/"), 80);
  Request step1 = b->withHost(start, std::string("localhost"));
  Request step2 = b->withPort(step1, 8080);
  Request done = b->withPath(step2, std::string("/api"));
  std::cout << std::string("copy ") + b->url(done) << std::endl;
  std::shared_ptr<MutRequest> m =  std::make_shared<MutRequest>();
  std::shared_ptr<MutRequest> chained = m->withHost(std::string("localhost"))
    ->withPort(8080)
    ->withPath(std::string("/api"));
  std::cout << std::string("mut ") + chained->url() << std::endl;
  return 0;
}
