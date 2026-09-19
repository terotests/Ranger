
class Stats 
 {
  
  fun  total( xs : MutableList<Int>) : Int {
    var acc : Int  = 0;
    for ( v in xs ) {
      acc = acc + v;
    }
    return acc;
  }
  
  fun  evenCount( xs : MutableList<Int>) : Int {
    var n : Int  = 0;
    for ( v in xs ) {
      if ( v % 2 == 0 ) {
        n = n + 1;
      }
    }
    return n;
  }
  
  fun  doubled( xs : MutableList<Int>) : MutableList<Int> {
    var out : MutableList<Int>  = arrayListOf();
    for ( v in xs ) {
      out.add(v * 2);
    }
    return out;
  }
  
  fun  applyEach( xs : MutableList<Int>, f : (Int) -> Int) : MutableList<Int> {
    var out : MutableList<Int>  = arrayListOf();
    for ( v in xs ) {
      val next : Int  = f(v);
      out.add(next);
    }
    return out;
  }
}

class IterMain 
 {
  
}

var __g_args : Array<String> = arrayOf()

fun main(args : Array<String>) {
  __g_args = args
  val s : Stats  =  Stats();
  val xs : MutableList<Int>  = arrayListOf<Int>(1, 2, 3, 4);
  println( "sum " + (s.total(xs).toString()) )
  println( "evens " + (s.evenCount(xs).toString()) )
  val twice : MutableList<Int>  = s.doubled(xs);
  println( "doubled0 " + (twice[0].toString()) )
  val addOne : (Int) -> Int  = fun(p : Int) : Int {
    return p + 1;
  };
  val bumped : MutableList<Int>  = s.applyEach(xs, addOne);
  println( "bumped0 " + (bumped[0].toString()) )
}
