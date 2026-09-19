package main
import (
  "strconv"
  "fmt"
)

type GoNullable struct {
  value interface{}
  has_value bool
}


const (
  union_Guarded_tag_Guarded_Ok = 1
  union_Guarded_tag_Guarded_Err = 2
)
type union_Guarded struct {
  tag int
  Guarded_Ok *Guarded_Ok
  Guarded_Err *Guarded_Err
}
func mk_union_Guarded_Guarded_Ok(p *Guarded_Ok) union_Guarded {
  return union_Guarded{
    tag: union_Guarded_tag_Guarded_Ok,
    Guarded_Ok: p,
  }
}
func mk_union_Guarded_Guarded_Err(p *Guarded_Err) union_Guarded {
  return union_Guarded{
    tag: union_Guarded_tag_Guarded_Err,
    Guarded_Err: p,
  }
}
type Guarded_Ok struct { 
  value int64 `json:"value"` 
}

func CreateNew_Guarded_Ok(value int64) *Guarded_Ok {
  me := new(Guarded_Ok)
  me.value = int64(0)
  me.value = value; 
  return me;
}
type Guarded_Err struct { 
  message string `json:"message"` 
}

func CreateNew_Guarded_Err(message string) *Guarded_Err {
  me := new(Guarded_Err)
  me.message = ""
  me.message = message; 
  return me;
}
type Guarded__ops struct { 
}

func CreateNew_Guarded__ops() *Guarded__ops {
  me := new(Guarded__ops)
  return me;
}
func Guarded__ops_static_equals(a union_Guarded, b union_Guarded) bool {
  if a.tag == union_Guarded_tag_Guarded_Ok { /* union case */
    var __ea0 *Guarded_Ok = a.Guarded_Ok;
    _ = __ea0;
    if b.tag == union_Guarded_tag_Guarded_Ok { /* union case */
      var __eb0 *Guarded_Ok = b.Guarded_Ok;
      _ = __eb0;
      if  __ea0.value != __eb0.value {
        return false
      }
      return true
    }
    return false
  }
  if a.tag == union_Guarded_tag_Guarded_Err { /* union case */
    var __ea1 *Guarded_Err = a.Guarded_Err;
    _ = __ea1;
    if b.tag == union_Guarded_tag_Guarded_Err { /* union case */
      var __eb1 *Guarded_Err = b.Guarded_Err;
      _ = __eb1;
      if  __ea1.message != __eb1.message {
        return false
      }
      return true
    }
    return false
  }
  return false
}
func Guarded__ops_static_notEquals(a union_Guarded, b union_Guarded) bool {
  if  Guarded__ops_static_equals(a, b) {
    return false
  }
  return true
}
type Guard struct { 
}

func CreateNew_Guard() *Guard {
  me := new(Guard)
  return me;
}
func (this *Guard) check (value int64) union_Guarded {
  if  value < int64(0) {
    return mk_union_Guarded_Guarded_Err(CreateNew_Guarded_Err("negative"))
  }
  return mk_union_Guarded_Guarded_Ok(CreateNew_Guarded_Ok(value))
}
func (this *Guard) describe (g union_Guarded) string {
  var out string= "?";
  if g.tag == union_Guarded_tag_Guarded_Ok { /* union case */
    var o *Guarded_Ok = g.Guarded_Ok;
    _ = o;
    out = "ok:" + strconv.FormatInt(o.value, 10); 
  }
  if g.tag == union_Guarded_tag_Guarded_Err { /* union case */
    var e *Guarded_Err = g.Guarded_Err;
    _ = e;
    out = "err:" + e.message; 
  }
  return out
}
type ErrorsMain struct { 
}

func CreateNew_ErrorsMain() *ErrorsMain {
  me := new(ErrorsMain)
  return me;
}
func main() {
  var g *Guard= CreateNew_Guard(); _ = g
  fmt.Println( g.describe(g.check(int64(3))) )
  fmt.Println( g.describe(g.check((int64(0) - int64(1)))) )
}
