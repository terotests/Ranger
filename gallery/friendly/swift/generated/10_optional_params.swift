func ==(l: Point, r: Point) -> Bool {
  return l === r
}
final class Point : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var x : Int = 0
  var y : Int = 0     /* note: unused */
}
func ==(l: OptionalParams, r: OptionalParams) -> Bool {
  return l === r
}
final class OptionalParams : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  func shown(maybe : String?) -> String {
    if ( maybe == nil ) {
      return "unknown"
    }
    return maybe!
  }
  func shownInt(a : Int?) -> Int {
    if ( a == nil ) {
      return 0
    }
    let r : Int = a!
    return r
  }
  func shownPoint(p : Point?) -> Int {
    if ( p == nil ) {
      return 0
    }
    let q : Point = p!
    return q.x
  }
}
// Main entry point
func __main__swift() {
  let app : OptionalParams = OptionalParams()
  var hit : String? = nil
  hit = "ada";
  print("name " + app.shown(maybe : hit))
  let miss : String? = nil
  print("miss " + app.shown(maybe : miss))
  var n : Int? = nil
  n = 41;
  print("int " + String(app.shownInt(a : n)))
  var p : Point? = nil
  let pt : Point = Point()
  pt.x = 7;
  p = pt;
  print("point " + String(app.shownPoint(p : p)))
}
__main__swift()
