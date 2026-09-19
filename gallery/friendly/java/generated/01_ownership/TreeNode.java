import java.util.*;

public class TreeNode { 
  public String name = "";
  public ArrayList<TreeNode> kids = new ArrayList<TreeNode>();
  public TreeNode parent = null;
  
  public void adopt( final TreeNode c ) {
    c.parent = this;
    kids.add(c);
  }
  
  public Integer childCount() {
    return kids.size();
  }
}
