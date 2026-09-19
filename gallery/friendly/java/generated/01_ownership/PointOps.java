
public class PointOps { 
  
  public Integer manhattan( final Point p ) {
    Integer ax = p.x;
    if ( ax < 0 ) {
      ax = 0 - ax;
    }
    Integer ay = p.y;
    if ( ay < 0 ) {
      ay = 0 - ay;
    }
    return ax + ay;
  }
  
  public Point addPoints( final Point a , final Point b ) {
    return new Point(a.x + b.x, a.y + b.y);
  }
}
