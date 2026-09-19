
class Guard 
 {
  
  fun  mustBePositive( value : Int) : Int {
    if ( value < 0 ) {
      throw Exception("negative")
    }
    return value;
  }
}

class ThrowMain 
 {
  
}

var __g_args : Array<String> = arrayOf()

fun main(args : Array<String>) {
  __g_args = args
  val g : Guard  =  Guard();
  var caught : String  = "none";
  try {
    val ok : Int  = g.mustBePositive(3);
    println( "try_ok " + (ok.toString()) )
  } catch( e : Exception ) {
    caught = (e.message ?: e.toString());
  }
  println( "after_ok " + caught )
  try {
    val bad : Int  = g.mustBePositive((0 - 1));
    println( "try_bad " + (bad.toString()) )
  } catch( e : Exception ) {
    caught = (e.message ?: e.toString());
  }
  println( "after_bad " + caught )
}
