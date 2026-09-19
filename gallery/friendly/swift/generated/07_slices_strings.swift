func ==(l: TextTools, r: TextTools) -> Bool {
  return l === r
}
final class TextTools : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  func greet(name : String) -> String {
    return "hello " + name
  }
  func total(xs : [Int]) -> Int {
    var acc : Int = 0
    for v in xs {
      acc = acc + v;
    }
    return acc
  }
  func firstChar(s : String) -> String {
    if ( r_strlen(s) == 0 ) {
      return ""
    }
    return r_substring(s, 0, 1)
  }
  func twice(xs : [Int]) -> Int {
    return self.total(xs : xs) + self.total(xs : xs)
  }
}
func ==(l: SliceMain, r: SliceMain) -> Bool {
  return l === r
}
final class SliceMain : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
}

// Ranger's string is a sequence of UTF-16 CODE UNITS, indexed in O(1). That is
// what `charAt`, `strlen` and `substring` mean on JavaScript, Kotlin, Java and
// C#, and every scan EVG writes -- `while (i < (strlen s)) { charAt s i }` --
// assumes it.
//
// Swift's String indexes by GRAPHEME CLUSTER instead, and every such operation
// walks from startIndex, so those linear scans became quadratic: parsing a
// 28 KB stylesheet walked 1.25 BILLION characters where Kotlin read 84 000,
// and one frame of the page walked 4.6 million where Kotlin read 68 000.
//
// The UTF-16 view is both the model the other targets use and the one the
// standard library keeps breadcrumbs for -- it exists so NSString bridging can
// offset in amortised constant time -- so this is the faster answer AND the
// more consistent one.
func r_utf16(_ s: String) -> String.UTF16View { s.utf16 }

func r_strlen(_ s: String) -> Int { s.utf16.count }

func r_char_at(_ s: String, _ at: Int) -> Int {
    if at < 0 { return 0 }
    let u = s.utf16
    if at >= u.count { return 0 }
    return Int(u[u.index(u.startIndex, offsetBy: at)])
}

func r_substring(_ s: String, _ from: Int, _ to: Int) -> String {
    let u = s.utf16
    let n = u.count
    var a = from < 0 ? 0 : from
    var b = to > n ? n : to
    if a > n { a = n }
    if b < a { b = a }
    // A Swift String cannot hold half of a surrogate pair: a slice that cuts
    // one decodes to U+FFFD. Round the slice out to scalar boundaries instead,
    // so a walk that copies one UTF-16 unit at a time carries an emoji over
    // whole -- the unit that starts the pair takes both, the one that ends it
    // takes nothing.
    if a < n && a > 0 {
        let ua = u[u.index(u.startIndex, offsetBy: a)]
        if ua >= 0xDC00 && ua <= 0xDFFF { a += 1 }
    }
    if b > a && b < n {
        let ub = u[u.index(u.startIndex, offsetBy: b - 1)]
        if ub >= 0xD800 && ub <= 0xDBFF { b += 1 }
    }
    if b < a { b = a }
    let lo = u.index(u.startIndex, offsetBy: a)
    let hi = u.index(u.startIndex, offsetBy: b)
    return String(decoding: Array(u[lo..<hi]), as: UTF16.self)
}

// An index answered in UTF-16 units, so it can be fed straight back to
// r_char_at and r_substring.
func r_index_of(_ s: String, _ needle: String, _ from: Int) -> Int {
    let u = s.utf16
    let n = u.count
    let m = needle.utf16.count
    if m == 0 { return from <= n ? max(from, 0) : -1 }
    if m > n { return -1 }
    let hay = Array(u)
    let pin = Array(needle.utf16)
    var i = from < 0 ? 0 : from
    while i + m <= n {
        var k = 0
        while k < m && hay[i + k] == pin[k] { k += 1 }
        if k == m { return i }
        i += 1
    }
    return -1
}

func r_last_index_of(_ s: String, _ needle: String) -> Int {
    let hay = Array(s.utf16)
    let pin = Array(needle.utf16)
    let n = hay.count
    let m = pin.count
    if m == 0 { return n }
    if m > n { return -1 }
    var i = n - m
    while i >= 0 {
        var k = 0
        while k < m && hay[i + k] == pin[k] { k += 1 }
        if k == m { return i }
        i -= 1
    }
    return -1
}

// Main entry point
func __main__swift() {
  let t : TextTools = TextTools()
  print(t.greet(name : "ada"))
  let xs : [Int] = [1, 2, 3]
  print("twice " + String(t.twice(xs : xs)))
  print("first " + t.firstChar(s : "grace"))
}
__main__swift()
