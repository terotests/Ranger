func ==(l: User, r: User) -> Bool {
  return l === r
}
final class User : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var age : Int = 0
  var name : String = ""
  func asString() -> String {
    return (self.name + " ") + String(self.age)
  }
  func label() -> String {
    return self.name
  }
}
func ==(l: Bot, r: Bot) -> Bool {
  return l === r
}
final class Bot : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var name : String = ""
  func asString() -> String {
    return "bot:" + self.name
  }
  func label() -> String {
    return self.name
  }
}
func ==(l: TraitsMain, r: TraitsMain) -> Bool {
  return l === r
}
final class TraitsMain : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  func show(who : User) -> String {
    return ("label=" + who.label()) + (" text=" + who.asString())
  }
}
// Main entry point
func __main__swift() {
  let app : TraitsMain = TraitsMain()
  let u : User = User()
  u.name = "ada";
  u.age = 36;
  print(app.show(who : u))
  let b : Bot = Bot()
  b.name = "r2";
  print(b.asString())
}
__main__swift()
