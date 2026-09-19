# -*- coding: utf-8 -*-
from __future__ import annotations
from typing import Optional



class GenericsMain:
  def __init__(self) -> None:
    pass
# Main entry point
def main():
  ints = Stack_int()
  ints.put(7)
  ints.put(8)
  print("int-size " + str(ints.size()))
  top = ints.peek()
  print("int-top " + str((top if (top is not None) else 0)))
  words = Stack_string()
  words.put("ada")
  words.put("grace")
  print("str-size " + str(words.size()))
  lastWord = words.peek()
  print("str-top " + (lastWord if (lastWord is not None) else "?"))
class Stack_int:
  def __init__(self) -> None:
    self.items = []
  def put(self, item: int) -> None:
    self.items.append(item)
  def size(self) -> int:
    return len(self.items);
  def peek(self) -> Optional[int]:
    found = None
    n = len(self.items)
    if n == 0:
      return found;
    found = self.items[(n - 1)];
    return found;
class Stack_string:
  def __init__(self) -> None:
    self.items = []
  def put(self, item: str) -> None:
    self.items.append(item)
  def size(self) -> int:
    return len(self.items);
  def peek(self) -> Optional[str]:
    found = None
    n = len(self.items)
    if n == 0:
      return found;
    found = self.items[(n - 1)];
    return found;
if __name__ == "__main__":
  main()
