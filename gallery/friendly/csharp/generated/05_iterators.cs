using System;
using System.Collections;
using System.Collections.Generic;
class Stats  {
  public int total( List<int> xs ) {
    int acc = 0;
    foreach ( int v in xs) {
      acc = acc + v;
    }
    return acc;
  }
  public int evenCount( List<int> xs ) {
    int n = 0;
    foreach ( int v in xs) {
      if ( v % 2 == 0 ) {
        n = n + 1;
      }
    }
    return n;
  }
  public List<int> doubled( List<int> xs ) {
    List<int> _out = new List<int>();
    foreach ( int v in xs) {
      _out.Add(v * 2);
    }
    return _out;
  }
  public List<int> applyEach( List<int> xs , Func<int, int> f ) {
    List<int> _out = new List<int>();
    foreach ( int v in xs) {
      int next = f(v);
      _out.Add(next);
    }
    return _out;
  }
}
class IterMain  {
  static void Main( string [] args ) {
    Stats s = new Stats();
    List<int> xs = new List<int> {1, 2, 3, 4};
    Console.WriteLine("sum " + s.total(xs).ToString());
    Console.WriteLine("evens " + s.evenCount(xs).ToString());
    List<int> twice = s.doubled(xs);
    Console.WriteLine("doubled0 " + twice[0].ToString());
    Func<int, int> addOne = ((Func<int, int>)((p) => { 
      return p + 1;
    }));
    List<int> bumped = s.applyEach(xs, addOne);
    Console.WriteLine("bumped0 " + bumped[0].ToString());
  }
}
