
public class Guard { 
  
  public Object check( final Integer value ) {
    if ( value < 0 ) {
      return new Guarded_Err("negative");
    }
    return new Guarded_Ok(value);
  }
  
  public String describe( final Object g ) {
    String out = "?";
    if( g instanceof Guarded_Ok) {
      Guarded_Ok o = (Guarded_Ok) g;
      out = "ok:" + String.valueOf(o.value );
    }
    if( g instanceof Guarded_Err) {
      Guarded_Err e = (Guarded_Err) g;
      out = "err:" + e.message;
    }
    return out;
  }
}
