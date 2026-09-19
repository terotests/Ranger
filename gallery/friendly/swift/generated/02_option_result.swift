
enum union_ParseOutcome {
  case ParseOutcome_Ok(ParseOutcome_Ok)
  case ParseOutcome_Err(ParseOutcome_Err)
}
func ==(l: ParseOutcome_Ok, r: ParseOutcome_Ok) -> Bool {
  return l === r
}
final class ParseOutcome_Ok : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var value : Int = 0
  init(value : Int ) {
    self.value = value;
  }
}
func ==(l: ParseOutcome_Err, r: ParseOutcome_Err) -> Bool {
  return l === r
}
final class ParseOutcome_Err : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var message : String = ""
  init(message : String ) {
    self.message = message;
  }
}
func ==(l: ParseOutcome__ops, r: ParseOutcome__ops) -> Bool {
  return l === r
}
final class ParseOutcome__ops : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  class func equals(a : union_ParseOutcome, b : union_ParseOutcome) -> Bool {
    if case let .ParseOutcome_Ok(__ea0) = a { /* union case */
      _ = __ea0
      if case let .ParseOutcome_Ok(__eb0) = b { /* union case */
        _ = __eb0
        if ( __ea0.value != __eb0.value ) {
          return false
        }
        return true
      }
      return false
    }
    if case let .ParseOutcome_Err(__ea1) = a { /* union case */
      _ = __ea1
      if case let .ParseOutcome_Err(__eb1) = b { /* union case */
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
  class func notEquals(a : union_ParseOutcome, b : union_ParseOutcome) -> Bool {
    if ( ParseOutcome__ops.equals(a : a, b : b) ) {
      return false
    }
    return true
  }
}
func ==(l: Lookup, r: Lookup) -> Bool {
  return l === r
}
final class Lookup : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  func findName(names : [String], key : String) -> String? {
    var found : String? = nil
    for n in names {
      if ( n == key ) {
        found = n;
        return found
      }
    }
    return found
  }
  func parseInt(text : String) -> union_ParseOutcome {
    if ( text == "" ) {
      return union_ParseOutcome.ParseOutcome_Err(ParseOutcome_Err(message : "empty"))
    }
    let parsed : Int? = rangerStr2IntPrefix(text)
    if ( parsed == nil ) {
      return union_ParseOutcome.ParseOutcome_Err(ParseOutcome_Err(message : "not a number"))
    }
    return union_ParseOutcome.ParseOutcome_Ok(ParseOutcome_Ok(value : parsed!))
  }
  func describe(r : union_ParseOutcome) -> String {
    var out : String = "?"
    if case let .ParseOutcome_Ok(o) = r { /* union case */
      _ = o
      out = "ok:" + String(o.value);
    }
    if case let .ParseOutcome_Err(e) = r { /* union case */
      _ = e
      out = "err:" + e.message;
    }
    return out
  }
}
func ==(l: OptionResultMain, r: OptionResultMain) -> Bool {
  return l === r
}
final class OptionResultMain : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
}

func rangerStr2IntPrefix(_ s: String) -> Int? {
  var i = s.startIndex
  if i < s.endIndex && s[i] == "-" {
    i = s.index(after: i)
  }
  var end = i
  while end < s.endIndex && s[end].isNumber {
    end = s.index(after: end)
  }
  if end == i {
    return nil
  }
  return Int(s[i..<end])
}

// Main entry point
func __main__swift() {
  let box : Lookup = Lookup()
  let names : [String] = ["ada", "grace"]
  let hit : String? = box.findName(names : names, key : "ada")
  print("found " + (hit ?? "unknown"))
  let miss : String? = box.findName(names : names, key : "alan")
  print("miss " + (miss ?? "unknown"))
  if ( miss == nil ) {
    print("miss is empty")
  }
  print(box.describe(r : box.parseInt(text : "42")))
  print(box.describe(r : box.parseInt(text : "")))
  print(box.describe(r : box.parseInt(text : "nope")))
}
__main__swift()
