func ==(l: One, r: One) -> Bool {
  return l === r
}
class One : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  static var instance_count : Int?     /** note: unused */
  init( ) {
  }
  private static var __singleton_instance : One? = nil
  class func __singleton() -> One {
    if (One.__singleton_instance == nil) {
      One.__singleton_instance = One()
    }
    return One.__singleton_instance!
  }
}
func ==(l: App, r: App) -> Bool {
  return l === r
}
class App : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
}
// Main entry point
@main
struct Main {
  static func main() {
    /** unused:  let a : One = One.__singleton()   **/ 
    /** unused:  let b : One = One.__singleton()   **/ 
  }
}
