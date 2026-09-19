
class Point( x : Int, y : Int ) 
 {
  @JvmField var x : Int  = 0;
  @JvmField var y : Int  = 0;
  
  init {
    this.x = x;
    this.y = y;
  }
}

class PointOps 
 {
  
  fun  manhattan( p : Point) : Int {
    var ax : Int  = p.x;
    if ( ax < 0 ) {
      ax = 0 - ax;
    }
    var ay : Int  = p.y;
    if ( ay < 0 ) {
      ay = 0 - ay;
    }
    return ax + ay;
  }
  
  fun  addPoints( a : Point, b : Point) : Point {
    return  Point(a.x + b.x, a.y + b.y);
  }
}

class Counter 
 {
  @JvmField var value : Int  = 0;
  
  fun  reading() : Int {
    return value;
  }
  
  fun  add( amount : Int) : Unit {
    value = value + amount;
  }
}

class TreeNode 
 {
  @JvmField var name : String  = "";
  @JvmField var kids : MutableList<TreeNode>  = arrayListOf();
  @JvmField var parent : TreeNode?  = null;
  
  fun  adopt( c : TreeNode) : Unit {
    c.parent = this;
    kids.add(c);
  }
  
  fun  childCount() : Int {
    return kids.size;
  }
}

class OwnershipMain 
 {
  companion object {
    
  }
}

var __g_args : Array<String> = arrayOf()

fun main(args : Array<String>) {
  __g_args = args
  val ops : PointOps  =  PointOps();
  val origin : Point  =  Point(3, 4);
  println( "manhattan " + (ops.manhattan(origin).toString()) )
  val summed : Point  = ops.addPoints(origin, origin);
  println( "sum.x " + (summed.x.toString()) )
  val left : Counter  =  Counter();
  val alias : Counter  = left;
  alias.add(1);
  println( "shared " + (left.reading().toString()) )
  val root : TreeNode  =  TreeNode();
  root.name = "root";
  val leaf : TreeNode  =  TreeNode();
  leaf.name = "leaf";
  root.adopt(leaf);
  println( "kids " + (root.childCount().toString()) )
  if ( leaf.parent== null ) {
    println( "parent missing" )
  } else {
    val back : TreeNode  = leaf.parent!!;
    println( "parent " + back.name )
  }
}
