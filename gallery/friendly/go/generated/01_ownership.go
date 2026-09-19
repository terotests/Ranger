package main
import (
  "strconv"
  "fmt"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

type Point struct { 
  x int64 `json:"x"` 
  y int64 `json:"y"` 
}

func CreateNew_Point(x int64, y int64) *Point {
  me := new(Point)
  me.x = int64(0)
  me.y = int64(0)
  me.x = x; 
  me.y = y; 
  return me;
}
type PointOps struct { 
}

func CreateNew_PointOps() *PointOps {
  me := new(PointOps)
  return me;
}
func (this *PointOps) manhattan (p *Point) int64 {
  var ax int64= p.x;
  if  ax < int64(0) {
    ax = int64(0) - ax; 
  }
  var ay int64= p.y;
  if  ay < int64(0) {
    ay = int64(0) - ay; 
  }
  return ax + ay
}
func (this *PointOps) addPoints (a *Point, b *Point) *Point {
  return CreateNew_Point(a.x + b.x, a.y + b.y)
}
type Counter struct { 
  value int64 `json:"value"` 
}

func CreateNew_Counter() *Counter {
  me := new(Counter)
  me.value = int64(0)
  return me;
}
func (this *Counter) reading () int64 {
  return this.value
}
func (this *Counter) add (amount int64) () {
  this.value = this.value + amount; 
}
type TreeNode struct { 
  name string `json:"name"` 
  kids []*TreeNode `json:"kids"` 
  parent *GoNullable `json:"parent"` 
}

func CreateNew_TreeNode() *TreeNode {
  me := new(TreeNode)
  me.name = ""
  me.kids = make([]*TreeNode,0)
  me.parent = new(GoNullable);
  return me;
}
func (this *TreeNode) adopt (c *TreeNode) () {
  c.parent.value = this;
  c.parent.has_value = true; /* detected as non-optional */
  this.kids = append(this.kids,c); 
}
func (this *TreeNode) childCount () int64 {
  return int64(len(this.kids))
}
type OwnershipMain struct { 
}

func CreateNew_OwnershipMain() *OwnershipMain {
  me := new(OwnershipMain)
  return me;
}
func main() {
  var ops *PointOps= CreateNew_PointOps(); _ = ops
  var origin *Point= CreateNew_Point(int64(3), int64(4));
  fmt.Println( "manhattan " + strconv.FormatInt(ops.manhattan(origin), 10) )
  var summed *Point= ops.addPoints(origin, origin); _ = summed
  fmt.Println( "sum.x " + strconv.FormatInt(summed.x, 10) )
  var left *Counter= CreateNew_Counter();
  var alias *Counter= left; _ = alias
  alias.add(int64(1));
  fmt.Println( "shared " + strconv.FormatInt(left.reading(), 10) )
  var root *TreeNode= CreateNew_TreeNode(); _ = root
  root.name = "root"; 
  var leaf *TreeNode= CreateNew_TreeNode();
  leaf.name = "leaf"; 
  root.adopt(leaf);
  fmt.Println( "kids " + strconv.FormatInt(root.childCount(), 10) )
  if  !leaf.parent.has_value  {
    fmt.Println( "parent missing" )
  } else {
    var back *TreeNode= leaf.parent.value.(*TreeNode); _ = back
    fmt.Println( "parent " + back.name )
  }
}
