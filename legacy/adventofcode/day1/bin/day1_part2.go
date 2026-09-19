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

type day_one_part_two struct { 
}

func CreateNew_day_one_part_two() *day_one_part_two {
  me := new(day_one_part_two)
  return me;
}
func day_one_part_two_static_solve(data string) int64 {
  var list []string= strings.Split(data, "");
  var __len int64= int64(len(list));
  var half_index int64= int64((__len / int64(2)));
  var leftSide []int64= operatorsOf_static_map_3(operatorsOf_static_filter_2(list, func (item string, index int64) bool {
    return index < half_index
  }), func (item string, index int64) int64 {
    return (r_str_2_i64(item)).value.(int64)
  });
  var rightSide []int64= operatorsOf_static_map_3(operatorsOf_static_filter_2(list, func (item string, index int64) bool {
    return index >= half_index
  }), func (item string, index int64) int64 {
    return (r_str_2_i64(item)).value.(int64)
  });
  return operatorsOf_static_reduce_4(leftSide, func (left int64, right int64, index int64) int64 {
    var other int64= rightSide[index];
    return (func() int64 { if (right == other) { return ((left + right) + other) } else { return left} }())
  }, int64(0))
}
func main() {
  var data string= "428122498997587283996116951397957933569136949848379417125362532269869461185743113733992331379856446362482129646556286611543756564275715359874924898113424472782974789464348626278532936228881786273586278886575828239366794429223317476722337424399239986153675275924113322561873814364451339186918813451685263192891627186769818128715595715444565444581514677521874935942913547121751851631373316122491471564697731298951989511917272684335463436218283261962158671266625299188764589814518793576375629163896349665312991285776595142146261792244475721782941364787968924537841698538288459355159783985638187254653851864874544584878999193242641611859756728634623853475638478923744471563845635468173824196684361934269459459124269196811512927442662761563824323621758785866391424778683599179447845595931928589255935953295111937431266815352781399967295389339626178664148415561175386725992469782888757942558362117938629369129439717427474416851628121191639355646394276451847131182652486561415942815818785884559193483878139351841633366398788657844396925423217662517356486193821341454889283266691224778723833397914224396722559593959125317175899594685524852419495793389481831354787287452367145661829287518771631939314683137722493531318181315216342994141683484111969476952946378314883421677952397588613562958741328987734565492378977396431481215983656814486518865642645612413945129485464979535991675776338786758997128124651311153182816188924935186361813797251997643992686294724699281969473142721116432968216434977684138184481963845141486793996476793954226225885432422654394439882842163295458549755137247614338991879966665925466545111899714943716571113326479432925939227996799951279485722836754457737668191845914566732285928453781818792236447816127492445993945894435692799839217467253986218213131249786833333936332257795191937942688668182629489191693154184177398186462481316834678733713614889439352976144726162214648922159719979143735815478633912633185334529484779322818611438194522292278787653763328944421516569181178517915745625295158611636365253948455727653672922299582352766484";
  operatorsOfboolean_5_static_assert_6(day_one_part_two_static_solve("1212") != int64(6), "1212");
  operatorsOf_5_static_assert_6(day_one_part_two_static_solve("1221") != int64(0), "1221");
  operatorsOf_5_static_assert_6(day_one_part_two_static_solve("123425") != int64(4), "123425");
  operatorsOf_5_static_assert_6(day_one_part_two_static_solve("123123") != int64(12), "123123");
  operatorsOf_5_static_assert_6(day_one_part_two_static_solve("12131415") != int64(4), "12131415");
  fmt.Println( strconv.FormatInt(day_one_part_two_static_solve(data), 10) )
}
type operatorsOf struct { 
}

func CreateNew_operatorsOf() *operatorsOf {
  me := new(operatorsOf)
  return me;
}
func operatorsOf_static_filter_2(__self []string, cb func(string, int64) bool) []string {
  var res []string = make([]string, 0);
  var i int64 = 0;  
  for ; i < int64(len(__self)) ; i++ {
    it := __self[i];
    if  cb(it, i) {
      res = append(res,it); 
    }
  }
  return res
}
func operatorsOf_static_map_3(__self []string, cb func(string, int64) int64) []int64 {
  /** unused:  __len*/
  var res_1 []int64 = make([]int64, 0);
  var i_1 int64 = 0;  
  for ; i_1 < int64(len(__self)) ; i_1++ {
    it_1 := __self[i_1];
    res_1 = append(res_1,cb(it_1, i_1)); 
  }
  return res_1
}
func operatorsOf_static_reduce_4(__self []int64, cb func(int64, int64, int64) int64, initialValue int64) int64 {
  var len_1 int64= int64(len(__self));
  var res_2 int64= initialValue;
  if  len_1 >= int64(1) {
    var i_2 int64 = 0;  
    for ; i_2 < int64(len(__self)) ; i_2++ {
      it_2 := __self[i_2];
      res_2 = cb(res_2, it_2, i_2); 
    }
  }
  return res_2
}
type operatorsOfboolean_5 struct { 
}

func CreateNew_operatorsOfboolean_5() *operatorsOfboolean_5 {
  me := new(operatorsOfboolean_5)
  return me;
}
func operatorsOfboolean_5_static_assert_6(condition bool, txt string) () {
  if  condition {
    fmt.Println( "ERROR " + txt )
  }
}
type operatorsOf_5 struct { 
}

func CreateNew_operatorsOf_5() *operatorsOf_5 {
  me := new(operatorsOf_5)
  return me;
}
func operatorsOf_5_static_assert_6(condition bool, txt string) () {
  if  condition {
    fmt.Println( "ERROR " + txt )
  }
}
