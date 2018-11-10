using System;
class SomeClass  {
  public int x     /** note: unused */;
}
class any_tester  {
  static void Main( string [] args ) {
    any_tester o = new any_tester();
    Console.WriteLine(o.myFn(("Hello")));
    Console.WriteLine(o.myFn((new SomeClass())));
    SomeClass obj2 = new SomeClass();
    Console.WriteLine(o.myFn((obj2)));
  }
  public static void testfn() {
    any_tester o = new any_tester();
    Console.WriteLine(o.myFn(("Hello")));
    Console.WriteLine(o.myFn((new SomeClass())));
    SomeClass obj2 = new SomeClass();
    Console.WriteLine(o.myFn((obj2)));
  }
  public String myFn( dynamic x ) {
    if( x is String ) {
      String str = (String)x;
      return "string";
    }
    if( x is SomeClass ) {
      SomeClass c = (SomeClass)x;
      return "SomeClass";
    }
    return "";
  }
}
