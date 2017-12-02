import Foundation
func ==(l: day_one_part_two, r: day_one_part_two) -> Bool {
  return l === r
}
class day_one_part_two : Equatable  { 
  class func solve(data : String) -> Int {
    let list : [String] = "".characters.count == 0 ? Array(data.characters).map { String($0) } : data.components( separatedBy : "")
    let __len : Int = list.count
    let half_index : Int = Int((__len / 2))
    let leftSide : [Int] = operatorsOf.map_3(__self : operatorsOf.filter_2(__self : list, cb : ({ (item, index) ->  Bool in 
      return index < half_index;
      // captured var half_index
    })), cb : ({ (item, index) ->  Int in 
      return (Int(item))!;
    }))
    let rightSide : [Int] = operatorsOf.map_3(__self : operatorsOf.filter_2(__self : list, cb : ({ (item, index) ->  Bool in 
      return index >= half_index;
      // captured var half_index
    })), cb : ({ (item, index) ->  Int in 
      return (Int(item))!;
    }))
    return operatorsOf.reduce_4(__self : leftSide, cb : ({ (left, right, index) ->  Int in 
      let other : Int = rightSide[index]
      return (right == other) ? ((left + right) + other) : left;
      // captured var rightSide
    }), initialValue : 0);
  }
}
func ==(l: operatorsOf, r: operatorsOf) -> Bool {
  return l === r
}
class operatorsOf : Equatable  { 
  class func filter_2(__self : [String], cb :   @escaping  (( _ : String,  _ : Int) -> Bool)) -> [String] {
    var res : [String] = [String]()
    for ( i , it ) in __self.enumerated() {
      if ( cb(it, i) ) {
        res.append(it)
      }
    }
    return res;
  }
  class func map_3(__self : [String], cb :   @escaping  (( _ : String,  _ : Int) -> Int)) -> [Int] {
    /** unused:  let __len : Int = __self.count   **/ 
    var res_1 : [Int] = [Int]()
    for ( i_1 , it_1 ) in __self.enumerated() {
      res_1.append(cb(it_1, i_1))
    }
    return res_1;
  }
  class func reduce_4(__self : [Int], cb :   @escaping  (( _ : Int,  _ : Int,  _ : Int) -> Int), initialValue : Int) -> Int {
    let len_1 : Int = __self.count
    var res_2 : Int = initialValue
    if ( len_1 >= 1 ) {
      for ( i_2 , it_2 ) in __self.enumerated() {
        res_2 = cb(res_2, it_2, i_2);
      }
    }
    return res_2;
  }
}
func ==(l: operatorsOfboolean_5, r: operatorsOfboolean_5) -> Bool {
  return l === r
}
class operatorsOfboolean_5 : Equatable  { 
  class func assert_6(condition : Bool, txt : String) -> Void {
    if ( condition ) {
      print("ERROR " + txt)
    }
  }
}
func ==(l: operatorsOf_5, r: operatorsOf_5) -> Bool {
  return l === r
}
class operatorsOf_5 : Equatable  { 
  class func assert_6(condition : Bool, txt : String) -> Void {
    if ( condition ) {
      print("ERROR " + txt)
    }
  }
}
func __main__swift() {
  let data : String = "428122498997587283996116951397957933569136949848379417125362532269869461185743113733992331379856446362482129646556286611543756564275715359874924898113424472782974789464348626278532936228881786273586278886575828239366794429223317476722337424399239986153675275924113322561873814364451339186918813451685263192891627186769818128715595715444565444581514677521874935942913547121751851631373316122491471564697731298951989511917272684335463436218283261962158671266625299188764589814518793576375629163896349665312991285776595142146261792244475721782941364787968924537841698538288459355159783985638187254653851864874544584878999193242641611859756728634623853475638478923744471563845635468173824196684361934269459459124269196811512927442662761563824323621758785866391424778683599179447845595931928589255935953295111937431266815352781399967295389339626178664148415561175386725992469782888757942558362117938629369129439717427474416851628121191639355646394276451847131182652486561415942815818785884559193483878139351841633366398788657844396925423217662517356486193821341454889283266691224778723833397914224396722559593959125317175899594685524852419495793389481831354787287452367145661829287518771631939314683137722493531318181315216342994141683484111969476952946378314883421677952397588613562958741328987734565492378977396431481215983656814486518865642645612413945129485464979535991675776338786758997128124651311153182816188924935186361813797251997643992686294724699281969473142721116432968216434977684138184481963845141486793996476793954226225885432422654394439882842163295458549755137247614338991879966665925466545111899714943716571113326479432925939227996799951279485722836754457737668191845914566732285928453781818792236447816127492445993945894435692799839217467253986218213131249786833333936332257795191937942688668182629489191693154184177398186462481316834678733713614889439352976144726162214648922159719979143735815478633912633185334529484779322818611438194522292278787653763328944421516569181178517915745625295158611636365253948455727653672922299582352766484"
  operatorsOfboolean_5.assert_6(condition : day_one_part_two.solve(data : "1212") != 6, txt : "1212")
  operatorsOf_5.assert_6(condition : day_one_part_two.solve(data : "1221") != 0, txt : "1221")
  operatorsOf_5.assert_6(condition : day_one_part_two.solve(data : "123425") != 4, txt : "123425")
  operatorsOf_5.assert_6(condition : day_one_part_two.solve(data : "123123") != 12, txt : "123123")
  operatorsOf_5.assert_6(condition : day_one_part_two.solve(data : "12131415") != 4, txt : "12131415")
  print(String(day_one_part_two.solve(data : data)))
}
// call the main function
__main__swift()
