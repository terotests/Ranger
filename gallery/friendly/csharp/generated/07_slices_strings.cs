using System;
using System.Collections;
using System.Collections.Generic;
class TextTools  {
  public String greet( String name ) {
    return "hello " + name;
  }
  public int total( List<int> xs ) {
    int acc = 0;
    foreach ( int v in xs) {
      acc = acc + v;
    }
    return acc;
  }
  public String firstChar( String s ) {
    if ( s.Length == 0 ) {
      return "";
    }
    return s.Substring(0, 1 - 0 );
  }
  public int twice( List<int> xs ) {
    return this.total(xs) + this.total(xs);
  }
}
class SliceMain  {
  static void Main( string [] args ) {
    TextTools t = new TextTools();
    Console.WriteLine(t.greet("ada"));
    List<int> xs = new List<int> {1, 2, 3};
    Console.WriteLine("twice " + t.twice(xs).ToString());
    Console.WriteLine("first " + t.firstChar("grace"));
  }
}
