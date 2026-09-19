# -*- coding: utf-8 -*-


class Stats:
  def __init__(self):
    pass
  def total(self, xs):
    acc = 0
    for i, v in enumerate(xs):
      acc = acc + v;
    return acc;
  def evenCount(self, xs):
    n = 0
    for i, v in enumerate(xs):
      if v % 2 == 0:
        n = n + 1;
    return n;
  def doubled(self, xs):
    out = []
    for i, v in enumerate(xs):
      out.append(v * 2)
    return out;
  def applyEach(self, xs, f):
    out = []
    for i, v in enumerate(xs):
      _next = f(v)
      out.append(_next)
    return out;
class IterMain:
  def __init__(self):
    pass
# Main entry point
def main():
  def __rg_lambda_1(p):
    return p + 1;
  s = Stats()
  xs = [1, 2, 3, 4]
  print("sum " + str(s.total(xs)))
  print("evens " + str(s.evenCount(xs)))
  twice = s.doubled(xs)
  print("doubled0 " + str(twice[0]))
  addOne = __rg_lambda_1
  bumped = s.applyEach(xs, addOne)
  print("bumped0 " + str(bumped[0]))
if __name__ == "__main__":
  main()
