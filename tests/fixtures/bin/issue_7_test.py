# -*- coding: utf-8 -*-

class Animal:
  def __init__(self, n):
    self.name = ""
    self.name = n;
  def speak(self):
    print(("Animal " + self.name) + " speaks")
class Dog(Animal):
  def __init__(self, n):
    super().__init__(n)
  def bark(self):
    print(self.name + " says Woof!")
class Main:
  def __init__(self):
    pass
# Main entry point
def main():
  dog = Dog("Buddy")
  dog.speak()
  dog.bark()
  print("Done")
if __name__ == "__main__":
  main()
