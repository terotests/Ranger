
public class ParseOutcome__ops { 
  
  public static Boolean equals( final Object a , final Object b ) {
    if( a instanceof ParseOutcome_Ok) {
      ParseOutcome_Ok __ea0 = (ParseOutcome_Ok) a;
      if( b instanceof ParseOutcome_Ok) {
        ParseOutcome_Ok __eb0 = (ParseOutcome_Ok) b;
        if ( __ea0.value != __eb0.value ) {
          return false;
        }
        return true;
      }
      return false;
    }
    if( a instanceof ParseOutcome_Err) {
      ParseOutcome_Err __ea1 = (ParseOutcome_Err) a;
      if( b instanceof ParseOutcome_Err) {
        ParseOutcome_Err __eb1 = (ParseOutcome_Err) b;
        if ( !__ea1.message.equals(__eb1.message) ) {
          return false;
        }
        return true;
      }
      return false;
    }
    return false;
  }
  
  public static Boolean notEquals( final Object a , final Object b ) {
    if ( ParseOutcome__ops.equals(a, b) ) {
      return false;
    }
    return true;
  }
}
