
abstract class Named {
  String label();
}

class User implements Named {
  String uname = ""     /* note: unused */;
  
  String label() {
    return "anon";
  }
  
  int weight() {
    return 1;
  }
}

class Bot implements Named {
  int id = 0     /* note: unused */;
  
  String label() {
    return "anon";
  }
}

class TraitsMain {
  
  String _show(Named n) {
    return n.label();
  }
}

List<String> __g_args = <String>[];

void main(List<String> args) {
  __g_args = args;
  TraitsMain app =  TraitsMain();
  User u =  User();
  Bot b =  Bot();
  print( "user " + app._show(u) );
  print( "bot " + app._show(b) );
  print( "weight " + (u.weight().toString()) );
}
