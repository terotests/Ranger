
public class MutRequest { 
  public String host = "";
  public String path = "/";
  public Integer port = 80;
  
  public MutRequest withHost( final String h ) {
    host = h;
    return this;
  }
  
  public MutRequest withPath( final String p ) {
    path = p;
    return this;
  }
  
  public MutRequest withPort( final Integer n ) {
    port = n;
    return this;
  }
  
  public String url() {
    return (host + ":") + (String.valueOf(port ) + path);
  }
}
