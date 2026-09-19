func ==(l: Point, r: Point) -> Bool {
  return l === r
}
final class Point : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var x : Int = 0
  var y : Int = 0
  init(x : Int, y : Int ) {
    self.x = x;
    self.y = y;
  }
}
func ==(l: PointOps, r: PointOps) -> Bool {
  return l === r
}
final class PointOps : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  func manhattan(p : Point) -> Int {
    var ax : Int = p.x
    if ( ax < 0 ) {
      ax = 0 - ax;
    }
    var ay : Int = p.y
    if ( ay < 0 ) {
      ay = 0 - ay;
    }
    return ax + ay
  }
  func addPoints(a : Point, b : Point) -> Point {
    return Point(x : a.x + b.x, y : a.y + b.y)
  }
}
func ==(l: Counter, r: Counter) -> Bool {
  return l === r
}
final class Counter : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var value : Int = 0
  func reading() -> Int {
    return self.value
  }
  func add(amount : Int) -> Void {
    self.value = self.value + amount;
  }
}
func ==(l: TreeNode, r: TreeNode) -> Bool {
  return l === r
}
final class TreeNode : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var name : String = ""
  var kids : [TreeNode] = [TreeNode]()
  weak var parent : TreeNode? = nil
  func adopt(c : TreeNode) -> Void {
    c.parent = self;
    self.kids.append(c)
  }
  func childCount() -> Int {
    return self.kids.count
  }
}
func ==(l: OwnershipMain, r: OwnershipMain) -> Bool {
  return l === r
}
final class OwnershipMain : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
}
// Main entry point
func __main__swift() {
  let ops : PointOps = PointOps()
  let origin : Point = Point(x : 3, y : 4)
  print("manhattan " + String(ops.manhattan(p : origin)))
  let summed : Point = ops.addPoints(a : origin, b : origin)
  print("sum.x " + String(summed.x))
  let left : Counter = Counter()
  let alias : Counter = left
  alias.add(amount : 1)
  print("shared " + String(left.reading()))
  let root : TreeNode = TreeNode()
  root.name = "root";
  let leaf : TreeNode = TreeNode()
  leaf.name = "leaf";
  root.adopt(c : leaf)
  print("kids " + String(root.childCount()))
  if ( leaf.parent == nil ) {
    print("parent missing")
  } else {
    let back : TreeNode = leaf.parent!
    print("parent " + back.name)
  }
}
__main__swift()
