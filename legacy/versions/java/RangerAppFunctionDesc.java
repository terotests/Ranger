import java.util.Optional;
import java.util.*;

class RangerAppFunctionDesc extends RangerAppParamDesc { 
  public Optional<CodeNode> fnBody = Optional.empty();
  public ArrayList<RangerAppParamDesc> params = new ArrayList<RangerAppParamDesc>();
  public Optional<RangerAppParamDesc> return_value = Optional.empty()     /** note: unused */;
  public boolean is_method = false     /** note: unused */;
  public boolean is_static = false;
  public Optional<RangerAppClassDesc> container_class = Optional.empty()     /** note: unused */;
  public Optional<RangerAppWriterContext> fnCtx = Optional.empty();
  
  public boolean isClass() {
    return false;
  }
  
  public boolean isProperty() {
    return false;
  }
}
