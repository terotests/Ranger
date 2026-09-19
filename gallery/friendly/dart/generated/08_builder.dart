
class Request {
  String host = "";
  String path = "/";
  int port = 80;
  
  Request(String host, String path, int port) {
    this.host = host;
    this.path = path;
    this.port = port;
  }
}

class RequestBuild {
  
  Request withHost(Request r, String h) {
    return  Request(h, r.path, r.port);
  }
  
  Request withPath(Request r, String p) {
    return  Request(r.host, p, r.port);
  }
  
  Request withPort(Request r, int n) {
    return  Request(r.host, r.path, n);
  }
  
  String url(Request r) {
    return (r.host + ":") + ((r.port.toString()) + r.path);
  }
}

class MutRequest {
  String host = "";
  String path = "/";
  int port = 80;
  
  MutRequest withHost(String h) {
    host = h;
    return this;
  }
  
  MutRequest withPath(String p) {
    path = p;
    return this;
  }
  
  MutRequest withPort(int n) {
    port = n;
    return this;
  }
  
  String url() {
    return (host + ":") + ((port.toString()) + path);
  }
}

class BuilderMain {
}

List<String> __g_args = <String>[];

void main(List<String> args) {
  __g_args = args;
  RequestBuild b =  RequestBuild();
  Request start =  Request("", "/", 80);
  Request step1 = b.withHost(start, "localhost");
  Request step2 = b.withPort(step1, 8080);
  Request done = b.withPath(step2, "/api");
  print( "copy " + b.url(done) );
  MutRequest m =  MutRequest();
  MutRequest chained = m.withHost("localhost").withPort(8080).withPath("/api");
  print( "mut " + chained.url() );
}
