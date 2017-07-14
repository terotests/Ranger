import java.util.*;

class SourceCode { 
  public String code = "";
  public ArrayList<String> lines = new ArrayList<String>();
  public String filename = "";
  
  SourceCode( String code_str  ) {
    code = code_str;
    lines = new ArrayList<String>(Arrays.asList(code_str.split("\n")));
  }
  
  public String getLineString( int line_index ) {
    if ( (lines.size()) > line_index ) {
      return lines.get(line_index);
    }
    return "";
  }
  
  public int getLine( int sp ) {
    int cnt = 0;
    for ( int i = 0; i < lines.size(); i++) {
      String str = lines.get(i);
      cnt = cnt + ((str.length()) + 1);
      if ( cnt > sp ) {
        return i;
      }
    }
    return -1;
  }
  
  public String getColumnStr( int sp ) {
    int cnt = 0;
    int last = 0;
    for ( int i = 0; i < lines.size(); i++) {
      String str = lines.get(i);
      cnt = cnt + ((str.length()) + 1);
      if ( cnt > sp ) {
        int ll = sp - last;
        String ss = "";
        while (ll > 0) {
          ss = ss + " ";
          ll = ll - 1;
        }
        return ss;
      }
      last = cnt;
    }
    return "";
  }
  
  public int getColumn( int sp ) {
    int cnt = 0;
    int last = 0;
    for ( int i = 0; i < lines.size(); i++) {
      String str = lines.get(i);
      cnt = cnt + ((str.length()) + 1);
      if ( cnt > sp ) {
        return sp - last;
      }
      last = cnt;
    }
    return -1;
  }
}
