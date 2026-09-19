import java.io.*;

public class GenericsMain { 
  
  public static void main(String [] args ) {
    final Stack_int ints = new Stack_int();
    ints.put(7);
    ints.put(8);
    System.out.println(String.valueOf( "int-size " + String.valueOf(ints.size() ) ) );
    final Integer top = ints.peek();
    System.out.println(String.valueOf( "int-top " + String.valueOf(((top != null ) ? top : 0) ) ) );
    final Stack_string words = new Stack_string();
    words.put("ada");
    words.put("grace");
    System.out.println(String.valueOf( "str-size " + String.valueOf(words.size() ) ) );
    final String lastWord = words.peek();
    System.out.println(String.valueOf( "str-top " + ((lastWord != null ) ? lastWord : "?") ) );
  }
}
