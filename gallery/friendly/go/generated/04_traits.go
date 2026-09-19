package main
import (
  "strconv"
  "fmt"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

type User struct { 
  age int64 `json:"age"` 
  name string `json:"name"` 
}

func CreateNew_User() *User {
  me := new(User)
  me.age = int64(0)
  me.name = ""
  return me;
}
func (this *User) asString () string {
  return (this.name + " ") + strconv.FormatInt(this.age, 10)
}
func (this *User) label () string {
  return this.name
}
type Bot struct { 
  name string `json:"name"` 
}

func CreateNew_Bot() *Bot {
  me := new(Bot)
  me.name = ""
  return me;
}
func (this *Bot) asString () string {
  return "bot:" + this.name
}
func (this *Bot) label () string {
  return this.name
}
type TraitsMain struct { 
}

func CreateNew_TraitsMain() *TraitsMain {
  me := new(TraitsMain)
  return me;
}
func (this *TraitsMain) show (who *User) string {
  return ("label=" + who.label()) + (" text=" + who.asString())
}
func main() {
  var app *TraitsMain= CreateNew_TraitsMain(); _ = app
  var u *User= CreateNew_User();
  u.name = "ada"; 
  u.age = int64(36); 
  fmt.Println( app.show(u) )
  var b *Bot= CreateNew_Bot(); _ = b
  b.name = "r2"; 
  fmt.Println( b.asString() )
}
