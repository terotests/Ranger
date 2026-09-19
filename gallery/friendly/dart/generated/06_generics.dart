
class GenericsMain {
}

List<String> __g_args = <String>[];

void main(List<String> args) {
  __g_args = args;
  Stack_int ints =  Stack_int();
  ints.put(7);
  ints.put(8);
  print( "int-size " + (ints.size().toString()) );
  int? top = ints.peek();
  print( "int-top " + ((top ?? 0).toString()) );
  Stack_string words =  Stack_string();
  words.put("ada");
  words.put("grace");
  print( "str-size " + (words.size().toString()) );
  String? lastWord = words.peek();
  print( "str-top " + (lastWord ?? "?") );
}

class Stack_int {
  List<int> items = [];
  
  void put(int item) {
    items.add(item);
  }
  
  int size() {
    return items.length;
  }
  
  int? peek() {
    int? found = null;
    int n = items.length;
    if ( n == 0 ) {
      return found;
    }
    found = items[(n - 1)];
    return found;
  }
}

class Stack_string {
  List<String> items = [];
  
  void put(String item) {
    items.add(item);
  }
  
  int size() {
    return items.length;
  }
  
  String? peek() {
    String? found = null;
    int n = items.length;
    if ( n == 0 ) {
      return found;
    }
    found = items[(n - 1)];
    return found;
  }
}
