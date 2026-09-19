
class AbsentMain 
 {
  
  
  fun  report( label : String, s : String?) : String {
    if ( s== null ) {
      return label + ": absent";
    }
    return ((label + ": present [") + s!!) + "]";
  }
}

var __g_args : Array<String> = arrayOf()

fun main(args : Array<String>) {
  __g_args = args
  val app : AbsentMain  =  AbsentMain();
  var s : String?  = null;
  println( app.report("unset", s) )
  s = "";
  println( app.report("empty", s) )
  println( "empty ?? " + (if ((s != null)) s!! else "FALLBACK") )
  s = "x";
  println( app.report("set", s) )
  var n : Int?  = null;
  if ( n== null ) {
    println( "int unset: absent" )
  } else {
    println( "int unset: present" )
  }
  n = 0;
  if ( n== null ) {
    println( "int zero: absent" )
  } else {
    println( "int zero: present" )
  }
  println( "int zero ?? " + ((if ((n != null)) n!! else 99).toString()) )
}
