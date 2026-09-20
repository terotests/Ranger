# -*- coding: utf-8 -*-
from __future__ import annotations
from typing import Optional



class Guarded_Ok:
  def __init__(self, value: int) -> None:
    self._rg_kind = "Guarded_Ok"
    self.value = 0
    self.value = value;
class Guarded_Err:
  def __init__(self, message: str) -> None:
    self._rg_kind = "Guarded_Err"
    self.message = ""
    self.message = message;
class Guarded__ops:
  def __init__(self) -> None:
    pass
  @staticmethod
  def equals(a: Guarded, b: Guarded) -> bool:
    if a is not None and getattr(a, "_rg_kind", None) == "Guarded_Ok":
      __ea0 = a
      if b is not None and getattr(b, "_rg_kind", None) == "Guarded_Ok":
        __eb0 = b
        if __ea0.value != __eb0.value:
          return False;
        return True;
      return False;
    if a is not None and getattr(a, "_rg_kind", None) == "Guarded_Err":
      __ea1 = a
      if b is not None and getattr(b, "_rg_kind", None) == "Guarded_Err":
        __eb1 = b
        if __ea1.message != __eb1.message:
          return False;
        return True;
      return False;
    return False;
  @staticmethod
  def notEquals(a: Guarded, b: Guarded) -> bool:
    if Guarded__ops.equals(a, b):
      return False;
    return True;
class Guard:
  def __init__(self) -> None:
    pass
  def check(self, value: int) -> Guarded:
    if value < 0:
      return Guarded_Err("negative");
    return Guarded_Ok(value);
  def describe(self, g: Guarded) -> str:
    out = "?"
    if g is not None and getattr(g, "_rg_kind", None) == "Guarded_Ok":
      o = g
      out = "ok:" + str(o.value);
    if g is not None and getattr(g, "_rg_kind", None) == "Guarded_Err":
      e = g
      out = "err:" + e.message;
    return out;
class ErrorsMain:
  def __init__(self) -> None:
    pass
# Main entry point
def main():
  g = Guard()
  print(g.describe(g.check(3)))
  print(g.describe(g.check((0 - 1))))
if __name__ == "__main__":
  main()
