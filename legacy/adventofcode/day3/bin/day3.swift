func ==(l: day_two, r: day_two) -> Bool {
  return l === r
}
class day_two : Equatable  { 
  class func distance(data : Int) -> Int {
    /** unused:  let size : Int = 1   **/ 
    var side : Int = 1
    var total : Int = 1
    var last_total : Int = 1
    var n : Int = 1
    while (total < data) {
      last_total = total;
      side = side + 2;
      total = total + ((side - 1) * 4);
      n = n + 1;
    }
    let dist : Int = (data - last_total) - 1
    let sideStep : Int = side - 1
    let pos : Int = dist % sideStep
    var step_ort : Int = 0
    let halfway : Int = Int((sideStep / 2))
    if ( pos < halfway ) {
      step_ort = (halfway - 1) - pos;
    } else {
      step_ort = (pos - halfway) + 1;
    }
    print((("total steps for " + String(data)) + " == ") + String((step_ort + halfway)))
    return step_ort + halfway;
  }
}
func __main__swift() {
  _ = day_two.distance(data : 9)
  _ = day_two.distance(data : 10)
  _ = day_two.distance(data : 11)
  _ = day_two.distance(data : 12)
  _ = day_two.distance(data : 17)
  _ = day_two.distance(data : 23)
  _ = day_two.distance(data : 24)
  _ = day_two.distance(data : 1024)
  _ = day_two.distance(data : 289326)
}
// call the main function
__main__swift()
