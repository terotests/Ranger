func ==(l: GenericsMain, r: GenericsMain) -> Bool {
  return l === r
}
final class GenericsMain : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
}
func ==(l: Stack_int, r: Stack_int) -> Bool {
  return l === r
}
final class Stack_int : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var items : [Int] = [Int]()
  func put(item : Int) -> Void {
    self.items.append(item)
  }
  func size() -> Int {
    return self.items.count
  }
  func peek() -> Int? {
    var found : Int? = nil
    let n : Int = self.items.count
    if ( n == 0 ) {
      return found
    }
    found = self.items[(n - 1)];
    return found
  }
}
func ==(l: Stack_string, r: Stack_string) -> Bool {
  return l === r
}
final class Stack_string : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var items : [String] = [String]()
  func put(item : String) -> Void {
    self.items.append(item)
  }
  func size() -> Int {
    return self.items.count
  }
  func peek() -> String? {
    var found : String? = nil
    let n : Int = self.items.count
    if ( n == 0 ) {
      return found
    }
    found = self.items[(n - 1)];
    return found
  }
}
// Main entry point
func __main__swift() {
  let ints : Stack_int = Stack_int()
  ints.put(item : 7)
  ints.put(item : 8)
  print("int-size " + String(ints.size()))
  let top : Int? = ints.peek()
  print("int-top " + String(((top != nil ) ? top! : 0)))
  let words : Stack_string = Stack_string()
  words.put(item : "ada")
  words.put(item : "grace")
  print("str-size " + String(words.size()))
  let lastWord : String? = words.peek()
  print("str-top " + ((lastWord != nil ) ? lastWord! : "?"))
}
__main__swift()
