
public class RequestBuild { 
  
  public Request withHost( final Request r , final String h ) {
    return new Request(h, r.path, r.port);
  }
  
  public Request withPath( final Request r , final String p ) {
    return new Request(r.host, p, r.port);
  }
  
  public Request withPort( final Request r , final Integer n ) {
    return new Request(r.host, r.path, n);
  }
  
  public String url( final Request r ) {
    return (r.host + ":") + (String.valueOf(r.port ) + r.path);
  }
}
