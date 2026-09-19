import java.util.*;

public class Lookup { 
  
  static Integer _getIntegerOrNull ( String str ) {
      try {
         return (Integer.parseInt(str));
      } catch ( NumberFormatException e ) {
          return null;
      }
  }
  
  
  public String findName( final ArrayList<String> names , final String key ) {
    String found = null;
    for ( String n : names) {
      if ( n.equals(key) ) {
        found = n;
        return found;
      }
    }
    return found;
  }
  
  public Object parseInt( final String text ) {
    if ( text.equals("") ) {
      return new ParseOutcome_Err("empty");
    }
    final Integer parsed = _getIntegerOrNull(text );
    if ( parsed == null ) {
      return new ParseOutcome_Err("not a number");
    }
    return new ParseOutcome_Ok(parsed);
  }
  
  public String describe( final Object r ) {
    String out = "?";
    if( r instanceof ParseOutcome_Ok) {
      ParseOutcome_Ok o = (ParseOutcome_Ok) r;
      out = "ok:" + String.valueOf(o.value );
    }
    if( r instanceof ParseOutcome_Err) {
      ParseOutcome_Err e = (ParseOutcome_Err) r;
      out = "err:" + e.message;
    }
    return out;
  }
}
