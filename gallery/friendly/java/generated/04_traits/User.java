
public class User { 
  public Integer age = 0;
  public String name = "";
  
  public String asString() {
    return (name + " ") + String.valueOf(age );
  }
  
  public String label() {
    return name;
  }
}
