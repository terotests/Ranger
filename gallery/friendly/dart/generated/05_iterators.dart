
class Stats {
  
  int total(List<int> xs) {
    int acc = 0;
    for ( int i = 0; i < xs.length; i++) {
      var v = xs[i];
      acc = acc + v;
    }
    return acc;
  }
  
  int evenCount(List<int> xs) {
    int n = 0;
    for ( int i = 0; i < xs.length; i++) {
      var v = xs[i];
      if ( v % 2 == 0 ) {
        n = n + 1;
      }
    }
    return n;
  }
  
  List<int> doubled(List<int> xs) {
    List<int> out = [];
    for ( int i = 0; i < xs.length; i++) {
      var v = xs[i];
      out.add(v * 2);
    }
    return out;
  }
  
  List<int> applyEach(List<int> xs, int Function(int) f) {
    List<int> out = [];
    for ( int i = 0; i < xs.length; i++) {
      var v = xs[i];
      int next = f(v);
      out.add(next);
    }
    return out;
  }
}

class IterMain {
}

List<String> __g_args = <String>[];

void main(List<String> args) {
  __g_args = args;
  Stats s =  Stats();
  List<int> xs = [1, 2, 3, 4];
  print( "sum " + (s.total(xs).toString()) );
  print( "evens " + (s.evenCount(xs).toString()) );
  List<int> twice = s.doubled(xs);
  print( "doubled0 " + (twice[0].toString()) );
  int Function(int) addOne = (p) { 
    return p + 1;
  }
  ;
  List<int> bumped = s.applyEach(xs, addOne);
  print( "bumped0 " + (bumped[0].toString()) );
}
