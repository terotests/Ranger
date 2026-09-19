package main
import (
  "strings"
  "strconv"
  "fmt"
)

type GoNullable struct { 
  value interface{}
  has_value bool
}

type day_two struct { 
}

func CreateNew_day_two() *day_two {
  me := new(day_two)
  return me;
}
func day_two_static_distance(data int64) int64 {
  /** unused:  size*/
  var side int64= int64(1);
  var total int64= int64(1);
  var last_total int64= int64(1);
  var n int64= int64(1);
  for total < data {
    last_total = total; 
    side = side + int64(2); 
    total = total + ((side - int64(1)) * int64(4)); 
    n = n + int64(1); 
  }
  var dist int64= (data - last_total) - int64(1);
  var sideStep int64= side - int64(1);
  var pos int64= dist % sideStep;
  var step_ort int64= int64(0);
  var halfway int64= int64((sideStep / int64(2)));
  if  pos < halfway {
    step_ort = (halfway - int64(1)) - pos; 
  } else {
    step_ort = (pos - halfway) + int64(1); 
  }
  fmt.Println( strings.Join([]string{ ((strings.Join([]string{ "total steps for ",strconv.FormatInt(data, 10) }, "")) + " == "),strconv.FormatInt((step_ort + halfway), 10) }, "") )
  return step_ort + halfway
}
func main() {
  day_two_static_distance(int64(9));
  day_two_static_distance(int64(10));
  day_two_static_distance(int64(11));
  day_two_static_distance(int64(12));
  day_two_static_distance(int64(17));
  day_two_static_distance(int64(23));
  day_two_static_distance(int64(24));
  day_two_static_distance(int64(1024));
  day_two_static_distance(int64(289326));
}
