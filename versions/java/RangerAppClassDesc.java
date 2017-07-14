import java.util.*;
import java.util.Optional;
import java.io.*;

class RangerAppClassDesc extends RangerAppParamDesc { 
  public boolean is_system = false;
  public HashMap<String,String> systemNames = new HashMap<String,String>();
  public Optional<CodeNode> systemInfo = Optional.empty()     /** note: unused */;
  public boolean is_interface = false;
  public boolean is_system_union = false;
  public boolean is_template = false     /** note: unused */;
  public boolean is_serialized = false;
  public boolean is_trait = false;
  public Optional<CodeNode> generic_params = Optional.empty()     /** note: unused */;
  public Optional<RangerAppWriterContext> ctx = Optional.empty();
  public ArrayList<RangerAppParamDesc> variables = new ArrayList<RangerAppParamDesc>();
  public ArrayList<RangerAppParamDesc> capturedLocals = new ArrayList<RangerAppParamDesc>();
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
  public ArrayList<String> implements_interfaces = new ArrayList<String>();
  public ArrayList<String> consumes_traits = new ArrayList<String>();
  public ArrayList<String> is_union_of = new ArrayList<String>();
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
    if ( ctx.isPrimitiveType(class_name) ) {
      if ( (is_union_of.indexOf(class_name)) >= 0 ) {
        return true;
      }
      return false;
    }
    if ( class_name.equals(name) ) {
      return true;
    }
    if ( (extends_classes.indexOf(class_name)) >= 0 ) {
      return true;
    }
    if ( (consumes_traits.indexOf(class_name)) >= 0 ) {
      return true;
    }
    if ( (implements_interfaces.indexOf(class_name)) >= 0 ) {
      return true;
    }
    if ( (is_union_of.indexOf(class_name)) >= 0 ) {
      return true;
    }
    for ( int i = 0; i < extends_classes.size(); i++) {
      String c_name = extends_classes.get(i);
      final RangerAppClassDesc c = ctx.findClass(c_name);
      if ( c.isSameOrParentClass(class_name, ctx) ) {
        return true;
      }
    }
    for ( int i_1 = 0; i_1 < consumes_traits.size(); i_1++) {
      String c_name_1 = consumes_traits.get(i_1);
      final RangerAppClassDesc c_1 = ctx.findClass(c_name_1);
      if ( c_1.isSameOrParentClass(class_name, ctx) ) {
        return true;
      }
    }
    for ( int i_2 = 0; i_2 < implements_interfaces.size(); i_2++) {
      String i_name = implements_interfaces.get(i_2);
      final RangerAppClassDesc c_2 = ctx.findClass(i_name);
      if ( c_2.isSameOrParentClass(class_name, ctx) ) {
        return true;
      }
    }
    for ( int i_3 = 0; i_3 < is_union_of.size(); i_3++) {
      String i_name_1 = is_union_of.get(i_3);
      if ( this.isSameOrParentClass(i_name_1, ctx) ) {
        return true;
      }
      if ( ctx.isDefinedClass(i_name_1) ) {
        final RangerAppClassDesc c_3 = ctx.findClass(i_name_1);
        if ( c_3.isSameOrParentClass(class_name, ctx) ) {
          return true;
        }
      } else {
        System.out.println(String.valueOf( "did not find union class " + i_name_1 ) );
      }
    }
    return false;
  }
  
  public boolean hasOwnMethod( String m_name ) {
    if ( defined_methods.containsKey(m_name) ) {
      return true;
    }
    return false;
  }
  
  public boolean hasMethod( String m_name ) {
    if ( defined_methods.containsKey(m_name) ) {
      return true;
    }
    for ( int i = 0; i < extends_classes.size(); i++) {
      String cname = extends_classes.get(i);
      final RangerAppClassDesc cDesc = ctx.get().findClass(cname);
      if ( cDesc.hasMethod(m_name) ) {
        return cDesc.hasMethod(m_name);
      }
    }
    return false;
  }
  
  public Optional<RangerAppFunctionDesc> findMethod( String f_name ) {
    Optional<RangerAppFunctionDesc> res = Optional.empty();
    for ( int i = 0; i < methods.size(); i++) {
      RangerAppFunctionDesc m = methods.get(i);
      if ( m.name.equals(f_name) ) {
        res = Optional.of(m);
        return Optional.ofNullable((res.isPresent() ? (RangerAppFunctionDesc)res.get() : null ) );
      }
    }
    for ( int i_1 = 0; i_1 < extends_classes.size(); i_1++) {
      String cname = extends_classes.get(i_1);
      final RangerAppClassDesc cDesc = ctx.get().findClass(cname);
      if ( cDesc.hasMethod(f_name) ) {
        return cDesc.findMethod(f_name);
      }
    }
    return Optional.ofNullable((res.isPresent() ? (RangerAppFunctionDesc)res.get() : null ) );
  }
  
  public boolean hasStaticMethod( String m_name ) {
    return defined_static_methods.containsKey(m_name);
  }
  
  public Optional<RangerAppFunctionDesc> findStaticMethod( String f_name ) {
    Optional<RangerAppFunctionDesc> e = Optional.empty();
    for ( int i = 0; i < static_methods.size(); i++) {
      RangerAppFunctionDesc m = static_methods.get(i);
      if ( m.name.equals(f_name) ) {
        e = Optional.of(m);
        return Optional.ofNullable((e.isPresent() ? (RangerAppFunctionDesc)e.get() : null ) );
      }
    }
    for ( int i_1 = 0; i_1 < extends_classes.size(); i_1++) {
      String cname = extends_classes.get(i_1);
      final RangerAppClassDesc cDesc = ctx.get().findClass(cname);
      if ( cDesc.hasStaticMethod(f_name) ) {
        return cDesc.findStaticMethod(f_name);
      }
    }
    return Optional.ofNullable((e.isPresent() ? (RangerAppFunctionDesc)e.get() : null ) );
  }
  
  public Optional<RangerAppParamDesc> findVariable( String f_name ) {
    Optional<RangerAppParamDesc> e = Optional.empty();
    for ( int i = 0; i < variables.size(); i++) {
      RangerAppParamDesc m = variables.get(i);
      if ( m.name.equals(f_name) ) {
        e = Optional.of(m);
        return Optional.ofNullable((e.isPresent() ? (RangerAppParamDesc)e.get() : null ) );
      }
    }
    for ( int i_1 = 0; i_1 < extends_classes.size(); i_1++) {
      String cname = extends_classes.get(i_1);
      final RangerAppClassDesc cDesc = ctx.get().findClass(cname);
      return cDesc.findVariable(f_name);
    }
    return Optional.ofNullable((e.isPresent() ? (RangerAppParamDesc)e.get() : null ) );
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
