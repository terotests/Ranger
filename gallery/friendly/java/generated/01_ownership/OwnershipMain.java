import java.io.*;

public class OwnershipMain { 
  
  public static void main(String [] args ) {
    RgArgs.args = args;
    final PointOps ops = new PointOps();
    final Point origin = new Point(3, 4);
    System.out.println(String.valueOf( "manhattan " + String.valueOf(ops.manhattan(origin) ) ) );
    final Point summed = ops.addPoints(origin, origin);
    System.out.println(String.valueOf( "sum.x " + String.valueOf(summed.x ) ) );
    final Counter left = new Counter();
    final Counter alias = left;
    alias.add(1);
    System.out.println(String.valueOf( "shared " + String.valueOf(left.reading() ) ) );
    final TreeNode root = new TreeNode();
    root.name = "root";
    final TreeNode leaf = new TreeNode();
    leaf.name = "leaf";
    root.adopt(leaf);
    System.out.println(String.valueOf( "kids " + String.valueOf(root.childCount() ) ) );
    if ( leaf.parent == null ) {
      System.out.println(String.valueOf( "parent missing" ) );
    } else {
      final TreeNode back = leaf.parent;
      System.out.println(String.valueOf( "parent " + back.name ) );
    }
  }
}
