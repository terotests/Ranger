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


public interface union_ParseOutcome { }
class ParseOutcome_Ok  : union_ParseOutcome {
  public int value = 0;
  public ParseOutcome_Ok( int value  ) {
    this.value = value;
  }
}
class ParseOutcome_Err  : union_ParseOutcome {
  public String message = "";
  public ParseOutcome_Err( String message  ) {
    this.message = message;
  }
}
class ParseOutcome__ops  {
  public static bool equals( union_ParseOutcome a , union_ParseOutcome b ) {
    if( a is ParseOutcome_Ok ) {
      ParseOutcome_Ok __ea0 = (ParseOutcome_Ok)a;
      if( b is ParseOutcome_Ok ) {
        ParseOutcome_Ok __eb0 = (ParseOutcome_Ok)b;
        if ( __ea0.value != __eb0.value ) {
          return false;
        }
        return true;
      }
      return false;
    }
    if( a is ParseOutcome_Err ) {
      ParseOutcome_Err __ea1 = (ParseOutcome_Err)a;
      if( b is ParseOutcome_Err ) {
        ParseOutcome_Err __eb1 = (ParseOutcome_Err)b;
        if ( __ea1.message != __eb1.message ) {
          return false;
        }
        return true;
      }
      return false;
    }
    return false;
  }
  public static bool notEquals( union_ParseOutcome a , union_ParseOutcome b ) {
    if ( ParseOutcome__ops.equals(a, b) ) {
      return false;
    }
    return true;
  }
}
class Lookup  {
  public String findName( List<String> names , String key ) {
    String found = null;
    foreach ( String n in names) {
      if ( n == key ) {
        found = n;
        return found;
      }
    }
    return found;
  }
  public union_ParseOutcome parseInt( String text ) {
    if ( text == "" ) {
      return new ParseOutcome_Err("empty");
    }
    int? parsed = RgParse.Int(text);
    if ( parsed == null  ) {
      return new ParseOutcome_Err("not a number");
    }
    return new ParseOutcome_Ok(((parsed).Value));
  }
  public String describe( union_ParseOutcome r ) {
    String _out = "?";
    if( r is ParseOutcome_Ok ) {
      ParseOutcome_Ok o = (ParseOutcome_Ok)r;
      _out = "ok:" + o.value.ToString();
    }
    if( r is ParseOutcome_Err ) {
      ParseOutcome_Err e = (ParseOutcome_Err)r;
      _out = "err:" + e.message;
    }
    return _out;
  }
}
class OptionResultMain  {
  static void Main( string [] args ) {
    Lookup box = new Lookup();
    List<String> names = new List<String> {"ada", "grace"};
    String hit = box.findName(names, "ada");
    Console.WriteLine("found " + ((hit != null) ? hit : "unknown"));
    String miss = box.findName(names, "alan");
    Console.WriteLine("miss " + ((miss != null) ? miss : "unknown"));
    if ( miss == null  ) {
      Console.WriteLine("miss is empty");
    }
    Console.WriteLine(box.describe(box.parseInt("42")));
    Console.WriteLine(box.describe(box.parseInt("")));
    Console.WriteLine(box.describe(box.parseInt("nope")));
  }
}
