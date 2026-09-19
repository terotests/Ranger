
def r_str_to_int(s):
  try:
    return int(s)
  except (TypeError, ValueError):
    return None

# -*- coding: utf-8 -*-


class ParseOutcome_Ok:
  def __init__(self, value):
    self._rg_kind = "ParseOutcome_Ok"
    self.value = 0
    self.value = value;
class ParseOutcome_Err:
  def __init__(self, message):
    self._rg_kind = "ParseOutcome_Err"
    self.message = ""
    self.message = message;
class ParseOutcome__ops:
  def __init__(self):
    pass
  @staticmethod
  def equals(a, b):
    if a is not None and getattr(a, "_rg_kind", None) == "ParseOutcome_Ok":
      __ea0 = a
      if b is not None and getattr(b, "_rg_kind", None) == "ParseOutcome_Ok":
        __eb0 = b
        if __ea0.value != __eb0.value:
          return False;
        return True;
      return False;
    if a is not None and getattr(a, "_rg_kind", None) == "ParseOutcome_Err":
      __ea1 = a
      if b is not None and getattr(b, "_rg_kind", None) == "ParseOutcome_Err":
        __eb1 = b
        if __ea1.message != __eb1.message:
          return False;
        return True;
      return False;
    return False;
  @staticmethod
  def notEquals(a, b):
    if ParseOutcome__ops.equals(a, b):
      return False;
    return True;
class Lookup:
  def __init__(self):
    pass
  def findName(self, names, key):
    found = None
    for i, n in enumerate(names):
      if n == key:
        found = n;
        return found;
    return found;
  def parseInt(self, text):
    if text == "":
      return ParseOutcome_Err("empty");
    parsed = r_str_to_int(text)
    if parsed is None:
      return ParseOutcome_Err("not a number");
    return ParseOutcome_Ok(parsed);
  def describe(self, r):
    out = "?"
    if r is not None and getattr(r, "_rg_kind", None) == "ParseOutcome_Ok":
      o = r
      out = "ok:" + str(o.value);
    if r is not None and getattr(r, "_rg_kind", None) == "ParseOutcome_Err":
      e = r
      out = "err:" + e.message;
    return out;
class OptionResultMain:
  def __init__(self):
    pass
# Main entry point
def main():
  box = Lookup()
  names = ["ada", "grace"]
  hit = box.findName(names, "ada")
  print("found " + (hit if (hit is not None) else "unknown"))
  miss = box.findName(names, "alan")
  print("miss " + (miss if (miss is not None) else "unknown"))
  if miss is None:
    print("miss is empty")
  print(box.describe(box.parseInt("42")))
  print(box.describe(box.parseInt("")))
  print(box.describe(box.parseInt("nope")))
if __name__ == "__main__":
  main()
