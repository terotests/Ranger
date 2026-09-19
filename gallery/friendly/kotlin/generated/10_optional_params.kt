
class Point 
 {
  @JvmField var x : Int  = 0;
  @JvmField var y : Int  = 0     /* note: unused */;
}

class OptionalParams 
 {
  companion object {
    
  }
  
  fun  shown( maybe : String?) : String {
    if ( maybe== null ) {
      return "unknown";
    }
    return maybe!!;
  }
  
  fun  shownInt( a : Int?) : Int {
    if ( a== null ) {
      return 0;
    }
    val r : Int  = a!!;
    return r;
  }
  
  fun  shownPoint( p : Point?) : Int {
    if ( p== null ) {
      return 0;
    }
    val q : Point  = p!!;
    return q.x;
  }
}

var __g_args : Array<String> = arrayOf()

fun main(args : Array<String>) {
  __g_args = args
  val app : OptionalParams  =  OptionalParams();
  var hit : String?  = null;
  hit = "ada";
  println( "name " + app.shown(hit) )
  val miss : String?  = null;
  println( "miss " + app.shown(miss) )
  var n : Int?  = null;
  n = 41;
  println( "int " + (app.shownInt(n).toString()) )
  var p : Point?  = null;
  val pt : Point  =  Point();
  pt.x = 7;
  p = pt;
  println( "point " + (app.shownPoint(p).toString()) )
}
