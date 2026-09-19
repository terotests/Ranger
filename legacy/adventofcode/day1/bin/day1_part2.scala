import scala.collection.mutable
import scala.util.Try
case class ScalaReturnValue(value:Any) extends Exception

// -----------  the scalafiddle main function begins ---------
val data : String = "428122498997587283996116951397957933569136949848379417125362532269869461185743113733992331379856446362482129646556286611543756564275715359874924898113424472782974789464348626278532936228881786273586278886575828239366794429223317476722337424399239986153675275924113322561873814364451339186918813451685263192891627186769818128715595715444565444581514677521874935942913547121751851631373316122491471564697731298951989511917272684335463436218283261962158671266625299188764589814518793576375629163896349665312991285776595142146261792244475721782941364787968924537841698538288459355159783985638187254653851864874544584878999193242641611859756728634623853475638478923744471563845635468173824196684361934269459459124269196811512927442662761563824323621758785866391424778683599179447845595931928589255935953295111937431266815352781399967295389339626178664148415561175386725992469782888757942558362117938629369129439717427474416851628121191639355646394276451847131182652486561415942815818785884559193483878139351841633366398788657844396925423217662517356486193821341454889283266691224778723833397914224396722559593959125317175899594685524852419495793389481831354787287452367145661829287518771631939314683137722493531318181315216342994141683484111969476952946378314883421677952397588613562958741328987734565492378977396431481215983656814486518865642645612413945129485464979535991675776338786758997128124651311153182816188924935186361813797251997643992686294724699281969473142721116432968216434977684138184481963845141486793996476793954226225885432422654394439882842163295458549755137247614338991879966665925466545111899714943716571113326479432925939227996799951279485722836754457737668191845914566732285928453781818792236447816127492445993945894435692799839217467253986218213131249786833333936332257795191937942688668182629489191693154184177398186462481316834678733713614889439352976144726162214648922159719979143735815478633912633185334529484779322818611438194522292278787653763328944421516569181178517915745625295158611636365253948455727653672922299582352766484"
operatorsOfboolean_5.assert_6(day_one_part_two.solve("1212") != 6, "1212");
operatorsOf_5.assert_6(day_one_part_two.solve("1221") != 0, "1221");
operatorsOf_5.assert_6(day_one_part_two.solve("123425") != 4, "123425");
operatorsOf_5.assert_6(day_one_part_two.solve("123123") != 12, "123123");
operatorsOf_5.assert_6(day_one_part_two.solve("12131415") != 4, "12131415");
println( (day_one_part_two.solve(data).toString) )
// -----------  the scalafiddle main function ends ---------


// companion object for static methods of day_one_part_two static cnt == 2
object day_one_part_two {
  def  solve( data : String) : Int = {
    val list : collection.mutable.ArrayBuffer[String] = data.split("").to[collection.mutable.ArrayBuffer]
    val __len : Int = list.length
    val half_index : Int = (__len / 2).toInt
    val leftSide : collection.mutable.ArrayBuffer[Int] = operatorsOf.map_3(operatorsOf.filter_2(list, ((item : String, index : Int) => ((index < half_index)))), ((item : String, index : Int) => (((Try(item.toInt).toOption).get))))
    val rightSide : collection.mutable.ArrayBuffer[Int] = operatorsOf.map_3(operatorsOf.filter_2(list, ((item : String, index : Int) => ((index >= half_index)))), ((item : String, index : Int) => (((Try(item.toInt).toOption).get))))
    return operatorsOf.reduce_4(leftSide, ((left : Int, right : Int, index : Int) => { 
      val other : Int = rightSide(index)
      ( if (right == other)  (left + right) + other else left)
    }), 0)  
  }
}

// companion object for static methods of operatorsOf static cnt == 3
object operatorsOf {
  def  filter_2( __self : collection.mutable.ArrayBuffer[String], cb : (String, Int)=> Boolean) : collection.mutable.ArrayBuffer[String] = {
    var res : collection.mutable.ArrayBuffer[String] = new collection.mutable.ArrayBuffer()
    for( i <- 0 until __self.length ) {
      val it = __self(i)
      if ( cb(it, i) ) {
        res.append(it)
      }
    }
    return res  
  }
  def  map_3( __self : collection.mutable.ArrayBuffer[String], cb : (String, Int)=> Int) : collection.mutable.ArrayBuffer[Int] = {
    /** unused val __len : Int = __self.length**/ 
    var res_1 : collection.mutable.ArrayBuffer[Int] = new collection.mutable.ArrayBuffer()
    for( i_1 <- 0 until __self.length ) {
      val it_1 = __self(i_1)
      res_1.append(cb(it_1, i_1))
    }
    return res_1  
  }
  def  reduce_4( __self : collection.mutable.ArrayBuffer[Int], cb : (Int, Int, Int)=> Int, initialValue : Int) : Int = {
    val len_1 : Int = __self.length
    var res_2 : Int = initialValue
    if ( len_1 >= 1 ) {
      for( i_2 <- 0 until __self.length ) {
        val it_2 = __self(i_2)
        res_2 = cb(res_2, it_2, i_2)
      }
    }
    return res_2  
  }
}

// companion object for static methods of operatorsOfboolean_5 static cnt == 1
object operatorsOfboolean_5 {
  def  assert_6( condition : Boolean, txt : String) : Unit = {
    if ( condition ) {
      println( "ERROR " + txt )
    }
  }
}

// companion object for static methods of operatorsOf_5 static cnt == 1
object operatorsOf_5 {
  def  assert_6( condition : Boolean, txt : String) : Unit = {
    if ( condition ) {
      println( "ERROR " + txt )
    }
  }
}
