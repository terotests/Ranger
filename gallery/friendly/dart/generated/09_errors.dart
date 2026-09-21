
abstract class union_Guarded {}

class Guarded_Ok implements union_Guarded {
  int value = 0;
  
  Guarded_Ok(int value) {
    this.value = value;
  }
}

class Guarded_Err implements union_Guarded {
  String message = "";
  
  Guarded_Err(String message) {
    this.message = message;
  }
}

class Guarded__ops {
  
  static bool equals(union_Guarded a, union_Guarded b) {
    if( a is Guarded_Ok ) /* union case */ {
      Guarded_Ok __ea0 = a as Guarded_Ok;
      if( b is Guarded_Ok ) /* union case */ {
        Guarded_Ok __eb0 = b as Guarded_Ok;
        if ( __ea0.value != __eb0.value ) {
          return false;
        }
        return true;
      }
      return false;
    }
    if( a is Guarded_Err ) /* union case */ {
      Guarded_Err __ea1 = a as Guarded_Err;
      if( b is Guarded_Err ) /* union case */ {
        Guarded_Err __eb1 = b as Guarded_Err;
        if ( __ea1.message != __eb1.message ) {
          return false;
        }
        return true;
      }
      return false;
    }
    return false;
  }
  
  static bool notEquals(union_Guarded a, union_Guarded b) {
    if ( Guarded__ops.equals(a, b) ) {
      return false;
    }
    return true;
  }
}

class Guard {
  
  union_Guarded check(int value) {
    if ( value < 0 ) {
      return  Guarded_Err("negative");
    }
    return  Guarded_Ok(value);
  }
  
  String describe(union_Guarded g) {
    String out = "?";
    if( g is Guarded_Ok ) /* union case */ {
      Guarded_Ok o = g as Guarded_Ok;
      out = "ok:" + (o.value.toString());
    }
    if( g is Guarded_Err ) /* union case */ {
      Guarded_Err e = g as Guarded_Err;
      out = "err:" + e.message;
    }
    return out;
  }
}

class ErrorsMain {
}

List<String> __g_args = <String>[];

void main(List<String> args) {
  __g_args = args;
  Guard g =  Guard();
  print( g.describe(g.check(3)) );
  print( g.describe(g.check(0 - 1)) );
}
