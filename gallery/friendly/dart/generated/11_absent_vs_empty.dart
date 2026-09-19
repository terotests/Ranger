
class AbsentMain {
  
  String report(String label, String? s) {
    if ( s == null ) {
      return label + ": absent";
    }
    return ((label + ": present [") + s!) + "]";
  }
}

List<String> __g_args = <String>[];

void main(List<String> args) {
  __g_args = args;
  AbsentMain app =  AbsentMain();
  String? s = null;
  print( app.report("unset", s) );
  s = "";
  print( app.report("empty", s) );
  print( "empty ?? " + ((s != null) ? s! : "FALLBACK") );
  s = "x";
  print( app.report("set", s) );
  int? n = null;
  if ( n == null ) {
    print( "int unset: absent" );
  } else {
    print( "int unset: present" );
  }
  n = 0;
  if ( n == null ) {
    print( "int zero: absent" );
  } else {
    print( "int zero: present" );
  }
  print( "int zero ?? " + (((n != null) ? n! : 99).toString()) );
}
