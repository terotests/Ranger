# -*- coding: utf-8 -*-


class Point:
  def __init__(self, x, y):
    self.x = 0
    self.y = 0
    self.x = x;
    self.y = y;
class PointOps:
  def __init__(self):
    pass
  def manhattan(self, p):
    ax = p.x
    if ax < 0:
      ax = 0 - ax;
    ay = p.y
    if ay < 0:
      ay = 0 - ay;
    return ax + ay;
  def addPoints(self, a, b):
    return Point(a.x + b.x, a.y + b.y);
class Counter:
  def __init__(self):
    self.value = 0
  def reading(self):
    return self.value;
  def add(self, amount):
    self.value = self.value + amount;
class TreeNode:
  def __init__(self):
    self.name = ""
    self.kids = []
    self.parent = None
  def adopt(self, c):
    c.parent = self;
    self.kids.append(c)
  def childCount(self):
    return len(self.kids);
class OwnershipMain:
  def __init__(self):
    pass
# Main entry point
def main():
  ops = PointOps()
  origin = Point(3, 4)
  print("manhattan " + str(ops.manhattan(origin)))
  summed = ops.addPoints(origin, origin)
  print("sum.x " + str(summed.x))
  left = Counter()
  alias = left
  alias.add(1)
  print("shared " + str(left.reading()))
  root = TreeNode()
  root.name = "root";
  leaf = TreeNode()
  leaf.name = "leaf";
  root.adopt(leaf)
  print("kids " + str(root.childCount()))
  if leaf.parent is None:
    print("parent missing")
  else:
    back = leaf.parent
    print("parent " + back.name)
if __name__ == "__main__":
  main()
