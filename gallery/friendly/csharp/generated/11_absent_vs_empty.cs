using System;
class AbsentMain  {
  static void Main( string [] args ) {
    AbsentMain app = new AbsentMain();
    String s = null;
    Console.WriteLine(app.report("unset", s));
    s = "";
    Console.WriteLine(app.report("empty", s));
    Console.WriteLine("empty ?? " + ((s != null) ? s : "FALLBACK"));
    s = "x";
    Console.WriteLine(app.report("set", s));
    int? n = null;
    if ( n == null  ) {
      Console.WriteLine("int unset: absent");
    } else {
      Console.WriteLine("int unset: present");
    }
    n = 0;
    if ( n == null  ) {
      Console.WriteLine("int zero: absent");
    } else {
      Console.WriteLine("int zero: present");
    }
    Console.WriteLine("int zero ?? " + (((n != null) ? ((n).Value) : 99).ToString()));
  }
  public String report( String label , String s ) {
    if ( s == null  ) {
      return label + ": absent";
    }
    return ((label + ": present [") + s) + "]";
  }
}
