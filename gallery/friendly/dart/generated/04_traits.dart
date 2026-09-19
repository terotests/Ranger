
class User {
  int age = 0;
  String name = "";
  
  String asString() {
    return (name + " ") + (age.toString());
  }
  
  String label() {
    return name;
  }
}

class Bot {
  String name = "";
  
  String asString() {
    return "bot:" + name;
  }
  
  String label() {
    return name;
  }
}

class TraitsMain {
  
  String _show(User who) {
    return ("label=" + who.label()) + (" text=" + who.asString());
  }
}

List<String> __g_args = <String>[];

void main(List<String> args) {
  __g_args = args;
  TraitsMain app =  TraitsMain();
  User u =  User();
  u.name = "ada";
  u.age = 36;
  print( app._show(u) );
  Bot b =  Bot();
  b.name = "r2";
  print( b.asString() );
}
