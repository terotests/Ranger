using System;
class Point  {
  public int x = 0;
  public int y = 0     /* note: unused */;
}
class OptionalParams  {
  static void Main( string [] args ) {
    OptionalParams app = new OptionalParams();
    String hit = null;
    hit = "ada";
    Console.WriteLine("name " + app.shown(hit));
    String miss = null;
    Console.WriteLine("miss " + app.shown(miss));
    int? n = null;
    n = 41;
    Console.WriteLine("int " + app.shownInt(n).ToString());
    Point p = null;
    Point pt = new Point();
    pt.x = 7;
    p = pt;
    Console.WriteLine("point " + app.shownPoint(p).ToString());
  }
  public String shown( String maybe ) {
    if ( maybe == null  ) {
      return "unknown";
    }
    return maybe;
  }
  public int shownInt( int? a ) {
    if ( a == null  ) {
      return 0;
    }
    int r = (a).Value;
    return r;
  }
  public int shownPoint( Point p ) {
    if ( p == null  ) {
      return 0;
    }
    Point q = p;
    return q.x;
  }
}
