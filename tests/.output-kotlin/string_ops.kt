
class StringOpsTest {
  companion object {
    
  }
}

fun main(args : Array<String>) {
  val text : String  = "Hello World";
  val __len : Int  = text.length;
  println( "Length: " + __len.toString() )
  val sub : String  = text.substring(0, 5 );
  println( sub )
  val combined : String  = text + "!";
  println( combined )
  val idx :   = indexOftext"World";
  print+"Index: "idx
  println( "Done" )
}
