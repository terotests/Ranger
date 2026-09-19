
class Point {
  int x = 0;
  int y = 0     /* note: unused */;
}

class OptionalParams {
  
  String shown(String? maybe) {
    if ( maybe == null ) {
      return "unknown";
    }
    return maybe!;
  }
  
  int shownInt(int? a) {
    if ( a == null ) {
      return 0;
    }
    int r = a!;
    return r;
  }
  
  int shownPoint(Point? p) {
    if ( p == null ) {
      return 0;
    }
    Point q = p!;
    return q.x;
  }
}

List<String> __g_args = <String>[];

void main(List<String> args) {
  __g_args = args;
  OptionalParams app =  OptionalParams();
  String? hit = null;
  hit = "ada";
  print( "name " + app.shown(hit) );
  String? miss = null;
  print( "miss " + app.shown(miss) );
  int? n = null;
  n = 41;
  print( "int " + (app.shownInt(n).toString()) );
  Point? p = null;
  Point pt =  Point();
  pt.x = 7;
  p = pt;
  print( "point " + (app.shownPoint(p).toString()) );
}
