import java.util.Optional;

class CodeSlice { 
  public String code = "";
  public Optional<CodeWriter> writer = Optional.empty();
  
  public String getCode() {
    if ( !writer.isPresent() ) {
      return code;
    }
    return writer.get().getCode();
  }
}
