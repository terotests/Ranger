func ==(l: AbsentMain, r: AbsentMain) -> Bool {
  return l === r
}
final class AbsentMain : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  func report(label : String, s : String?) -> String {
    if ( s == nil ) {
      return label + ": absent"
    }
    return ((label + ": present [") + s!) + "]"
  }
}
// Main entry point
func __main__swift() {
  let app : AbsentMain = AbsentMain()
  var s : String? = nil
  print(app.report(label : "unset", s : s))
  s = "";
  print(app.report(label : "empty", s : s))
  print("empty ?? " + (s ?? "FALLBACK"))
  s = "x";
  print(app.report(label : "set", s : s))
  var n : Int? = nil
  if ( n == nil ) {
    print("int unset: absent")
  } else {
    print("int unset: present")
  }
  n = 0;
  if ( n == nil ) {
    print("int zero: absent")
  } else {
    print("int zero: present")
  }
  print("int zero ?? " + String((n ?? 99)))
}
__main__swift()
