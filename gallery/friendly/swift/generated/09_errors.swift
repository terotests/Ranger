
enum union_Guarded {
  case Guarded_Ok(Guarded_Ok)
  case Guarded_Err(Guarded_Err)
}
func ==(l: Guarded_Ok, r: Guarded_Ok) -> Bool {
  return l === r
}
final class Guarded_Ok : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var value : Int = 0
  init(value : Int ) {
    self.value = value;
  }
}
func ==(l: Guarded_Err, r: Guarded_Err) -> Bool {
  return l === r
}
final class Guarded_Err : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var message : String = ""
  init(message : String ) {
    self.message = message;
  }
}
func ==(l: Guarded__ops, r: Guarded__ops) -> Bool {
  return l === r
}
final class Guarded__ops : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  class func equals(a : union_Guarded, b : union_Guarded) -> Bool {
    if case let .Guarded_Ok(__ea0) = a { /* union case */
      _ = __ea0
      if case let .Guarded_Ok(__eb0) = b { /* union case */
        _ = __eb0
        if ( __ea0.value != __eb0.value ) {
          return false
        }
        return true
      }
      return false
    }
    if case let .Guarded_Err(__ea1) = a { /* union case */
      _ = __ea1
      if case let .Guarded_Err(__eb1) = b { /* union case */
        _ = __eb1
        if ( __ea1.message != __eb1.message ) {
          return false
        }
        return true
      }
      return false
    }
    return false
  }
  class func notEquals(a : union_Guarded, b : union_Guarded) -> Bool {
    if ( Guarded__ops.equals(a : a, b : b) ) {
      return false
    }
    return true
  }
}
func ==(l: Guard, r: Guard) -> Bool {
  return l === r
}
final class Guard : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  func check(value : Int) -> union_Guarded {
    if ( value < 0 ) {
      return union_Guarded.Guarded_Err(Guarded_Err(message : "negative"))
    }
    return union_Guarded.Guarded_Ok(Guarded_Ok(value : value))
  }
  func describe(g : union_Guarded) -> String {
    var out : String = "?"
    if case let .Guarded_Ok(o) = g { /* union case */
      _ = o
      out = "ok:" + String(o.value);
    }
    if case let .Guarded_Err(e) = g { /* union case */
      _ = e
      out = "err:" + e.message;
    }
    return out
  }
}
func ==(l: ErrorsMain, r: ErrorsMain) -> Bool {
  return l === r
}
final class ErrorsMain : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
}
// Main entry point
func __main__swift() {
  let g : Guard = Guard()
  print(g.describe(g : g.check(value : 3)))
  print(g.describe(g : g.check(value : (0 - 1))))
}
__main__swift()
