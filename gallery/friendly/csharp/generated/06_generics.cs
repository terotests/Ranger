using System;
using System.Collections;
using System.Collections.Generic;

// str2int and str2double return an OPTIONAL, so the C# entry has to be int? and
// double?; Parse returned the plain value and threw on bad input, so `unwrap`
// wrote .Value on an int and did not compile.
static class RgParse {
  public static int? Int(string s) {
    long wide;
    if (!long.TryParse(s, System.Globalization.NumberStyles.Integer, System.Globalization.CultureInfo.InvariantCulture, out wide)) {
      return null;
    }
    // Ranger `int` is 64-bit on Go, Rust, Java, Kotlin and Python and 32-bit
    // here, so a literal between int.MaxValue and long.MaxValue has no C# int to
    // land in. Saturating keeps the sign and the magnitude order, which is what
    // a bound check needs -- the C++ target does the same.
    if (wide > 2147483647L) { wide = 2147483647L; }
    if (wide < -2147483647L - 1L) { wide = -2147483647L - 1L; }
    return (int)wide;
  }
  public static double? Double(string s) {
    double v;
    if (double.TryParse(s, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out v)) {
      return v;
    }
    return null;
  }
}

class GenericsMain  {
  static void Main( string [] args ) {
    Stack_int ints = new Stack_int();
    ints.put(7);
    ints.put(8);
    Console.WriteLine("int-size " + ints.size().ToString());
    int? top = ints.peek();
    Console.WriteLine("int-top " + (((top != null) ? ((top).Value) : 0).ToString()));
    Stack_string words = new Stack_string();
    words.put("ada");
    words.put("grace");
    Console.WriteLine("str-size " + words.size().ToString());
    String lastWord = words.peek();
    Console.WriteLine("str-top " + ((lastWord != null) ? lastWord : "?"));
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
  public int? _optionalInt( String text ) {
    return RgParse.Int(text);
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
  public int? _optionalInt( String text ) {
    return RgParse.Int(text);
  }
}
