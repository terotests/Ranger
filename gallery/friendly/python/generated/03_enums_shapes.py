# -*- coding: utf-8 -*-
from __future__ import annotations
from typing import Optional



from enum import IntEnum

class Color(IntEnum):
  Red = 0
  Green = 1
  Blue = 2

class Message_Ping:
  def __init__(self) -> None:
    self._rg_kind = "Message_Ping"
class Message_Text:
  def __init__(self, body: str) -> None:
    self._rg_kind = "Message_Text"
    self.body = ""
    self.body = body;
class Message_Move:
  def __init__(self, dx: int, dy: int) -> None:
    self._rg_kind = "Message_Move"
    self.dx = 0
    self.dy = 0
    self.dx = dx;
    self.dy = dy;
class Message__ops:
  def __init__(self) -> None:
    pass
  @staticmethod
  def equals(a: Message, b: Message) -> bool:
    if a is not None and getattr(a, "_rg_kind", None) == "Message_Ping":
      __ea0 = a
      if b is not None and getattr(b, "_rg_kind", None) == "Message_Ping":
        __eb0 = b
        return True;
      return False;
    if a is not None and getattr(a, "_rg_kind", None) == "Message_Text":
      __ea1 = a
      if b is not None and getattr(b, "_rg_kind", None) == "Message_Text":
        __eb1 = b
        if __ea1.body != __eb1.body:
          return False;
        return True;
      return False;
    if a is not None and getattr(a, "_rg_kind", None) == "Message_Move":
      __ea2 = a
      if b is not None and getattr(b, "_rg_kind", None) == "Message_Move":
        __eb2 = b
        if __ea2.dx != __eb2.dx:
          return False;
        if __ea2.dy != __eb2.dy:
          return False;
        return True;
      return False;
    return False;
  @staticmethod
  def notEquals(a: Message, b: Message) -> bool:
    if Message__ops.equals(a, b):
      return False;
    return True;
class EnumsMain:
  def __init__(self) -> None:
    pass
  def colorName(self, c: Color) -> str:
    if c == Color.Red:
      return "red";
    if c == Color.Green:
      return "green";
    return "blue";
  def describe(self, m: Message) -> str:
    out = "?"
    if m is not None and getattr(m, "_rg_kind", None) == "Message_Ping":
      __match0 = m
      out = "ping";
    if m is not None and getattr(m, "_rg_kind", None) == "Message_Text":
      t = m
      out = "text:" + t.body;
    if m is not None and getattr(m, "_rg_kind", None) == "Message_Move":
      mv = m
      out = ("move:" + str(mv.dx)) + ("," + str(mv.dy));
    return out;
# Main entry point
def main():
  app = EnumsMain()
  print("color " + app.colorName(Color.Green))
  print(app.describe(Message_Ping()))
  print(app.describe(Message_Text("hi")))
  print(app.describe(Message_Move(2, 3)))
if __name__ == "__main__":
  main()
