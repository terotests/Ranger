# -*- coding: utf-8 -*-


class User:
  def __init__(self):
    self.age = 0
    self.name = ""
  def asString(self):
    return (self.name + " ") + str(self.age);
  def label(self):
    return self.name;
class Bot:
  def __init__(self):
    self.name = ""
  def asString(self):
    return "bot:" + self.name;
  def label(self):
    return self.name;
class TraitsMain:
  def __init__(self):
    pass
  def show(self, who):
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
