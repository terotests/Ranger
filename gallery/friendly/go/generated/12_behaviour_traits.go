package main
import (
  "fmt"
  "strconv"
)
type IFACE_Named interface { 
  label() string
}
type User struct { 
  uname string /**  unused  **/  `json:"uname"` 
}

func CreateNew_User() *User {
  me := new(User)
  me.uname = ""
  return me;
}
func (this *User) label () string {
  return "anon"
}
func (this *User) weight () int64 {
  return int64(1)
}
type Bot struct { 
  id int64 /**  unused  **/  `json:"id"` 
}

func CreateNew_Bot() *Bot {
  me := new(Bot)
  me.id = int64(0)
  return me;
}
func (this *Bot) label () string {
  return "anon"
}
type TraitsMain struct { 
}

func CreateNew_TraitsMain() *TraitsMain {
  me := new(TraitsMain)
  return me;
}
func (this *TraitsMain) show (n IFACE_Named) string {
  return n.label()
}
func main() {
  var app *TraitsMain= CreateNew_TraitsMain(); _ = app
  var u *User= CreateNew_User();
  var b *Bot= CreateNew_Bot();
  fmt.Println( "user " + app.show(u) )
  fmt.Println( "bot " + app.show(b) )
  fmt.Println( "weight " + strconv.FormatInt(u.weight(), 10) )
}
