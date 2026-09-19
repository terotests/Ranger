# -*- coding: utf-8 -*-


class AbsentMain:
  def __init__(self):
    pass
  def report(self, label, s):
    if s is None:
      return label + ": absent";
    return ((label + ": present [") + s) + "]";
# Main entry point
def main():
  app = AbsentMain()
  s = None
  print(app.report("unset", s))
  s = "";
  print(app.report("empty", s))
  print("empty ?? " + (s if (s is not None) else "FALLBACK"))
  s = "x";
  print(app.report("set", s))
  n = None
  if n is None:
    print("int unset: absent")
  else:
    print("int unset: present")
  n = 0;
  if n is None:
    print("int zero: absent")
  else:
    print("int zero: present")
  print("int zero ?? " + str((n if (n is not None) else 99)))
if __name__ == "__main__":
  main()
