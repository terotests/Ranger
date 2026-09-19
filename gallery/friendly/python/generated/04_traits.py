# -*- coding: utf-8 -*-
from __future__ import annotations
from typing import Optional



class User:
  def __init__(self) -> None:
    self.age = 0
    self.name = ""
  def asString(self) -> str:
    return (self.name + " ") + str(self.age);
  def label(self) -> str:
    return self.name;
class Bot:
  def __init__(self) -> None:
    self.name = ""
  def asString(self) -> str:
    return "bot:" + self.name;
  def label(self) -> str:
    return self.name;
class TraitsMain:
  def __init__(self) -> None:
    pass
  def show(self, who: User) -> str:
    return ("label=" + who.label()) + (" text=" + who.asString());
# Main entry point
def main():
  app = TraitsMain()
  u = User()
  u.name = "ada";
  u.age = 36;
  print(app.show(u))
  b = Bot()
  b.name = "r2";
  print(b.asString())
if __name__ == "__main__":
  main()
