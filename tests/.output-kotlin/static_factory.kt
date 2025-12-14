
class Item {
  var value : String  = "";
  companion object {
    
    fun  create( v : String) : Item {
      val i : Item  =  Item();
      i.value = v;
      return i;
    }
  }
}


class Test_StaticFactory {
  companion object {
    
  }
}

fun main(args : Array<String>) {
  val item : Item  = Item.create("test");
  println( item.value )
  println( "Done" )
}
