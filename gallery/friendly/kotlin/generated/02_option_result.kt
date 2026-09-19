
sealed interface union_ParseOutcome

class ParseOutcome_Ok( value : Int ) : union_ParseOutcome 
 {
  @JvmField var value : Int  = 0;
  
  init {
    this.value = value;
  }
}

class ParseOutcome_Err( message : String ) : union_ParseOutcome 
 {
  @JvmField var message : String  = "";
  
  init {
    this.message = message;
  }
}

class ParseOutcome__ops 
 {
  companion object {
    
    fun  equals( a : union_ParseOutcome, b : union_ParseOutcome) : Boolean {
      if( a is ParseOutcome_Ok ) /* union case */ {
        val __ea0 : ParseOutcome_Ok = a as ParseOutcome_Ok;
        if( b is ParseOutcome_Ok ) /* union case */ {
          val __eb0 : ParseOutcome_Ok = b as ParseOutcome_Ok;
          if ( __ea0.value != __eb0.value ) {
            return false;
          }
          return true;
        }
        return false;
      }
      if( a is ParseOutcome_Err ) /* union case */ {
        val __ea1 : ParseOutcome_Err = a as ParseOutcome_Err;
        if( b is ParseOutcome_Err ) /* union case */ {
          val __eb1 : ParseOutcome_Err = b as ParseOutcome_Err;
          if ( __ea1.message != __eb1.message ) {
            return false;
          }
          return true;
        }
        return false;
      }
      return false;
    }
    
    fun  notEquals( a : union_ParseOutcome, b : union_ParseOutcome) : Boolean {
      if ( ParseOutcome__ops.equals(a, b) ) {
        return false;
      }
      return true;
    }
  }
}



class Lookup 
 {
  
  fun  findName( names : MutableList<String>, key : String) : String? {
    var found : String?  = null;
    for ( i in names.indices ) {
      val n = names[i]
      if ( n == key ) {
        found = n;
        return found;
      }
    }
    return found;
  }
  
  fun  parseInt( text : String) : union_ParseOutcome {
    if ( text == "" ) {
      return  ParseOutcome_Err("empty");
    }
    val parsed : Int?  = rangerStr2IntPrefix(text);
    if ( parsed== null ) {
      return  ParseOutcome_Err("not a number");
    }
    return  ParseOutcome_Ok(parsed!!);
  }
  
  fun  describe( r : union_ParseOutcome) : String {
    var out : String  = "?";
    if( r is ParseOutcome_Ok ) /* union case */ {
      val o : ParseOutcome_Ok = r as ParseOutcome_Ok;
      out = "ok:" + (o.value.toString());
    }
    if( r is ParseOutcome_Err ) /* union case */ {
      val e : ParseOutcome_Err = r as ParseOutcome_Err;
      out = "err:" + e.message;
    }
    return out;
  }
}

class OptionResultMain 
 {
  companion object {
    
  }
}

var __g_args : Array<String> = arrayOf()

fun main(args : Array<String>) {
  __g_args = args
  val box : Lookup  =  Lookup();
  val names : MutableList<String>  = arrayListOf<String>("ada", "grace");
  val hit : String?  = box.findName(names, "ada");
  println( "found " + (if ((hit != null)) hit!! else "unknown") )
  val miss : String?  = box.findName(names, "alan");
  println( "miss " + (if ((miss != null)) miss!! else "unknown") )
  if ( miss== null ) {
    println( "miss is empty" )
  }
  println( box.describe(box.parseInt("42")) )
  println( box.describe(box.parseInt("")) )
  println( box.describe(box.parseInt("nope")) )
}

fun rangerStr2IntPrefix(s: String): Int? {
  val m = Regex("^-?\\d+").find(s) ?: return null
  return m.value.toIntOrNull()
}

