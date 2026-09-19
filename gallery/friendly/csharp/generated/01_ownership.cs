using System;
using System.Collections;
using System.Collections.Generic;
class Point  {
  public int x = 0;
  public int y = 0;
  public Point( int x , int y  ) {
    this.x = x;
    this.y = y;
  }
}
class PointOps  {
  public int manhattan( Point p ) {
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
  public Point addPoints( Point a , Point b ) {
    return new Point(a.x + b.x, a.y + b.y);
  }
}
class Counter  {
  public int value = 0;
  public int reading() {
    return value;
  }
  public void add( int amount ) {
    value = value + amount;
  }
}
class TreeNode  {
  public String name = "";
  public List<TreeNode> kids = new List<TreeNode>();
  public TreeNode parent;
  public void adopt( TreeNode c ) {
    c.parent = this;
    kids.Add(c);
  }
  public int childCount() {
    return kids.Count;
  }
}
class OwnershipMain  {
  static void Main( string [] args ) {
    PointOps ops = new PointOps();
    Point origin = new Point(3, 4);
    Console.WriteLine("manhattan " + ops.manhattan(origin).ToString());
    Point summed = ops.addPoints(origin, origin);
    Console.WriteLine("sum.x " + summed.x.ToString());
    Counter left = new Counter();
    Counter alias = left;
    alias.add(1);
    Console.WriteLine("shared " + left.reading().ToString());
    TreeNode root = new TreeNode();
    root.name = "root";
    TreeNode leaf = new TreeNode();
    leaf.name = "leaf";
    root.adopt(leaf);
    Console.WriteLine("kids " + root.childCount().ToString());
    if ( leaf.parent == null  ) {
      Console.WriteLine("parent missing");
    } else {
      TreeNode back = leaf.parent;
      Console.WriteLine("parent " + back.name);
    }
  }
}
