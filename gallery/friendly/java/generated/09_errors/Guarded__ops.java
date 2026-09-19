
public class Guarded__ops { 
  
  public static Boolean equals( final Object a , final Object b ) {
    if( a instanceof Guarded_Ok) {
      Guarded_Ok __ea0 = (Guarded_Ok) a;
      if( b instanceof Guarded_Ok) {
        Guarded_Ok __eb0 = (Guarded_Ok) b;
        if ( __ea0.value != __eb0.value ) {
          return false;
        }
        return true;
      }
      return false;
    }
    if( a instanceof Guarded_Err) {
      Guarded_Err __ea1 = (Guarded_Err) a;
      if( b instanceof Guarded_Err) {
        Guarded_Err __eb1 = (Guarded_Err) b;
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
    if ( Guarded__ops.equals(a, b) ) {
      return false;
    }
    return true;
  }
}
