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
    for ( int i_11 = 0; i_11 < lines.size(); i_11++) {
      String str = lines.get(i_11);
      cnt = cnt + ((str.length()) + 1);
      if ( cnt > sp ) {
        return i_11;
      }
    }
    return -1;
  }
}
