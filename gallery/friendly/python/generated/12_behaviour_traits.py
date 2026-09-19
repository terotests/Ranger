# -*- coding: utf-8 -*-


class User:
  def __init__(self):
    self.uname = ""
  def label(self):
    return "anon";
  def weight(self):
    return 1;
class Bot:
  def __init__(self):
    self._id = 0
  def label(self):
    return "anon";
class TraitsMain:
  def __init__(self):
    pass
  def show(self, n):
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
