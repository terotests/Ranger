
interface Named {
  fun label() : String
}

class User : Named 
 {
  @JvmField var uname : String  = ""     /* note: unused */;
  
  override fun  label() : String {
    return "anon";
  }
  
  fun  weight() : Int {
    return 1;
  }
}

class Bot : Named 
 {
  @JvmField var id : Int  = 0     /* note: unused */;
  
  override fun  label() : String {
    return "anon";
  }
}

class TraitsMain 
 {
  
  
  fun  show( n : Named) : String {
    return n.label();
  }
}

var __g_args : Array<String> = arrayOf()

fun main(args : Array<String>) {
  __g_args = args
  val app : TraitsMain  =  TraitsMain();
  val u : User  =  User();
  val b : Bot  =  Bot();
  println( "user " + app.show(u) )
  println( "bot " + app.show(b) )
  println( "weight " + (u.weight().toString()) )
}
