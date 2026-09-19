import java.io.*;

public class OptionalParams { 
  
  public static void main(String [] args ) {
    final OptionalParams app = new OptionalParams();
    String hit = null;
    hit = "ada";
    System.out.println(String.valueOf( "name " + app.shown(hit) ) );
    final String miss = null;
    System.out.println(String.valueOf( "miss " + app.shown(miss) ) );
    Integer n = null;
    n = 41;
    System.out.println(String.valueOf( "int " + String.valueOf(app.shownInt(n) ) ) );
    Point p = null;
    final Point pt = new Point();
    pt.x = 7;
    p = pt;
    System.out.println(String.valueOf( "point " + String.valueOf(app.shownPoint(p) ) ) );
  }
  
  public String shown( final String maybe ) {
    if ( maybe == null ) {
      return "unknown";
    }
    return maybe;
  }
  
  public Integer shownInt( final Integer a ) {
    if ( a == null ) {
      return 0;
    }
    final Integer r = a;
    return r;
  }
  
  public Integer shownPoint( final Point p ) {
    if ( p == null ) {
      return 0;
    }
    final Point q = p;
    return q.x;
  }
}
