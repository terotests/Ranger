
class Request( host : String, path : String, port : Int ) 
 {
  @JvmField var host : String  = "";
  @JvmField var path : String  = "/";
  @JvmField var port : Int  = 80;
  
  init {
    this.host = host;
    this.path = path;
    this.port = port;
  }
}

class RequestBuild 
 {
  
  fun  withHost( r : Request, h : String) : Request {
    return  Request(h, r.path, r.port);
  }
  
  fun  withPath( r : Request, p : String) : Request {
    return  Request(r.host, p, r.port);
  }
  
  fun  withPort( r : Request, n : Int) : Request {
    return  Request(r.host, r.path, n);
  }
  
  fun  url( r : Request) : String {
    return (r.host + ":") + ((r.port.toString()) + r.path);
  }
}

class MutRequest 
 {
  @JvmField var host : String  = "";
  @JvmField var path : String  = "/";
  @JvmField var port : Int  = 80;
  
  fun  withHost( h : String) : MutRequest {
    host = h;
    return this;
  }
  
  fun  withPath( p : String) : MutRequest {
    path = p;
    return this;
  }
  
  fun  withPort( n : Int) : MutRequest {
    port = n;
    return this;
  }
  
  fun  url() : String {
    return (host + ":") + ((port.toString()) + path);
  }
}

class BuilderMain 
 {
  companion object {
    
  }
}

var __g_args : Array<String> = arrayOf()

fun main(args : Array<String>) {
  __g_args = args
  val b : RequestBuild  =  RequestBuild();
  val start : Request  =  Request("", "/", 80);
  val step1 : Request  = b.withHost(start, "localhost");
  val step2 : Request  = b.withPort(step1, 8080);
  val done : Request  = b.withPath(step2, "/api");
  println( "copy " + b.url(done) )
  val m : MutRequest  =  MutRequest();
  val chained : MutRequest  = m.withHost("localhost").withPort(8080).withPath("/api");
  println( "mut " + chained.url() )
}
