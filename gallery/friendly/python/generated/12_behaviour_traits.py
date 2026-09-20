# -*- coding: utf-8 -*-
from __future__ import annotations
from typing import Optional



from typing import Protocol

class Named(Protocol):
  def label(self) -> str: ...

class User:
  def __init__(self) -> None:
    self.uname = ""
  def label(self) -> str:
    return "anon";
  def weight(self) -> int:
    return 1;
class Bot:
  def __init__(self) -> None:
    self._id = 0
  def label(self) -> str:
    return "anon";
class TraitsMain:
  def __init__(self) -> None:
    pass
  def show(self, n: Named) -> str:
    return n.label();
# Main entry point
def main():
  app = TraitsMain()
  u = User()
  b = Bot()
  print("user " + app.show(u))
  print("bot " + app.show(b))
  print("weight " + str(u.weight()))
if __name__ == "__main__":
  main()
