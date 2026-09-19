import java.io.*;

public class BuilderMain { 
  
  public static void main(String [] args ) {
    RgArgs.args = args;
    final RequestBuild b = new RequestBuild();
    final Request start = new Request("", "/", 80);
    final Request step1 = b.withHost(start, "localhost");
    final Request step2 = b.withPort(step1, 8080);
    final Request done = b.withPath(step2, "/api");
    System.out.println(String.valueOf( "copy " + b.url(done) ) );
    final MutRequest m = new MutRequest();
    final MutRequest chained = m.withHost("localhost").withPort(8080).withPath("/api");
    System.out.println(String.valueOf( "mut " + chained.url() ) );
  }
}
