import java.util.Optional;

class RangerCompilerMessage { 
  public int error_level = 0     /** note: unused */;
  public int code_line = 0     /** note: unused */;
  public String fileName = ""     /** note: unused */;
  public String description = "";
  public Optional<CodeNode> node = Optional.empty();
}
