package main
import (
  "strconv"
  "fmt"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

type GenericsMain struct { 
}

func CreateNew_GenericsMain() *GenericsMain {
  me := new(GenericsMain)
  return me;
}
func main() {
  var ints *Stack_int= CreateNew_Stack_int();
  ints.put(int64(7));
  ints.put(int64(8));
  fmt.Println( "int-size " + strconv.FormatInt(ints.size(), 10) )
  var top *GoNullable = new(GoNullable); 
  var top__src *GoNullable = ints.peek();
  top.value = top__src.value;
  top.has_value = top__src.has_value;
  fmt.Println( "int-top " + strconv.FormatInt((func() int64 { if top.has_value { return top.value.(int64) } else { return int64(0)} }()), 10) )
  var words *Stack_string= CreateNew_Stack_string();
  words.put("ada");
  words.put("grace");
  fmt.Println( "str-size " + strconv.FormatInt(words.size(), 10) )
  var lastWord *GoNullable = new(GoNullable); 
  var lastWord__src *GoNullable = words.peek();
  lastWord.value = lastWord__src.value;
  lastWord.has_value = lastWord__src.has_value;
  fmt.Println( "str-top " + (func() string { if lastWord.has_value { return lastWord.value.(string) } else { return "?"} }()) )
}
type Stack_int struct { 
  items []int64 `json:"items"` 
}

func CreateNew_Stack_int() *Stack_int {
  me := new(Stack_int)
  me.items = make([]int64,0)
  return me;
}
func (this *Stack_int) put (item int64) () {
  this.items = append(this.items,item); 
}
func (this *Stack_int) size () int64 {
  return int64(len(this.items))
}
func (this *Stack_int) peek () *GoNullable {
  var found *GoNullable = new(GoNullable); 
  var n int64= int64(len(this.items));
  if  n == int64(0) {
    return found
  }
  found.value = this.items[(n - int64(1))];
  found.has_value = true; /* detected as non-optional */
  return found
}
type Stack_string struct { 
  items []string `json:"items"` 
}

func CreateNew_Stack_string() *Stack_string {
  me := new(Stack_string)
  me.items = make([]string,0)
  return me;
}
func (this *Stack_string) put (item string) () {
  this.items = append(this.items,item); 
}
func (this *Stack_string) size () int64 {
  return int64(len(this.items))
}
func (this *Stack_string) peek () *GoNullable {
  var found *GoNullable = new(GoNullable); 
  var n int64= int64(len(this.items));
  if  n == int64(0) {
    return found
  }
  found.value = this.items[(n - int64(1))];
  found.has_value = true; /* detected as non-optional */
  return found
}
