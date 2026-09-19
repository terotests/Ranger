
sealed interface union_Guarded

class Guarded_Ok( value : Int ) : union_Guarded 
 {
  @JvmField var value : Int  = 0;
  
  init {
    this.value = value;
  }
}

class Guarded_Err( message : String ) : union_Guarded 
 {
  @JvmField var message : String  = "";
  
  init {
    this.message = message;
  }
}

class Guarded__ops 
 {
  companion object {
    
    fun  equals( a : union_Guarded, b : union_Guarded) : Boolean {
      if( a is Guarded_Ok ) /* union case */ {
        val __ea0 : Guarded_Ok = a as Guarded_Ok;
        if( b is Guarded_Ok ) /* union case */ {
          val __eb0 : Guarded_Ok = b as Guarded_Ok;
          if ( __ea0.value != __eb0.value ) {
            return false;
          }
          return true;
        }
        return false;
      }
      if( a is Guarded_Err ) /* union case */ {
        val __ea1 : Guarded_Err = a as Guarded_Err;
        if( b is Guarded_Err ) /* union case */ {
          val __eb1 : Guarded_Err = b as Guarded_Err;
          if ( __ea1.message != __eb1.message ) {
            return false;
          }
          return true;
        }
        return false;
      }
      return false;
    }
    
    fun  notEquals( a : union_Guarded, b : union_Guarded) : Boolean {
      if ( Guarded__ops.equals(a, b) ) {
        return false;
      }
      return true;
    }
  }
}



class Guard 
 {
  
  fun  check( value : Int) : union_Guarded {
    if ( value < 0 ) {
      return  Guarded_Err("negative");
    }
    return  Guarded_Ok(value);
  }
  
  fun  describe( g : union_Guarded) : String {
    var out : String  = "?";
    if( g is Guarded_Ok ) /* union case */ {
      val o : Guarded_Ok = g as Guarded_Ok;
      out = "ok:" + (o.value.toString());
    }
    if( g is Guarded_Err ) /* union case */ {
      val e : Guarded_Err = g as Guarded_Err;
      out = "err:" + e.message;
    }
    return out;
  }
}

class ErrorsMain 
 {
  
}

var __g_args : Array<String> = arrayOf()

fun main(args : Array<String>) {
  __g_args = args
  val g : Guard  =  Guard();
  println( g.describe(g.check(3)) )
  println( g.describe(g.check((0 - 1))) )
}
