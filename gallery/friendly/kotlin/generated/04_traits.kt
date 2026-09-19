
class User 
 {
  @JvmField var age : Int  = 0;
  @JvmField var name : String  = "";
  
  fun  asString() : String {
    return (name + " ") + (age.toString());
  }
  
  fun  label() : String {
    return name;
  }
}

class Bot 
 {
  @JvmField var name : String  = "";
  
  fun  asString() : String {
    return "bot:" + name;
  }
  
  fun  label() : String {
    return name;
  }
}

class TraitsMain 
 {
  companion object {
    
  }
  
  fun  show( who : User) : String {
    return ("label=" + who.label()) + (" text=" + who.asString());
  }
}

var __g_args : Array<String> = arrayOf()

fun main(args : Array<String>) {
  __g_args = args
  val app : TraitsMain  =  TraitsMain();
  val u : User  =  User();
  u.name = "ada";
  u.age = 36;
  println( app.show(u) )
  val b : Bot  =  Bot();
  b.name = "r2";
  println( b.asString() )
}
