package main
import (
  "strconv"
  "fmt"
)

type GoNullable struct {
  value interface{}
  has_value bool
}

type Stats struct { 
}

func CreateNew_Stats() *Stats {
  me := new(Stats)
  return me;
}
func (this *Stats) total (xs []int64) int64 {
  var acc int64= int64(0);
  for _, v := range xs {
    acc = acc + v; 
  }
  return acc
}
func (this *Stats) evenCount (xs []int64) int64 {
  var n int64= int64(0);
  for _, v := range xs {
    if  v % int64(2) == int64(0) {
      n = n + int64(1); 
    }
  }
  return n
}
func (this *Stats) doubled (xs []int64) []int64 {
  var out []int64 = make([]int64, 0);
  for _, v := range xs {
    out = append(out,v * int64(2)); 
  }
  return out
}
func (this *Stats) applyEach (xs []int64, f func(int64) int64) []int64 {
  var out []int64 = make([]int64, 0);
  for _, v := range xs {
    var next int64= f(v);
    out = append(out,next); 
  }
  return out
}
type IterMain struct { 
}

func CreateNew_IterMain() *IterMain {
  me := new(IterMain)
  return me;
}
func main() {
  var s *Stats= CreateNew_Stats(); _ = s
  var xs []int64= []int64 {int64(1), int64(2), int64(3), int64(4)};
  fmt.Println( "sum " + strconv.FormatInt(s.total(xs), 10) )
  fmt.Println( "evens " + strconv.FormatInt(s.evenCount(xs), 10) )
  var twice []int64= s.doubled(xs);
  fmt.Println( "doubled0 " + strconv.FormatInt(twice[int64(0)], 10) )
  var addOne func(int64) int64= func (p int64) int64 {
    return p + int64(1)
  };
  var bumped []int64= s.applyEach(xs, addOne);
  fmt.Println( "bumped0 " + strconv.FormatInt(bumped[int64(0)], 10) )
}
