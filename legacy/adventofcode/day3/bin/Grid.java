import java.util.*;
import java.lang.StringBuilder;
import java.io.*;

public class Grid { 
  
  static String joinStrings(ArrayList<String> list, String delimiter) 
  {
      StringBuilder b = new StringBuilder();
      for(int i=0; i < list.size() ; i++) {
          if( i > 0 ) {
              b.append(delimiter);
          }
          b.append(list.get(i));
      }
      return b.toString();
  }    
      
  public HashMap<Integer,GridRow> cols = new HashMap<Integer,GridRow>();
  public Integer minx = 0;
  public Integer maxx = 0;
  public Integer miny = 0;
  public Integer maxy = 0;
  public Integer turtle_limit = 0;
  public Integer first_largest = 0;
  
  public Integer getValue( final Integer x , final Integer y ) {
    if ( cols.containsKey(y) ) {
      final GridRow col = cols.get(y);
      if ( col.values.containsKey(x) ) {
        return (col.values.get(x));
      }
    }
    return 0;
  }
  
  public void setValue( final Integer x , final Integer y , final Integer value ) {
    if ( (value > turtle_limit) && (first_largest == 0) ) {
      first_largest = value;
    }
    if ( cols.containsKey(y) ) {
      final GridRow col = cols.get(y);
      col.values.put(x, value);
    } else {
      final GridRow newCol = new GridRow();
      cols.put(y, newCol);
      newCol.values.put(x, value);
    }
    if ( x < minx ) {
      minx = x;
    }
    if ( x > maxx ) {
      maxx = x;
    }
    if ( y < miny ) {
      miny = y;
    }
    if ( y > maxy ) {
      maxy = y;
    }
  }
  
  public Integer getAdjacentSum( final Integer x , final Integer y ) {
    final LambdaSignature1 v = new LambdaSignature1() { 
      public Integer run( final Integer dx,  final Integer dy) {
        return (Grid.this).getValue((x + dx), (y + dy));
        // captured var x
        // captured var y
      }
    };
    return ((((((v.run(-1, -1) + v.run(-1, 0)) + v.run(-1, 1)) + v.run(0, -1)) + v.run(0, 1)) + v.run(1, -1)) + v.run(1, 0)) + v.run(1, 1);
  }
  
  public void printGrid() {
    Integer xx = minx;
    Integer yy = miny;
    while (yy <= maxy) {
      xx = minx;
      ArrayList<Integer> row = new ArrayList<Integer>();
      while (xx <= maxx) {
        row.add((this).getValue(xx, yy));
        xx = xx + 1;
      }
      System.out.println(String.valueOf( joinStrings(operatorsOf.map_2(row, new LambdaSignature2() { 
        public String run( final Integer item,  final Integer index) {
          return String.valueOf(item );
        }
      }), " ") ) );
      yy = yy + 1;
    }
  }
}
