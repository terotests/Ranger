# -*- coding: utf-8 -*-


class TextTools:
  def __init__(self):
    pass
  def greet(self, name):
    return "hello " + name;
  def total(self, xs):
    acc = 0
    for v in xs:
      acc = acc + v;
    return acc;
  def firstChar(self, s):
    if len(s) == 0:
      return "";
    return s[0:1];
  def twice(self, xs):
    return self.total(xs) + self.total(xs);
class SliceMain:
  def __init__(self):
    pass
# Main entry point
def main():
  t = TextTools()
  print(t.greet("ada"))
  xs = [1, 2, 3]
  print("twice " + str(t.twice(xs)))
  print("first " + t.firstChar("grace"))
if __name__ == "__main__":
  main()
