using System;

public interface Named {
  String label();
}
class User  : Named {
  public String uname = ""     /* note: unused */;
  public String label() {
    return "anon";
  }
  public int weight() {
    return 1;
  }
}
class Bot  : Named {
  public int id = 0     /* note: unused */;
  public String label() {
    return "anon";
  }
}
class TraitsMain  {
  static void Main( string [] args ) {
    TraitsMain app = new TraitsMain();
    User u = new User();
    Bot b = new Bot();
    Console.WriteLine("user " + app.show(u));
    Console.WriteLine("bot " + app.show(b));
    Console.WriteLine("weight " + u.weight().ToString());
  }
  public String show( Named n ) {
    return n.label();
  }
}
