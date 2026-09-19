package main
import (
  "strconv"
  "fmt"
)

type GoNullable struct {
  value interface{}
  has_value bool
}


func r_str_2_i64(s string) *GoNullable {
   res := new(GoNullable);
   if v, err := strconv.ParseInt(s, 10, 64); err == nil {
     res.has_value = true
     res.value = v
   } else {
     res.has_value = false
   }
   return res
}


const (
  union_ParseOutcome_tag_ParseOutcome_Ok = 1
  union_ParseOutcome_tag_ParseOutcome_Err = 2
)
type union_ParseOutcome struct {
  tag int
  ParseOutcome_Ok *ParseOutcome_Ok
  ParseOutcome_Err *ParseOutcome_Err
}
func mk_union_ParseOutcome_ParseOutcome_Ok(p *ParseOutcome_Ok) union_ParseOutcome {
  return union_ParseOutcome{
    tag: union_ParseOutcome_tag_ParseOutcome_Ok,
    ParseOutcome_Ok: p,
  }
}
func mk_union_ParseOutcome_ParseOutcome_Err(p *ParseOutcome_Err) union_ParseOutcome {
  return union_ParseOutcome{
    tag: union_ParseOutcome_tag_ParseOutcome_Err,
    ParseOutcome_Err: p,
  }
}
type ParseOutcome_Ok struct { 
  value int64 `json:"value"` 
}

func CreateNew_ParseOutcome_Ok(value int64) *ParseOutcome_Ok {
  me := new(ParseOutcome_Ok)
  me.value = int64(0)
  me.value = value; 
  return me;
}
type ParseOutcome_Err struct { 
  message string `json:"message"` 
}

func CreateNew_ParseOutcome_Err(message string) *ParseOutcome_Err {
  me := new(ParseOutcome_Err)
  me.message = ""
  me.message = message; 
  return me;
}
type ParseOutcome__ops struct { 
}

func CreateNew_ParseOutcome__ops() *ParseOutcome__ops {
  me := new(ParseOutcome__ops)
  return me;
}
func ParseOutcome__ops_static_equals(a union_ParseOutcome, b union_ParseOutcome) bool {
  if a.tag == union_ParseOutcome_tag_ParseOutcome_Ok { /* union case */
    var __ea0 *ParseOutcome_Ok = a.ParseOutcome_Ok;
    _ = __ea0;
    if b.tag == union_ParseOutcome_tag_ParseOutcome_Ok { /* union case */
      var __eb0 *ParseOutcome_Ok = b.ParseOutcome_Ok;
      _ = __eb0;
      if  __ea0.value != __eb0.value {
        return false
      }
      return true
    }
    return false
  }
  if a.tag == union_ParseOutcome_tag_ParseOutcome_Err { /* union case */
    var __ea1 *ParseOutcome_Err = a.ParseOutcome_Err;
    _ = __ea1;
    if b.tag == union_ParseOutcome_tag_ParseOutcome_Err { /* union case */
      var __eb1 *ParseOutcome_Err = b.ParseOutcome_Err;
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
func ParseOutcome__ops_static_notEquals(a union_ParseOutcome, b union_ParseOutcome) bool {
  if  ParseOutcome__ops_static_equals(a, b) {
    return false
  }
  return true
}
type Lookup struct { 
}

func CreateNew_Lookup() *Lookup {
  me := new(Lookup)
  return me;
}
func (this *Lookup) findName (names []string, key string) *GoNullable {
  var found *GoNullable = new(GoNullable); 
  for _, n := range names {
    if  n == key {
      found.value = n;
      found.has_value = true; /* detected as non-optional */
      return found
    }
  }
  return found
}
func (this *Lookup) parseInt (text string) union_ParseOutcome {
  if  text == "" {
    return mk_union_ParseOutcome_ParseOutcome_Err(CreateNew_ParseOutcome_Err("empty"))
  }
  var parsed *GoNullable = new(GoNullable); 
  var parsed__src *GoNullable = r_str_2_i64(text);
  parsed.value = parsed__src.value;
  parsed.has_value = parsed__src.has_value;
  if  !parsed.has_value  {
    return mk_union_ParseOutcome_ParseOutcome_Err(CreateNew_ParseOutcome_Err("not a number"))
  }
  return mk_union_ParseOutcome_ParseOutcome_Ok(CreateNew_ParseOutcome_Ok(parsed.value.(int64)))
}
func (this *Lookup) describe (r union_ParseOutcome) string {
  var out string= "?";
  if r.tag == union_ParseOutcome_tag_ParseOutcome_Ok { /* union case */
    var o *ParseOutcome_Ok = r.ParseOutcome_Ok;
    _ = o;
    out = "ok:" + strconv.FormatInt(o.value, 10); 
  }
  if r.tag == union_ParseOutcome_tag_ParseOutcome_Err { /* union case */
    var e *ParseOutcome_Err = r.ParseOutcome_Err;
    _ = e;
    out = "err:" + e.message; 
  }
  return out
}
type OptionResultMain struct { 
}

func CreateNew_OptionResultMain() *OptionResultMain {
  me := new(OptionResultMain)
  return me;
}
func main() {
  var box *Lookup= CreateNew_Lookup(); _ = box
  var names []string= []string {"ada", "grace"};
  var hit *GoNullable = new(GoNullable); 
  var hit__src *GoNullable = box.findName(names, "ada");
  hit.value = hit__src.value;
  hit.has_value = hit__src.has_value;
  fmt.Println( "found " + (func() string { if hit.has_value { return hit.value.(string) } else { return "unknown"} }()) )
  var miss *GoNullable = new(GoNullable); 
  var miss__src *GoNullable = box.findName(names, "alan");
  miss.value = miss__src.value;
  miss.has_value = miss__src.has_value;
  fmt.Println( "miss " + (func() string { if miss.has_value { return miss.value.(string) } else { return "unknown"} }()) )
  if  !miss.has_value  {
    fmt.Println( "miss is empty" )
  }
  fmt.Println( box.describe(box.parseInt("42")) )
  fmt.Println( box.describe(box.parseInt("")) )
  fmt.Println( box.describe(box.parseInt("nope")) )
}
