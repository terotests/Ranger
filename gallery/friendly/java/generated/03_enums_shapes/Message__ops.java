
public class Message__ops { 
  
  public static Boolean equals( final Object a , final Object b ) {
    if( a instanceof Message_Ping) {
      Message_Ping __ea0 = (Message_Ping) a;
      if( b instanceof Message_Ping) {
        Message_Ping __eb0 = (Message_Ping) b;
        return true;
      }
      return false;
    }
    if( a instanceof Message_Text) {
      Message_Text __ea1 = (Message_Text) a;
      if( b instanceof Message_Text) {
        Message_Text __eb1 = (Message_Text) b;
        if ( !__ea1.body.equals(__eb1.body) ) {
          return false;
        }
        return true;
      }
      return false;
    }
    if( a instanceof Message_Move) {
      Message_Move __ea2 = (Message_Move) a;
      if( b instanceof Message_Move) {
        Message_Move __eb2 = (Message_Move) b;
        if ( __ea2.dx != __eb2.dx ) {
          return false;
        }
        if ( __ea2.dy != __eb2.dy ) {
          return false;
        }
        return true;
      }
      return false;
    }
    return false;
  }
  
  public static Boolean notEquals( final Object a , final Object b ) {
    if ( Message__ops.equals(a, b) ) {
      return false;
    }
    return true;
  }
}
