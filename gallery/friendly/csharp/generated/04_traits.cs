using System;
class User  {
  public int age = 0;
  public String name = "";
  public String asString() {
    return (name + " ") + age.ToString();
  }
  public String label() {
    return name;
  }
}
class Bot  {
  public String name = "";
  public String asString() {
    return "bot:" + name;
  }
  public String label() {
    return name;
  }
}
class TraitsMain  {
  static void Main( string [] args ) {
    TraitsMain app = new TraitsMain();
    User u = new User();
    u.name = "ada";
    u.age = 36;
    Console.WriteLine(app.show(u));
    Bot b = new Bot();
    b.name = "r2";
    Console.WriteLine(b.asString());
  }
  public String show( User who ) {
    return ("label=" + who.label()) + (" text=" + who.asString());
  }
}
