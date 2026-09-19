
public class Request { 
  public String host = "";
  public String path = "/";
  public Integer port = 80;
  
  Request( final String host , final String path , final Integer port  ) {
    Request.this.host = host;
    Request.this.path = path;
    Request.this.port = port;
  }
}
