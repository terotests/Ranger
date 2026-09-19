
protocol Named {
  func label() -> String
}
func ==(l: User, r: User) -> Bool {
  return l === r
}
final class User : Hashable , Named { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var uname : String = ""     /* note: unused */
  func label() -> String {
    return "anon"
  }
  func weight() -> Int {
    return 1
  }
}
func ==(l: Bot, r: Bot) -> Bool {
  return l === r
}
final class Bot : Hashable , Named { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var id : Int = 0     /* note: unused */
  func label() -> String {
    return "anon"
  }
}
func ==(l: TraitsMain, r: TraitsMain) -> Bool {
  return l === r
}
final class TraitsMain : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  func show(n : Named) -> String {
    return n.label()
  }
}
// Main entry point
func __main__swift() {
  let app : TraitsMain = TraitsMain()
  let u : User = User()
  let b : Bot = Bot()
  print("user " + app.show(n : u))
  print("bot " + app.show(n : b))
  print("weight " + String(u.weight()))
}
__main__swift()
