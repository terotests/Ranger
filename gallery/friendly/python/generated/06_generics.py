
def r_str_to_int(s):
  try:
    return int(s)
  except (TypeError, ValueError):
    return None

# -*- coding: utf-8 -*-


class GenericsMain:
  def __init__(self):
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
  def __init__(self):
    self.items = []
  def put(self, item):
    self.items.append(item)
  def size(self):
    return len(self.items);
  def peek(self):
    found = None
    n = len(self.items)
    if n == 0:
      return found;
    found = self.items[(n - 1)];
    return found;
  def _optionalInt(self, text):
    return r_str_to_int(text);
class Stack_string:
  def __init__(self):
    self.items = []
  def put(self, item):
    self.items.append(item)
  def size(self):
    return len(self.items);
  def peek(self):
    found = None
    n = len(self.items)
    if n == 0:
      return found;
    found = self.items[(n - 1)];
    return found;
  def _optionalInt(self, text):
    return r_str_to_int(text);
if __name__ == "__main__":
  main()
