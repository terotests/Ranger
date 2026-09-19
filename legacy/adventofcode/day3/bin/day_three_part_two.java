import java.io.*;

public class day_three_part_two { 
  
  public static Integer distance( final Integer data ) {
    final Grid myGrid = new Grid();
    myGrid.turtle_limit = data;
    myGrid.setValue(0, 0, 1);
    final Integer[] i =  new Integer[]{0};
    final Integer[] j =  new Integer[]{0};
    final LambdaSignature3 moveTurtle = new LambdaSignature3() { 
      public void run( final Integer dx,  final Integer dy,  final Integer steps) {
        Integer cnt = steps;
        while (cnt > 0) {
          i[0] = i[0] + dx;
          j[0] = j[0] + dy;
          final Integer sum = myGrid.getAdjacentSum(i[0], j[0]);
          myGrid.setValue(i[0], j[0], sum);
          cnt = cnt - 1;
        }
        // captured var i
        // captured var j
        // captured var myGrid
      }
    };
    Integer step = 2;
    while (myGrid.first_largest == 0) {
      moveTurtle.run(1, 0, 1);
      moveTurtle.run(0, -1, step - 1);
      moveTurtle.run(-1, 0, step);
      moveTurtle.run(0, 1, step);
      moveTurtle.run(1, 0, step);
      step = step + 2;
    }
    myGrid.printGrid();
    System.out.println(String.valueOf( "the first largest was " + myGrid.first_largest ) );
    return myGrid.turtle_limit;
  }
  
  public static void main(String [] args ) {
    day_three_part_two.distance(289326);
  }
}
