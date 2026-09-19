# -*- coding: utf-8 -*-


class Point:
  def __init__(self):
    self.x = 0
    self.y = 0
class OptionalParams:
  def __init__(self):
    pass
  def shown(self, maybe):
    if maybe is None:
      return "unknown";
    return maybe;
  def shownInt(self, a):
    if a is None:
      return 0;
    r = a
    return r;
  def shownPoint(self, p):
    if p is None:
      return 0;
    q = p
    return q.x;
# Main entry point
def main():
  app = OptionalParams()
  hit = None
  hit = "ada";
  print("name " + app.shown(hit))
  miss = None
  print("miss " + app.shown(miss))
  n = None
  n = 41;
  print("int " + str(app.shownInt(n)))
  p = None
  pt = Point()
  pt.x = 7;
  p = pt;
  print("point " + str(app.shownPoint(p)))
if __name__ == "__main__":
  main()
