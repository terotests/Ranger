
abstract class union_ParseOutcome {}

class ParseOutcome_Ok implements union_ParseOutcome {
  int value = 0;
  
  ParseOutcome_Ok(int value) {
    this.value = value;
  }
}

class ParseOutcome_Err implements union_ParseOutcome {
  String message = "";
  
  ParseOutcome_Err(String message) {
    this.message = message;
  }
}

class ParseOutcome__ops {
  
  static bool equals(union_ParseOutcome a, union_ParseOutcome b) {
    if( a is ParseOutcome_Ok ) /* union case */ {
      ParseOutcome_Ok __ea0 = a as ParseOutcome_Ok;
      if( b is ParseOutcome_Ok ) /* union case */ {
        ParseOutcome_Ok __eb0 = b as ParseOutcome_Ok;
        if ( __ea0.value != __eb0.value ) {
          return false;
        }
        return true;
      }
      return false;
    }
    if( a is ParseOutcome_Err ) /* union case */ {
      ParseOutcome_Err __ea1 = a as ParseOutcome_Err;
      if( b is ParseOutcome_Err ) /* union case */ {
        ParseOutcome_Err __eb1 = b as ParseOutcome_Err;
        if ( __ea1.message != __eb1.message ) {
          return false;
        }
        return true;
      }
      return false;
    }
    return false;
  }
  
  static bool notEquals(union_ParseOutcome a, union_ParseOutcome b) {
    if ( ParseOutcome__ops.equals(a, b) ) {
      return false;
    }
    return true;
  }
}

class Lookup {
  
  String? findName(List<String> names, String key) {
    String? found = null;
    for ( final n in names) {
      if ( n == key ) {
        found = n;
        return found;
      }
    }
    return found;
  }
  
  union_ParseOutcome parseInt(String text) {
    if ( text == "" ) {
      return  ParseOutcome_Err("empty");
    }
    int? parsed = rangerStr2IntPrefix(text);
    if ( parsed == null ) {
      return  ParseOutcome_Err("not a number");
    }
    return  ParseOutcome_Ok(parsed!);
  }
  
  String describe(union_ParseOutcome r) {
    String out = "?";
    if( r is ParseOutcome_Ok ) /* union case */ {
      ParseOutcome_Ok o = r as ParseOutcome_Ok;
      out = "ok:" + (o.value.toString());
    }
    if( r is ParseOutcome_Err ) /* union case */ {
      ParseOutcome_Err e = r as ParseOutcome_Err;
      out = "err:" + e.message;
    }
    return out;
  }
}

class OptionResultMain {
}

List<String> __g_args = <String>[];

void main(List<String> args) {
  __g_args = args;
  Lookup box =  Lookup();
  List<String> names = ["ada", "grace"];
  String? hit = box.findName(names, "ada");
  print( "found " + (hit ?? "unknown") );
  String? miss = box.findName(names, "alan");
  print( "miss " + (miss ?? "unknown") );
  if ( miss == null ) {
    print( "miss is empty" );
  }
  print( box.describe(box.parseInt("42")) );
  print( box.describe(box.parseInt("")) );
  print( box.describe(box.parseInt("nope")) );
}

int? rangerStr2IntPrefix(String s) {
  final m = RegExp(r'^-?\d+').firstMatch(s);
  if (m == null) {
    return null;
  }
  return int.tryParse(m.group(0)!);
}

