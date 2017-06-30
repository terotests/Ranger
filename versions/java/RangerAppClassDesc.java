import java.util.*;
import java.util.Optional;

class RangerAppClassDesc extends RangerAppParamDesc { 
  public boolean is_system = false;
  public HashMap<String,String> systemNames = new HashMap<String,String>();
  public Optional<CodeNode> systemInfo = Optional.empty()     /** note: unused */;
  public boolean is_interface = false     /** note: unused */;
  public boolean is_template = false     /** note: unused */;
  public Optional<CodeNode> generic_params = Optional.empty()     /** note: unused */;
  public Optional<RangerAppWriterContext> ctx = Optional.empty();
  public ArrayList<RangerAppParamDesc> variables = new ArrayList<RangerAppParamDesc>();
  public ArrayList<RangerAppFunctionDesc> methods = new ArrayList<RangerAppFunctionDesc>();
  public HashMap<String,Boolean> defined_methods = new HashMap<String,Boolean>();
  public ArrayList<RangerAppFunctionDesc> static_methods = new ArrayList<RangerAppFunctionDesc>();
  public HashMap<String,Boolean> defined_static_methods = new HashMap<String,Boolean>();
  public ArrayList<String> defined_variants = new ArrayList<String>();
  public HashMap<String,RangerAppMethodVariants> method_variants = new HashMap<String,RangerAppMethodVariants>();
  public boolean has_constructor = false;
  public Optional<CodeNode> constructor_node = Optional.empty();
  public Optional<RangerAppFunctionDesc> constructor_fn = Optional.empty();
  public boolean has_destructor = false     /** note: unused */;
  public Optional<CodeNode> destructor_node = Optional.empty()     /** note: unused */;
  public Optional<RangerAppFunctionDesc> destructor_fn = Optional.empty()     /** note: unused */;
  public ArrayList<String> extends_classes = new ArrayList<String>();
  public ArrayList<String> implements_interfaces = new ArrayList<String>()     /** note: unused */;
  public Optional<CodeNode> classNode = Optional.empty();
  public ArrayList<CodeWriter> contr_writers = new ArrayList<CodeWriter>()     /** note: unused */;
  public boolean is_inherited = false;
  
  public boolean isClass() {
    return true;
  }
  
  public boolean isProperty() {
    return false;
  }
  
  public boolean doesInherit() {
    return is_inherited;
  }
  
  public boolean isSameOrParentClass( String class_name , RangerAppWriterContext ctx ) {
    if ( class_name.equals(name) ) {
      return true;
    }
    if ( (extends_classes.indexOf(class_name)) >= 0 ) {
      return true;
    }
    for ( int i_3 = 0; i_3 < extends_classes.size(); i_3++) {
      String c_name = extends_classes.get(i_3);
      final RangerAppClassDesc c = ctx.findClass(c_name);
      if ( c.isSameOrParentClass(class_name, ctx) ) {
        return true;
      }
    }
    return false;
  }
  
  public boolean hasMethod( String m_name ) {
    if ( defined_methods.containsKey(m_name) ) {
      return true;
    }
    for ( int i_6 = 0; i_6 < extends_classes.size(); i_6++) {
      String cname = extends_classes.get(i_6);
      final RangerAppClassDesc cDesc = ctx.get().findClass(cname);
      if ( cDesc.hasMethod(m_name) ) {
        return cDesc.hasMethod(m_name);
      }
    }
    return false;
  }
  
  public Optional<RangerAppFunctionDesc> findMethod( String f_name ) {
    Optional<RangerAppFunctionDesc> res = Optional.empty();
    for ( int i_8 = 0; i_8 < methods.size(); i_8++) {
      RangerAppFunctionDesc m = methods.get(i_8);
      if ( m.name.equals(f_name) ) {
        res = Optional.of(m);
        return Optional.ofNullable((res.isPresent() ? (RangerAppFunctionDesc)res.get() : null ) );
      }
    }
    for ( int i_12 = 0; i_12 < extends_classes.size(); i_12++) {
      String cname_4 = extends_classes.get(i_12);
      final RangerAppClassDesc cDesc_4 = ctx.get().findClass(cname_4);
      if ( cDesc_4.hasMethod(f_name) ) {
        return cDesc_4.findMethod(f_name);
      }
    }
    return Optional.ofNullable((res.isPresent() ? (RangerAppFunctionDesc)res.get() : null ) );
  }
  
  public boolean hasStaticMethod( String m_name ) {
    return defined_static_methods.containsKey(m_name);
  }
  
  public Optional<RangerAppFunctionDesc> findStaticMethod( String f_name ) {
    Optional<RangerAppFunctionDesc> e = Optional.empty();
    for ( int i_12 = 0; i_12 < static_methods.size(); i_12++) {
      RangerAppFunctionDesc m_4 = static_methods.get(i_12);
      if ( m_4.name.equals(f_name) ) {
        e = Optional.of(m_4);
        return Optional.ofNullable((e.isPresent() ? (RangerAppFunctionDesc)e.get() : null ) );
      }
    }
    for ( int i_16 = 0; i_16 < extends_classes.size(); i_16++) {
      String cname_6 = extends_classes.get(i_16);
      final RangerAppClassDesc cDesc_6 = ctx.get().findClass(cname_6);
      if ( cDesc_6.hasStaticMethod(f_name) ) {
        return cDesc_6.findStaticMethod(f_name);
      }
    }
    return Optional.ofNullable((e.isPresent() ? (RangerAppFunctionDesc)e.get() : null ) );
  }
  
  public Optional<RangerAppParamDesc> findVariable( String f_name ) {
    Optional<RangerAppParamDesc> e_4 = Optional.empty();
    for ( int i_16 = 0; i_16 < variables.size(); i_16++) {
      RangerAppParamDesc m_6 = variables.get(i_16);
      if ( m_6.name.equals(f_name) ) {
        e_4 = Optional.of(m_6);
        return Optional.ofNullable((e_4.isPresent() ? (RangerAppParamDesc)e_4.get() : null ) );
      }
    }
    for ( int i_20 = 0; i_20 < extends_classes.size(); i_20++) {
      String cname_8 = extends_classes.get(i_20);
      final RangerAppClassDesc cDesc_8 = ctx.get().findClass(cname_8);
      return cDesc_8.findVariable(f_name);
    }
    return Optional.ofNullable((e_4.isPresent() ? (RangerAppParamDesc)e_4.get() : null ) );
  }
  
  public void addParentClass( String p_name ) {
    extends_classes.add(p_name);
  }
  
  public void addVariable( RangerAppParamDesc desc ) {
    variables.add(desc);
  }
  
  public void addMethod( RangerAppFunctionDesc desc ) {
    defined_methods.put(desc.name, true);
    methods.add(desc);
    final Optional<RangerAppMethodVariants> defVs = Optional.ofNullable(method_variants.get(desc.name));
    if ( !defVs.isPresent() ) {
      final RangerAppMethodVariants new_v = new RangerAppMethodVariants();
      method_variants.put(desc.name, new_v);
      defined_variants.add(desc.name);
      new_v.variants.add(desc);
    } else {
      final RangerAppMethodVariants new_v2 = defVs.get();
      new_v2.variants.add(desc);
    }
  }
  
  public void addStaticMethod( RangerAppFunctionDesc desc ) {
    defined_static_methods.put(desc.name, true);
    static_methods.add(desc);
  }
}
