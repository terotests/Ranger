import java.io.*;

public class day_two { 
  
  public static Integer distance( final Integer data ) {
    /** unused:  final Integer size = 1   **/ ;
    Integer side = 1;
    Integer total = 1;
    Integer last_total = 1;
    Integer n = 1;
    while (total < data) {
      last_total = total;
      side = side + 2;
      total = total + ((side - 1) * 4);
      n = n + 1;
    }
    final Integer dist = (data - last_total) - 1;
    final Integer sideStep = side - 1;
    final Integer pos = dist % sideStep;
    Integer step_ort = 0;
    final Integer halfway = Double.valueOf((sideStep / 2)).intValue();
    if ( pos < halfway ) {
      step_ort = (halfway - 1) - pos;
    } else {
      step_ort = (pos - halfway) + 1;
    }
    System.out.println(String.valueOf( (("total steps for " + data) + " == ") + (step_ort + halfway) ) );
    return step_ort + halfway;
  }
  
  public static void main(String [] args ) {
    day_two.distance(9);
    day_two.distance(10);
    day_two.distance(11);
    day_two.distance(12);
    day_two.distance(17);
    day_two.distance(23);
    day_two.distance(24);
    day_two.distance(1024);
    day_two.distance(289326);
  }
}
