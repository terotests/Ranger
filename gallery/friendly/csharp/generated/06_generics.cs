using System;
using System.Collections;
using System.Collections.Generic;
class GenericsMain  {
  static void Main( string [] args ) {
    Stack_int ints = new Stack_int();
    ints.put(7);
    ints.put(8);
    Console.WriteLine("int-size " + ints.size().ToString());
    int? top = ints.peek();
    Console.WriteLine("int-top " + ((top ?? 0).ToString()));
    Stack_string words = new Stack_string();
    words.put("ada");
    words.put("grace");
    Console.WriteLine("str-size " + words.size().ToString());
    String lastWord = words.peek();
    Console.WriteLine("str-top " + (lastWord ?? "?"));
  }
}
class Stack_int  {
  public List<int> items = new List<int>();
  public void put( int item ) {
    items.Add(item);
  }
  public int size() {
    return items.Count;
  }
  public int? peek() {
    int? found = null;
    int n = items.Count;
    if ( n == 0 ) {
      return found;
    }
    found = items[(n - 1)];
    return found;
  }
}
class Stack_string  {
  public List<String> items = new List<String>();
  public void put( String item ) {
    items.Add(item);
  }
  public int size() {
    return items.Count;
  }
  public String peek() {
    String found = null;
    int n = items.Count;
    if ( n == 0 ) {
      return found;
    }
    found = items[(n - 1)];
    return found;
  }
}
