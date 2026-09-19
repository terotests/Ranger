
class TextTools {
  
  String greet(String name) {
    return "hello " + name;
  }
  
  int total(List<int> xs) {
    int acc = 0;
    for ( int i = 0; i < xs.length; i++) {
      var v = xs[i];
      acc = acc + v;
    }
    return acc;
  }
  
  String firstChar(String s) {
    if ( s.length == 0 ) {
      return "";
    }
    return s.substring(0, 1 );
  }
  
  int twice(List<int> xs) {
    return this.total(xs) + this.total(xs);
  }
}

class SliceMain {
}

List<String> __g_args = <String>[];

void main(List<String> args) {
  __g_args = args;
  TextTools t =  TextTools();
  print( t.greet("ada") );
  List<int> xs = [1, 2, 3];
  print( "twice " + (t.twice(xs).toString()) );
  print( "first " + t.firstChar("grace") );
}
