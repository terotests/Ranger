
class MathOpsTest 
 {
  companion object {
    
  }
}

fun main(args : Array<String>) {
  val a : Int  = 10;
  val b : Int  = 3;
  val sum : Int  = a + b;
  println( "Sum: " + sum.toString() )
  val diff : Int  = a - b;
  println( "Diff: " + diff.toString() )
  val prod : Int  = a * b;
  println( "Prod: " + prod.toString() )
  val quot : Double  = a / b;
  println( "Quot: " + quot.toString() )
  if ( a > b ) {
    println( "a is greater" )
  }
  if ( a >= 10 ) {
    println( "a is at least 10" )
  }
  val x : Boolean  = true;
  val y : Boolean  = false;
  if ( x && (false == y) ) {
    println( "x is true and y is false" )
  }
  println( "Done" )
}
