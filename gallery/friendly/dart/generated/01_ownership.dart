
class Point {
  int x = 0;
  int y = 0;
  
  Point(int x, int y) {
    this.x = x;
    this.y = y;
  }
}

class PointOps {
  
  int manhattan(Point p) {
    int ax = p.x;
    if ( ax < 0 ) {
      ax = 0 - ax;
    }
    int ay = p.y;
    if ( ay < 0 ) {
      ay = 0 - ay;
    }
    return ax + ay;
  }
  
  Point addPoints(Point a, Point b) {
    return  Point(a.x + b.x, a.y + b.y);
  }
}

class Counter {
  int value = 0;
  
  int reading() {
    return value;
  }
  
  void add(int amount) {
    value = value + amount;
  }
}

class TreeNode {
  String name = "";
  List<TreeNode> kids = [];
  TreeNode? parent = null;
  
  void adopt(TreeNode c) {
    c.parent = this;
    kids.add(c);
  }
  
  int childCount() {
    return kids.length;
  }
}

class OwnershipMain {
}

List<String> __g_args = <String>[];

void main(List<String> args) {
  __g_args = args;
  PointOps ops =  PointOps();
  Point origin =  Point(3, 4);
  print( "manhattan " + (ops.manhattan(origin).toString()) );
  Point summed = ops.addPoints(origin, origin);
  print( "sum.x " + (summed.x.toString()) );
  Counter left =  Counter();
  Counter alias = left;
  alias.add(1);
  print( "shared " + (left.reading().toString()) );
  TreeNode root =  TreeNode();
  root.name = "root";
  TreeNode leaf =  TreeNode();
  leaf.name = "leaf";
  root.adopt(leaf);
  print( "kids " + (root.childCount().toString()) );
  if ( leaf.parent == null ) {
    print( "parent missing" );
  } else {
    TreeNode back = leaf.parent!;
    print( "parent " + back.name );
  }
}
