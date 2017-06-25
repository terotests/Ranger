import java.util.Optional;
import java.util.*;

class RangerTypeClass { 
  public String name = ""     /** note: unused */;
  public String compiledName = ""     /** note: unused */;
  public int value_type = 0     /** note: unused */;
  public Optional<String> type_name = Optional.empty()     /** note: unused */;
  public Optional<String> key_type = Optional.empty()     /** note: unused */;
  public Optional<String> array_type = Optional.empty()     /** note: unused */;
  public boolean is_primitive = false     /** note: unused */;
  public boolean is_mutable = false     /** note: unused */;
  public boolean is_optional = false     /** note: unused */;
  public boolean is_generic = false     /** note: unused */;
  public boolean is_lambda = false     /** note: unused */;
  public Optional<CodeNode> nameNode = Optional.empty()     /** note: unused */;
  public Optional<CodeNode> templateParams = Optional.empty()     /** note: unused */;
  public ArrayList<RangerTypeClass> implements = new ArrayList<RangerTypeClass>()     /** note: unused */;
}
