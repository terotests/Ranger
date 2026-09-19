
class TextTools 
 {
  
  fun  greet( name : String) : String {
    return "hello " + name;
  }
  
  fun  total( xs : MutableList<Int>) : Int {
    var acc : Int  = 0;
    for ( i in xs.indices ) {
      val v = xs[i]
      acc = acc + v;
    }
    return acc;
  }
  
  fun  firstChar( s : String) : String {
    if ( s.length == 0 ) {
      return "";
    }
    return s.substring(0, 1 );
  }
  
  fun  twice( xs : MutableList<Int>) : Int {
    return this.total(xs) + this.total(xs);
  }
}

class SliceMain 
 {
  companion object {
    
  }
}

var __g_args : Array<String> = arrayOf()

fun main(args : Array<String>) {
  __g_args = args
  val t : TextTools  =  TextTools();
  println( t.greet("ada") )
  val xs : MutableList<Int>  = arrayListOf<Int>(1, 2, 3);
  println( "twice " + (t.twice(xs).toString()) )
  println( "first " + t.firstChar("grace") )
}
