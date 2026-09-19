
public class User implements Named { 
  public String uname = ""     /* note: unused */;
  
  public String label() {
    return "anon";
  }
  
  public Integer weight() {
    return 1;
  }
}
