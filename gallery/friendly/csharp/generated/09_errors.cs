using System;

public interface union_Guarded { }
class Guarded_Ok  : union_Guarded {
  public int value = 0;
  public Guarded_Ok( int value  ) {
    this.value = value;
  }
}
class Guarded_Err  : union_Guarded {
  public String message = "";
  public Guarded_Err( String message  ) {
    this.message = message;
  }
}
class Guarded__ops  {
  public static bool equals( union_Guarded a , union_Guarded b ) {
    if( a is Guarded_Ok ) {
      Guarded_Ok __ea0 = (Guarded_Ok)a;
      if( b is Guarded_Ok ) {
        Guarded_Ok __eb0 = (Guarded_Ok)b;
        if ( __ea0.value != __eb0.value ) {
          return false;
        }
        return true;
      }
      return false;
    }
    if( a is Guarded_Err ) {
      Guarded_Err __ea1 = (Guarded_Err)a;
      if( b is Guarded_Err ) {
        Guarded_Err __eb1 = (Guarded_Err)b;
        if ( __ea1.message != __eb1.message ) {
          return false;
        }
        return true;
      }
      return false;
    }
    return false;
  }
  public static bool notEquals( union_Guarded a , union_Guarded b ) {
    if ( Guarded__ops.equals(a, b) ) {
      return false;
    }
    return true;
  }
}
class Guard  {
  public union_Guarded check( int value ) {
    if ( value < 0 ) {
      return new Guarded_Err("negative");
    }
    return new Guarded_Ok(value);
  }
  public String describe( union_Guarded g ) {
    String _out = "?";
    if( g is Guarded_Ok ) {
      Guarded_Ok o = (Guarded_Ok)g;
      _out = "ok:" + o.value.ToString();
    }
    if( g is Guarded_Err ) {
      Guarded_Err e = (Guarded_Err)g;
      _out = "err:" + e.message;
    }
    return _out;
  }
}
class ErrorsMain  {
  static void Main( string [] args ) {
    Guard g = new Guard();
    Console.WriteLine(g.describe(g.check(3)));
    Console.WriteLine(g.describe(g.check((0 - 1))));
  }
}
