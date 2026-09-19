# -*- coding: utf-8 -*-
from __future__ import annotations
from typing import Optional



class TextTools:
  def __init__(self) -> None:
    pass
  def greet(self, name: str) -> str:
    return "hello " + name;
  def total(self, xs: list[int]) -> int:
    acc = 0
    for v in xs:
      acc = acc + v;
    return acc;
  def firstChar(self, s: str) -> str:
    if len(s) == 0:
      return "";
    return s[0:1];
  def twice(self, xs: list[int]) -> int:
    return self.total(xs) + self.total(xs);
class SliceMain:
  def __init__(self) -> None:
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
