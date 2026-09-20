
enum Color : Int {
  case Red = 0
  case Green = 1
  case Blue = 2
}

enum union_Message {
  case Message_Ping(Message_Ping)
  case Message_Text(Message_Text)
  case Message_Move(Message_Move)
}
func ==(l: Message_Ping, r: Message_Ping) -> Bool {
  return l === r
}
final class Message_Ping : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
}
func ==(l: Message_Text, r: Message_Text) -> Bool {
  return l === r
}
final class Message_Text : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var body : String = ""
  init(body : String ) {
    self.body = body;
  }
}
func ==(l: Message_Move, r: Message_Move) -> Bool {
  return l === r
}
final class Message_Move : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  var dx : Int = 0
  var dy : Int = 0
  init(dx : Int, dy : Int ) {
    self.dx = dx;
    self.dy = dy;
  }
}
func ==(l: Message__ops, r: Message__ops) -> Bool {
  return l === r
}
final class Message__ops : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  class func equals(a : union_Message, b : union_Message) -> Bool {
    if case let .Message_Ping(__ea0) = a { /* union case */
      _ = __ea0
      if case let .Message_Ping(__eb0) = b { /* union case */
        _ = __eb0
        return true
      }
      return false
    }
    if case let .Message_Text(__ea1) = a { /* union case */
      _ = __ea1
      if case let .Message_Text(__eb1) = b { /* union case */
        _ = __eb1
        if ( __ea1.body != __eb1.body ) {
          return false
        }
        return true
      }
      return false
    }
    if case let .Message_Move(__ea2) = a { /* union case */
      _ = __ea2
      if case let .Message_Move(__eb2) = b { /* union case */
        _ = __eb2
        if ( __ea2.dx != __eb2.dx ) {
          return false
        }
        if ( __ea2.dy != __eb2.dy ) {
          return false
        }
        return true
      }
      return false
    }
    return false
  }
  class func notEquals(a : union_Message, b : union_Message) -> Bool {
    if ( Message__ops.equals(a : a, b : b) ) {
      return false
    }
    return true
  }
}
func ==(l: EnumsMain, r: EnumsMain) -> Bool {
  return l === r
}
final class EnumsMain : Hashable  { 
  func hash(into hasher: inout Hasher) {
    hasher.combine(ObjectIdentifier(self))
  }
  func colorName(c : Color) -> String {
    if ( c == Color.Red ) {
      return "red"
    }
    if ( c == Color.Green ) {
      return "green"
    }
    return "blue"
  }
  func describe(m : union_Message) -> String {
    var out : String = "?"
    if case let .Message_Ping(__match0) = m { /* union case */
      _ = __match0
      out = "ping";
    }
    if case let .Message_Text(t) = m { /* union case */
      _ = t
      out = "text:" + t.body;
    }
    if case let .Message_Move(mv) = m { /* union case */
      _ = mv
      out = ("move:" + String(mv.dx)) + ("," + String(mv.dy));
    }
    return out
  }
}
// Main entry point
func __main__swift() {
  let app : EnumsMain = EnumsMain()
  print("color " + app.colorName(c : Color.Green))
  print(app.describe(m : union_Message.Message_Ping(Message_Ping())))
  print(app.describe(m : union_Message.Message_Text(Message_Text(body : "hi"))))
  print(app.describe(m : union_Message.Message_Move(Message_Move(dx : 2, dy : 3))))
}
__main__swift()
