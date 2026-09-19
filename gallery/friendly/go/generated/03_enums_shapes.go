package main
import (
  "strconv"
  "fmt"
)

type Color int64
const (
  ColorRed Color = 0
  ColorGreen Color = 1
  ColorBlue Color = 2
)

const (
  union_Message_tag_Message_Ping = 1
  union_Message_tag_Message_Text = 2
  union_Message_tag_Message_Move = 3
)
type union_Message struct {
  tag int
  Message_Ping *Message_Ping
  Message_Text *Message_Text
  Message_Move *Message_Move
}
func mk_union_Message_Message_Ping(p *Message_Ping) union_Message {
  return union_Message{
    tag: union_Message_tag_Message_Ping,
    Message_Ping: p,
  }
}
func mk_union_Message_Message_Text(p *Message_Text) union_Message {
  return union_Message{
    tag: union_Message_tag_Message_Text,
    Message_Text: p,
  }
}
func mk_union_Message_Message_Move(p *Message_Move) union_Message {
  return union_Message{
    tag: union_Message_tag_Message_Move,
    Message_Move: p,
  }
}
type Message_Ping struct { 
}

func CreateNew_Message_Ping() *Message_Ping {
  me := new(Message_Ping)
  return me;
}
type Message_Text struct { 
  body string `json:"body"` 
}

func CreateNew_Message_Text(body string) *Message_Text {
  me := new(Message_Text)
  me.body = ""
  me.body = body; 
  return me;
}
type Message_Move struct { 
  dx int64 `json:"dx"` 
  dy int64 `json:"dy"` 
}

func CreateNew_Message_Move(dx int64, dy int64) *Message_Move {
  me := new(Message_Move)
  me.dx = int64(0)
  me.dy = int64(0)
  me.dx = dx; 
  me.dy = dy; 
  return me;
}
type Message__ops struct { 
}

func CreateNew_Message__ops() *Message__ops {
  me := new(Message__ops)
  return me;
}
func Message__ops_static_equals(a union_Message, b union_Message) bool {
  if a.tag == union_Message_tag_Message_Ping { /* union case */
    var __ea0 *Message_Ping = a.Message_Ping;
    _ = __ea0;
    if b.tag == union_Message_tag_Message_Ping { /* union case */
      var __eb0 *Message_Ping = b.Message_Ping;
      _ = __eb0;
      return true
    }
    return false
  }
  if a.tag == union_Message_tag_Message_Text { /* union case */
    var __ea1 *Message_Text = a.Message_Text;
    _ = __ea1;
    if b.tag == union_Message_tag_Message_Text { /* union case */
      var __eb1 *Message_Text = b.Message_Text;
      _ = __eb1;
      if  __ea1.body != __eb1.body {
        return false
      }
      return true
    }
    return false
  }
  if a.tag == union_Message_tag_Message_Move { /* union case */
    var __ea2 *Message_Move = a.Message_Move;
    _ = __ea2;
    if b.tag == union_Message_tag_Message_Move { /* union case */
      var __eb2 *Message_Move = b.Message_Move;
      _ = __eb2;
      if  __ea2.dx != __eb2.dx {
        return false
      }
      if  __ea2.dy != __eb2.dy {
        return false
      }
      return true
    }
    return false
  }
  return false
}
func Message__ops_static_notEquals(a union_Message, b union_Message) bool {
  if  Message__ops_static_equals(a, b) {
    return false
  }
  return true
}
type EnumsMain struct { 
}

func CreateNew_EnumsMain() *EnumsMain {
  me := new(EnumsMain)
  return me;
}
func (this *EnumsMain) colorName (c Color) string {
  if  c == ColorRed {
    return "red"
  }
  if  c == ColorGreen {
    return "green"
  }
  return "blue"
}
func (this *EnumsMain) describe (m union_Message) string {
  var out string= "?";
  if m.tag == union_Message_tag_Message_Ping { /* union case */
    var __match0 *Message_Ping = m.Message_Ping;
    _ = __match0;
    out = "ping"; 
  }
  if m.tag == union_Message_tag_Message_Text { /* union case */
    var t *Message_Text = m.Message_Text;
    _ = t;
    out = "text:" + t.body; 
  }
  if m.tag == union_Message_tag_Message_Move { /* union case */
    var mv *Message_Move = m.Message_Move;
    _ = mv;
    out = ("move:" + strconv.FormatInt(mv.dx, 10)) + ("," + strconv.FormatInt(mv.dy, 10)); 
  }
  return out
}
func main() {
  var app *EnumsMain= CreateNew_EnumsMain(); _ = app
  fmt.Println( "color " + app.colorName(ColorGreen) )
  fmt.Println( app.describe(mk_union_Message_Message_Ping(CreateNew_Message_Ping())) )
  fmt.Println( app.describe(mk_union_Message_Message_Text(CreateNew_Message_Text("hi"))) )
  fmt.Println( app.describe(mk_union_Message_Message_Move(CreateNew_Message_Move(int64(2), int64(3)))) )
}
