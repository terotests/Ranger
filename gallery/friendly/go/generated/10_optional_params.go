package main
import (
  "fmt"
  "strconv"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

type Point struct { 
  x int64 `json:"x"` 
  y int64 /**  unused  **/  `json:"y"` 
}

func CreateNew_Point() *Point {
  me := new(Point)
  me.x = int64(0)
  me.y = int64(0)
  return me;
}
type OptionalParams struct { 
}

func CreateNew_OptionalParams() *OptionalParams {
  me := new(OptionalParams)
  return me;
}
func (this *OptionalParams) shown (maybe *GoNullable) string {
  if  !maybe.has_value  {
    return "unknown"
  }
  return maybe.value.(string)
}
func (this *OptionalParams) shownInt (a *GoNullable) int64 {
  if  !a.has_value  {
    return int64(0)
  }
  var r int64= a.value.(int64);
  return r
}
func (this *OptionalParams) shownPoint (p *GoNullable) int64 {
  if  !p.has_value  {
    return int64(0)
  }
  var q *Point= p.value.(*Point); _ = q
  return q.x
}
func main() {
  var app *OptionalParams= CreateNew_OptionalParams(); _ = app
  var hit *GoNullable = new(GoNullable); 
  hit.value = "ada";
  hit.has_value = true; /* detected as non-optional */
  fmt.Println( "name " + app.shown(hit) )
  var miss *GoNullable = new(GoNullable); 
  fmt.Println( "miss " + app.shown(miss) )
  var n *GoNullable = new(GoNullable); 
  n.value = int64(41);
  n.has_value = true; /* detected as non-optional */
  fmt.Println( "int " + strconv.FormatInt(app.shownInt(n), 10) )
  var p *GoNullable = new(GoNullable); 
  var pt *Point= CreateNew_Point();
  pt.x = int64(7); 
  p.value = pt;
  p.has_value = true; /* detected as non-optional */
  fmt.Println( "point " + strconv.FormatInt(app.shownPoint(p), 10) )
}
