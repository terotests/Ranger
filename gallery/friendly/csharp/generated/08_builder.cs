using System;
class Request  {
  public String host = "";
  public String path = "/";
  public int port = 80;
  public Request( String host , String path , int port  ) {
    this.host = host;
    this.path = path;
    this.port = port;
  }
}
class RequestBuild  {
  public Request withHost( Request r , String h ) {
    return new Request(h, r.path, r.port);
  }
  public Request withPath( Request r , String p ) {
    return new Request(r.host, p, r.port);
  }
  public Request withPort( Request r , int n ) {
    return new Request(r.host, r.path, n);
  }
  public String url( Request r ) {
    return (r.host + ":") + (r.port.ToString() + r.path);
  }
}
class MutRequest  {
  public String host = "";
  public String path = "/";
  public int port = 80;
  public MutRequest withHost( String h ) {
    host = h;
    return this;
  }
  public MutRequest withPath( String p ) {
    path = p;
    return this;
  }
  public MutRequest withPort( int n ) {
    port = n;
    return this;
  }
  public String url() {
    return (host + ":") + (port.ToString() + path);
  }
}
class BuilderMain  {
  static void Main( string [] args ) {
    RequestBuild b = new RequestBuild();
    Request start = new Request("", "/", 80);
    Request step1 = b.withHost(start, "localhost");
    Request step2 = b.withPort(step1, 8080);
    Request done = b.withPath(step2, "/api");
    Console.WriteLine("copy " + b.url(done));
    MutRequest m = new MutRequest();
    MutRequest chained = m.withHost("localhost").withPort(8080).withPath("/api");
    Console.WriteLine("mut " + chained.url());
  }
}
