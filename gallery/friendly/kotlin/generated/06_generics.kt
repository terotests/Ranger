
class GenericsMain 
 {
  companion object {
    
  }
}

var __g_args : Array<String> = arrayOf()

fun main(args : Array<String>) {
  __g_args = args
  val ints : Stack_int  =  Stack_int();
  ints.put(7);
  ints.put(8);
  println( "int-size " + (ints.size().toString()) )
  val top : Int?  = ints.peek();
  println( "int-top " + ((if ((top != null)) top!! else 0).toString()) )
  val words : Stack_string  =  Stack_string();
  words.put("ada");
  words.put("grace");
  println( "str-size " + (words.size().toString()) )
  val lastWord : String?  = words.peek();
  println( "str-top " + (if ((lastWord != null)) lastWord!! else "?") )
}

class Stack_int 
 {
  @JvmField var items : MutableList<Int>  = arrayListOf();
  
  fun  put( item : Int) : Unit {
    items.add(item);
  }
  
  fun  size() : Int {
    return items.size;
  }
  
  fun  peek() : Int? {
    var found : Int?  = null;
    val n : Int  = items.size;
    if ( n == 0 ) {
      return found;
    }
    found = items[(n - 1)];
    return found;
  }
  
  fun  _optionalInt( text : String) : Int? {
    return rangerStr2IntPrefix(text);
  }
}

class Stack_string 
 {
  @JvmField var items : MutableList<String>  = arrayListOf();
  
  fun  put( item : String) : Unit {
    items.add(item);
  }
  
  fun  size() : Int {
    return items.size;
  }
  
  fun  peek() : String? {
    var found : String?  = null;
    val n : Int  = items.size;
    if ( n == 0 ) {
      return found;
    }
    found = items[(n - 1)];
    return found;
  }
  
  fun  _optionalInt( text : String) : Int? {
    return rangerStr2IntPrefix(text);
  }
}

fun rangerStr2IntPrefix(s: String): Int? {
  val m = Regex("^-?\\d+").find(s) ?: return null
  return m.value.toIntOrNull()
}

