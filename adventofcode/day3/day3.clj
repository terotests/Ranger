

class day_two {
  
  static fn distance:int ( data: int ) {
    def size 1
    def side 1
    def total 1
    def last_total 1
    def n 1
    while( total < data ) {
      last_total = total 
      side = side + 2
      total = total + (  ( side - 1) * 4 )
      n = n + 1
    }
    def dist ( (data - last_total) - 1 )
    def sideStep (side - 1)
    def pos ( dist % sideStep)
    def step_ort 0
    def halfway ( to_int (sideStep / 2) )
    if( pos < halfway ) {
      step_ort = ( halfway - 1 - pos )
    } {
      step_ort = ( pos - halfway + 1 )
    }
    print "total steps for " + data +  " == " + (step_ort + halfway )
    return (step_ort + halfway)
  }

  static fn main() {
    day_two.distance( 9 )
    day_two.distance( 10 )
    day_two.distance( 11 )
    day_two.distance( 12 )
    day_two.distance( 17 )
    day_two.distance( 23 )
    day_two.distance( 24 )
    day_two.distance( 1024 )
    day_two.distance( 289326 )
  }
}