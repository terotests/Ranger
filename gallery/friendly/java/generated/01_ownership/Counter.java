
public class Counter { 
  public Integer value = 0;
  
  public Integer reading() {
    return value;
  }
  
  public void add( final Integer amount ) {
    value = value + amount;
  }
}
