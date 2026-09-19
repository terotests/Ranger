package main
import (
  "fmt"
  "strconv"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

type AbsentMain struct { 
}

func CreateNew_AbsentMain() *AbsentMain {
  me := new(AbsentMain)
  return me;
}
func (this *AbsentMain) report (label string, s *GoNullable) string {
  if  !s.has_value  {
    return label + ": absent"
  }
  return ((label + ": present [") + s.value.(string)) + "]"
}
func main() {
  var app *AbsentMain= CreateNew_AbsentMain(); _ = app
  var s *GoNullable = new(GoNullable); 
  fmt.Println( app.report("unset", s) )
  s.value = "";
  s.has_value = true; /* detected as non-optional */
  fmt.Println( app.report("empty", s) )
  fmt.Println( "empty ?? " + (func() string { if s.has_value { return s.value.(string) } else { return "FALLBACK"} }()) )
  s.value = "x";
  s.has_value = true; /* detected as non-optional */
  fmt.Println( app.report("set", s) )
  var n *GoNullable = new(GoNullable); 
  if  !n.has_value  {
    fmt.Println( "int unset: absent" )
  } else {
    fmt.Println( "int unset: present" )
  }
  n.value = int64(0);
  n.has_value = true; /* detected as non-optional */
  if  !n.has_value  {
    fmt.Println( "int zero: absent" )
  } else {
    fmt.Println( "int zero: present" )
  }
  fmt.Println( "int zero ?? " + strconv.FormatInt((func() int64 { if n.has_value { return n.value.(int64) } else { return int64(99)} }()), 10) )
}
