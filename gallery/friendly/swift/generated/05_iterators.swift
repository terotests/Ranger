func ==(l: Stats, r: Stats) -> Bool {
  return l === r
}
final class Stats : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  func total(xs : [Int]) -> Int {
    var acc : Int = 0
    for v in xs {
      acc = acc + v;
    }
    return acc
  }
  func evenCount(xs : [Int]) -> Int {
    var n : Int = 0
    for v in xs {
      if ( v % 2 == 0 ) {
        n = n + 1;
      }
    }
    return n
  }
  func doubled(xs : [Int]) -> [Int] {
    var out : [Int] = [Int]()
    for v in xs {
      out.append(v * 2)
    }
    return out
  }
  func applyEach(xs : [Int], f :   @escaping  (( _ : Int) -> Int)) -> [Int] {
    var out : [Int] = [Int]()
    for v in xs {
      let next : Int = f(v)
      out.append(next)
    }
    return out
  }
}
func ==(l: IterMain, r: IterMain) -> Bool {
  return l === r
}
final class IterMain : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
}
// Main entry point
func __main__swift() {
  let s : Stats = Stats()
  let xs : [Int] = [1, 2, 3, 4]
  print("sum " + String(s.total(xs : xs)))
  print("evens " + String(s.evenCount(xs : xs)))
  let twice : [Int] = s.doubled(xs : xs)
  print("doubled0 " + String(twice[0]))
  let addOne : (( _ : Int) -> Int) = ({ (p) ->  Int in 
    return p + 1
  })
  let bumped : [Int] = s.applyEach(xs : xs, f : addOne)
  print("bumped0 " + String(bumped[0]))
}
__main__swift()
