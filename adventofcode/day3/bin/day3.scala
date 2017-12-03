import scala.util.control._
case class ScalaReturnValue(value:Any) extends Exception

// -----------  the scalafiddle main function begins ---------
day_two.distance(9);
day_two.distance(10);
day_two.distance(11);
day_two.distance(12);
day_two.distance(17);
day_two.distance(23);
day_two.distance(24);
day_two.distance(1024);
day_two.distance(289326);
// -----------  the scalafiddle main function ends ---------


// companion object for static methods of day_two static cnt == 2
object day_two {
  def  distance( data : Int) : Int = {
    /** unused val size : Int = 1**/ 
    var side : Int = 1
    var total : Int = 1
    var last_total : Int = 1
    var n : Int = 1
    try {
      val __break__ = new Breaks;
      __break__.breakable { 
        while (total < data) {
          val __continue__ = new Breaks;
          __continue__.breakable {
            last_total = total
            side = side + 2
            total = total + ((side - 1) * 4)
            n = n + 1
          }
        }
      }
    } 
    val dist : Int = (data - last_total) - 1
    val sideStep : Int = side - 1
    val pos : Int = dist % sideStep
    var step_ort : Int = 0
    val halfway : Int = (sideStep / 2).toInt
    if ( pos < halfway ) {
      step_ort = (halfway - 1) - pos
    } else {
      step_ort = (pos - halfway) + 1
    }
    println( (("total steps for " + data) + " == ") + (step_ort + halfway) )
    return step_ort + halfway  
  }
}
