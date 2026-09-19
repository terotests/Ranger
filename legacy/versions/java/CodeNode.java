import java.util.Optional;
import java.util.*;
import java.io.*;

class CodeNode { 
  public Optional<SourceCode> code = Optional.empty();
  public int sp = 0;
  public int ep = 0;
  public boolean has_operator = false;
  public boolean disabled_node = false;
  public int op_index = 0;
  public boolean is_system_class = false;
  public boolean mutable_def = false;
  public boolean expression = false;
  public String vref = "";
  public boolean is_block_node = false;
  public boolean infix_operator = false;
  public Optional<CodeNode> infix_node = Optional.empty();
  public boolean infix_subnode = false;
  public boolean has_lambda = false;
  public boolean has_lambda_call = false;
  public int operator_pred = 0;
  public boolean to_the_right = false;
  public Optional<CodeNode> right_node = Optional.empty();
  public String type_type = "";
  public String type_name = "";
  public String key_type = "";
  public String array_type = "";
  public ArrayList<String> ns = new ArrayList<String>();
  public boolean has_vref_annotation = false;
  public Optional<CodeNode> vref_annotation = Optional.empty();
  public boolean has_type_annotation = false;
  public Optional<CodeNode> type_annotation = Optional.empty();
  public int parsed_type = 0;
  public int value_type = 0;
  public int ref_type = 0;
  public int ref_need_assign = 0     /** note: unused */;
  public double double_value = 0;
  public String string_value = "";
  public int int_value = 0;
  public boolean boolean_value = false;
  public Optional<CodeNode> expression_value = Optional.empty();
  public HashMap<String,CodeNode> props = new HashMap<String,CodeNode>();
  public ArrayList<String> prop_keys = new ArrayList<String>();
  public ArrayList<CodeNode> comments = new ArrayList<CodeNode>();
  public ArrayList<CodeNode> children = new ArrayList<CodeNode>();
  public Optional<CodeNode> parent = Optional.empty();
  public Optional<RangerTypeClass> typeClass = Optional.empty();
  public Optional<RangerAppWriterContext> lambda_ctx = Optional.empty();
  public ArrayList<RangerAppParamDesc> nsp = new ArrayList<RangerAppParamDesc>();
  public int eval_type = 0;
  public String eval_type_name = "";
  public String eval_key_type = "";
  public String eval_array_type = "";
  public Optional<CodeNode> eval_function = Optional.empty();
  public boolean flow_done = false;
  public boolean ref_change_done = false;
  public Optional<CodeNode> eval_type_node = Optional.empty()     /** note: unused */;
  public int didReturnAtIndex = -1;
  public boolean hasVarDef = false;
  public boolean hasClassDescription = false;
  public boolean hasNewOper = false;
  public Optional<RangerAppClassDesc> clDesc = Optional.empty();
  public boolean hasFnCall = false;
  public Optional<RangerAppFunctionDesc> fnDesc = Optional.empty();
  public boolean hasParamDesc = false;
  public Optional<RangerAppParamDesc> paramDesc = Optional.empty();
  public Optional<RangerAppParamDesc> ownParamDesc = Optional.empty();
  public Optional<RangerAppWriterContext> evalCtx = Optional.empty();
  public Optional<NodeEvalState> evalState = Optional.empty()     /** note: unused */;
  
  CodeNode( SourceCode source , int start , int end  ) {
    sp = start;
    ep = end;
    code = Optional.of(source);
  }
  
  public String getParsedString() {
    return code.get().code.substring(sp, ep );
  }
  
  public String getFilename() {
    return code.get().filename;
  }
  
  public Optional<CodeNode> getFlag( String flagName ) {
    Optional<CodeNode> res = Optional.empty();
    if ( false == has_vref_annotation ) {
      return Optional.ofNullable((res.isPresent() ? (CodeNode)res.get() : null ) );
    }
    for ( int i = 0; i < vref_annotation.get().children.size(); i++) {
      CodeNode ch = vref_annotation.get().children.get(i);
      if ( ch.vref.equals(flagName) ) {
        res = Optional.of(ch);
        return Optional.ofNullable((res.isPresent() ? (CodeNode)res.get() : null ) );
      }
    }
    return Optional.ofNullable((res.isPresent() ? (CodeNode)res.get() : null ) );
  }
  
  public boolean hasFlag( String flagName ) {
    if ( false == has_vref_annotation ) {
      return false;
    }
    for ( int i = 0; i < vref_annotation.get().children.size(); i++) {
      CodeNode ch = vref_annotation.get().children.get(i);
      if ( ch.vref.equals(flagName) ) {
        return true;
      }
    }
    return false;
  }
  
  public void setFlag( String flagName ) {
    if ( false == has_vref_annotation ) {
      vref_annotation = Optional.of(new CodeNode(code.get(), sp, ep));
    }
    if ( this.hasFlag(flagName) ) {
      return;
    }
    final CodeNode flag = new CodeNode(code.get(), sp, ep);
    flag.vref = flagName;
    flag.value_type = 9;
    vref_annotation.get().children.add(flag);
    has_vref_annotation = true;
  }
  
  public String getTypeInformationString() {
    String s = "";
    if ( (vref.length()) > 0 ) {
      s = ((s + "<vref:") + vref) + ">";
    } else {
      s = s + "<no.vref>";
    }
    if ( (type_name.length()) > 0 ) {
      s = ((s + "<type_name:") + type_name) + ">";
    } else {
      s = s + "<no.type_name>";
    }
    if ( (array_type.length()) > 0 ) {
      s = ((s + "<array_type:") + array_type) + ">";
    } else {
      s = s + "<no.array_type>";
    }
    if ( (key_type.length()) > 0 ) {
      s = ((s + "<key_type:") + key_type) + ">";
    } else {
      s = s + "<no.key_type>";
    }
    switch (value_type ) { 
      case 5 : 
        s = s + "<value_type=Boolean>";
        break;
      case 4 : 
        s = s + "<value_type=String>";
        break;
    }
    return s;
  }
  
  public int getLine() {
    return code.get().getLine(sp);
  }
  
  public String getLineString( int line_index ) {
    return code.get().getLineString(line_index);
  }
  
  public String getColStartString() {
    return code.get().getColumnStr(sp);
  }
  
  public String getLineAsString() {
    final int idx = this.getLine();
    final int line_name_idx = idx + 1;
    return (((this.getFilename() + ", line ") + line_name_idx) + " : ") + code.get().getLineString(idx);
  }
  
  public String getPositionalString() {
    if ( (ep > sp) && ((ep - sp) < 50) ) {
      int start = sp;
      int end = ep;
      start = start - 100;
      end = end + 50;
      if ( start < 0 ) {
        start = 0;
      }
      if ( end >= (code.get().code.length()) ) {
        end = (code.get().code.length()) - 1;
      }
      return code.get().code.substring(start, end );
    }
    return "";
  }
  
  public boolean isParsedAsPrimitive() {
    if ( (((((parsed_type == 2) || (parsed_type == 4)) || (parsed_type == 3)) || (parsed_type == 12)) || (parsed_type == 13)) || (parsed_type == 5) ) {
      return true;
    }
    return false;
  }
  
  public boolean isPrimitive() {
    if ( (((((value_type == 2) || (value_type == 4)) || (value_type == 3)) || (value_type == 12)) || (value_type == 13)) || (value_type == 5) ) {
      return true;
    }
    return false;
  }
  
  public boolean isPrimitiveType() {
    final String tn = type_name;
    if ( (((((tn.equals("double")) || (tn.equals("string"))) || (tn.equals("int"))) || (tn.equals("char"))) || (tn.equals("charbuffer"))) || (tn.equals("boolean")) ) {
      return true;
    }
    return false;
  }
  
  public boolean isAPrimitiveType() {
    String tn = type_name;
    if ( (value_type == 6) || (value_type == 7) ) {
      tn = array_type;
    }
    if ( (((((tn.equals("double")) || (tn.equals("string"))) || (tn.equals("int"))) || (tn.equals("char"))) || (tn.equals("charbuffer"))) || (tn.equals("boolean")) ) {
      return true;
    }
    return false;
  }
  
  public CodeNode getFirst() {
    return children.get(0);
  }
  
  public CodeNode getSecond() {
    return children.get(1);
  }
  
  public CodeNode getThird() {
    return children.get(2);
  }
  
  public boolean isSecondExpr() {
    if ( (children.size()) > 1 ) {
      final CodeNode second = children.get(1);
      if ( second.expression ) {
        return true;
      }
    }
    return false;
  }
  
  public String getOperator() {
    final String s = "";
    if ( (children.size()) > 0 ) {
      final CodeNode fc = children.get(0);
      if ( fc.value_type == 9 ) {
        return fc.vref;
      }
    }
    return s;
  }
  
  public String getVRefAt( int idx ) {
    final String s = "";
    if ( (children.size()) > idx ) {
      final CodeNode fc = children.get(idx);
      return fc.vref;
    }
    return s;
  }
  
  public String getStringAt( int idx ) {
    final String s = "";
    if ( (children.size()) > idx ) {
      final CodeNode fc = children.get(idx);
      if ( fc.value_type == 4 ) {
        return fc.string_value;
      }
    }
    return s;
  }
  
  public boolean hasExpressionProperty( String name ) {
    final Optional<CodeNode> ann = Optional.ofNullable(props.get(name));
    if ( ann.isPresent() ) {
      return ann.get().expression;
    }
    return false;
  }
  
  public Optional<CodeNode> getExpressionProperty( String name ) {
    final Optional<CodeNode> ann = Optional.ofNullable(props.get(name));
    if ( ann.isPresent() ) {
      return Optional.ofNullable((ann.isPresent() ? (CodeNode)ann.get() : null ) );
    }
    return Optional.ofNullable((ann.isPresent() ? (CodeNode)ann.get() : null ) );
  }
  
  public boolean hasIntProperty( String name ) {
    final Optional<CodeNode> ann = Optional.ofNullable(props.get(name));
    if ( ann.isPresent() ) {
      final CodeNode fc = ann.get().children.get(0);
      if ( fc.value_type == 3 ) {
        return true;
      }
    }
    return false;
  }
  
  public int getIntProperty( String name ) {
    final Optional<CodeNode> ann = Optional.ofNullable(props.get(name));
    if ( ann.isPresent() ) {
      final CodeNode fc = ann.get().children.get(0);
      if ( fc.value_type == 3 ) {
        return fc.int_value;
      }
    }
    return 0;
  }
  
  public boolean hasDoubleProperty( String name ) {
    final Optional<CodeNode> ann = Optional.ofNullable(props.get(name));
    if ( ann.isPresent() ) {
      if ( ann.get().value_type == 2 ) {
        return true;
      }
    }
    return false;
  }
  
  public double getDoubleProperty( String name ) {
    final Optional<CodeNode> ann = Optional.ofNullable(props.get(name));
    if ( ann.isPresent() ) {
      if ( ann.get().value_type == 2 ) {
        return ann.get().double_value;
      }
    }
    return 0;
  }
  
  public boolean hasStringProperty( String name ) {
    if ( false == (props.containsKey(name)) ) {
      return false;
    }
    final Optional<CodeNode> ann = Optional.ofNullable(props.get(name));
    if ( ann.isPresent() ) {
      if ( ann.get().value_type == 4 ) {
        return true;
      }
    }
    return false;
  }
  
  public String getStringProperty( String name ) {
    final Optional<CodeNode> ann = Optional.ofNullable(props.get(name));
    if ( ann.isPresent() ) {
      if ( ann.get().value_type == 4 ) {
        return ann.get().string_value;
      }
    }
    return "";
  }
  
  public boolean hasBooleanProperty( String name ) {
    final Optional<CodeNode> ann = Optional.ofNullable(props.get(name));
    if ( ann.isPresent() ) {
      if ( ann.get().value_type == 5 ) {
        return true;
      }
    }
    return false;
  }
  
  public boolean getBooleanProperty( String name ) {
    final Optional<CodeNode> ann = Optional.ofNullable(props.get(name));
    if ( ann.isPresent() ) {
      if ( ann.get().value_type == 5 ) {
        return ann.get().boolean_value;
      }
    }
    return false;
  }
  
  public boolean isFirstTypeVref( String vrefName ) {
    if ( (children.size()) > 0 ) {
      final CodeNode fc = children.get(0);
      if ( fc.value_type == 9 ) {
        return true;
      }
    }
    return false;
  }
  
  public boolean isFirstVref( String vrefName ) {
    if ( (children.size()) > 0 ) {
      final CodeNode fc = children.get(0);
      if ( fc.vref.equals(vrefName) ) {
        return true;
      }
    }
    return false;
  }
  
  public String getString() {
    return code.get().code.substring(sp, ep );
  }
  
  public void walk() {
    switch (value_type ) { 
      case 2 : 
        System.out.println(String.valueOf( "Double : " + double_value ) );
        break;
      case 4 : 
        System.out.println(String.valueOf( "String : " + string_value ) );
        break;
    }
    if ( expression ) {
      System.out.println(String.valueOf( "(" ) );
    } else {
      System.out.println(String.valueOf( code.get().code.substring(sp, ep ) ) );
    }
    for ( int i = 0; i < children.size(); i++) {
      CodeNode item = children.get(i);
      item.walk();
    }
    if ( expression ) {
      System.out.println(String.valueOf( ")" ) );
    }
  }
  
  public void writeCode( CodeWriter wr ) {
    switch (value_type ) { 
      case 2 : 
        wr.out(String.valueOf(double_value ), false);
        break;
      case 4 : 
        wr.out((((new String( Character.toChars(34)))) + string_value) + ((new String( Character.toChars(34)))), false);
        break;
      case 3 : 
        wr.out("" + int_value, false);
        break;
      case 5 : 
        if ( boolean_value ) {
          wr.out("true", false);
        } else {
          wr.out("false", false);
        }
        break;
      case 9 : 
        wr.out(vref, false);
        break;
      case 7 : 
        wr.out(vref, false);
        wr.out((((":[" + key_type) + ":") + array_type) + "]", false);
        break;
      case 6 : 
        wr.out(vref, false);
        wr.out((":[" + array_type) + "]", false);
        break;
    }
    if ( expression ) {
      wr.out("(", false);
      for ( int i = 0; i < children.size(); i++) {
        CodeNode ch = children.get(i);
        ch.writeCode(wr);
      }
      wr.out(")", false);
    }
  }
  
  public String getCode() {
    final CodeWriter wr = new CodeWriter();
    this.writeCode(wr);
    return wr.getCode();
  }
  
  public CodeNode rebuildWithType( RangerArgMatch match , boolean changeVref ) {
    final CodeNode newNode = new CodeNode(code.get(), sp, ep);
    newNode.has_operator = has_operator;
    newNode.op_index = op_index;
    newNode.mutable_def = mutable_def;
    newNode.expression = expression;
    if ( changeVref ) {
      newNode.vref = match.getTypeName(vref);
    } else {
      newNode.vref = vref;
    }
    newNode.is_block_node = is_block_node;
    newNode.type_type = match.getTypeName(type_type);
    newNode.type_name = match.getTypeName(type_name);
    newNode.key_type = match.getTypeName(key_type);
    newNode.array_type = match.getTypeName(array_type);
    newNode.value_type = value_type;
    if ( has_vref_annotation ) {
      newNode.has_vref_annotation = true;
      final Optional<CodeNode> ann = vref_annotation;
      newNode.vref_annotation = Optional.of(ann.get().rebuildWithType(match, true));
    }
    if ( has_type_annotation ) {
      newNode.has_type_annotation = true;
      final Optional<CodeNode> t_ann = type_annotation;
      newNode.type_annotation = Optional.of(t_ann.get().rebuildWithType(match, true));
    }
    for ( int i = 0; i < ns.size(); i++) {
      String n = ns.get(i);
      if ( changeVref ) {
        final String new_ns = match.getTypeName(n);
        newNode.ns.add(new_ns);
      } else {
        newNode.vref = vref;
        newNode.ns.add(n);
      }
    }
    switch (value_type ) { 
      case 2 : 
        newNode.double_value = double_value;
        break;
      case 4 : 
        newNode.string_value = string_value;
        break;
      case 3 : 
        newNode.int_value = int_value;
        break;
      case 5 : 
        newNode.boolean_value = boolean_value;
        break;
      case 15 : 
        if ( expression_value.isPresent() ) {
          newNode.expression_value = Optional.of(expression_value.get().rebuildWithType(match, changeVref));
        }
        break;
    }
    for ( int i_1 = 0; i_1 < prop_keys.size(); i_1++) {
      String key = prop_keys.get(i_1);
      newNode.prop_keys.add(key);
      final Optional<CodeNode> oldp = Optional.ofNullable(props.get(key));
      final CodeNode np = oldp.get().rebuildWithType(match, changeVref);
      newNode.props.put(key, np);
    }
    for ( int i_2 = 0; i_2 < children.size(); i_2++) {
      CodeNode ch = children.get(i_2);
      final CodeNode newCh = ch.rebuildWithType(match, changeVref);
      newCh.parent = Optional.of(newNode);
      newNode.children.add(newCh);
    }
    return newNode;
  }
  
  public String buildTypeSignatureUsingMatch( RangerArgMatch match ) {
    final String tName = match.getTypeName(type_name);
    switch (tName ) { 
      case "double" : 
        return "double";
      case "string" : 
        return "string";
      case "integer" : 
        return "int";
      case "boolean" : 
        return "boolean";
    }
    String s = "";
    if ( value_type == 6 ) {
      s = s + "[";
      s = s + match.getTypeName(array_type);
      s = s + this.getTypeSignatureWithMatch(match);
      s = s + "]";
      return s;
    }
    if ( value_type == 7 ) {
      s = s + "[";
      s = s + match.getTypeName(key_type);
      s = s + ":";
      s = s + match.getTypeName(array_type);
      s = s + this.getTypeSignatureWithMatch(match);
      s = s + "]";
      return s;
    }
    s = match.getTypeName(type_name);
    s = s + this.getVRefSignatureWithMatch(match);
    return s;
  }
  
  public String buildTypeSignature() {
    switch (value_type ) { 
      case 2 : 
        return "double";
      case 4 : 
        return "string";
      case 3 : 
        return "int";
      case 5 : 
        return "boolean";
      case 12 : 
        return "char";
      case 13 : 
        return "charbuffer";
    }
    String s = "";
    if ( value_type == 6 ) {
      s = s + "[";
      s = s + array_type;
      s = s + this.getTypeSignature();
      s = s + "]";
      return s;
    }
    if ( value_type == 7 ) {
      s = s + "[";
      s = s + key_type;
      s = s + ":";
      s = s + array_type;
      s = s + this.getTypeSignature();
      s = s + "]";
      return s;
    }
    s = type_name;
    return s;
  }
  
  public String getVRefSignatureWithMatch( RangerArgMatch match ) {
    if ( has_vref_annotation ) {
      final CodeNode nn = vref_annotation.get().rebuildWithType(match, true);
      return "@" + nn.getCode();
    }
    return "";
  }
  
  public String getVRefSignature() {
    if ( has_vref_annotation ) {
      return "@" + vref_annotation.get().getCode();
    }
    return "";
  }
  
  public String getTypeSignatureWithMatch( RangerArgMatch match ) {
    if ( has_type_annotation ) {
      final CodeNode nn = type_annotation.get().rebuildWithType(match, true);
      return "@" + nn.getCode();
    }
    return "";
  }
  
  public String getTypeSignature() {
    if ( has_type_annotation ) {
      return "@" + type_annotation.get().getCode();
    }
    return "";
  }
  
  public int typeNameAsType( RangerAppWriterContext ctx ) {
    switch (type_name ) { 
      case "double" : 
        return 2;
      case "int" : 
        return 3;
      case "string" : 
        return 4;
      case "boolean" : 
        return 5;
      case "char" : 
        return 12;
      case "charbuffer" : 
        return 13;
      default: 
        if ( true == expression ) {
          return 15;
        }
        if ( value_type == 9 ) {
          if ( ctx.isEnumDefined(type_name) ) {
            return 11;
          }
          if ( ctx.isDefinedClass(type_name) ) {
            return 8;
          }
        }
        break;
    }
    return value_type;
  }
  
  public void copyEvalResFrom( CodeNode node ) {
    if ( node.hasParamDesc ) {
      hasParamDesc = node.hasParamDesc;
      paramDesc = node.paramDesc;
    }
    if ( node.typeClass.isPresent() ) {
      typeClass = node.typeClass;
    }
    eval_type = node.eval_type;
    eval_type_name = node.eval_type_name;
    if ( node.hasFlag("optional") ) {
      this.setFlag("optional");
    }
    if ( node.value_type == 7 ) {
      eval_key_type = node.eval_key_type;
      eval_array_type = node.eval_array_type;
      eval_type = 7;
    }
    if ( node.value_type == 6 ) {
      eval_key_type = node.eval_key_type;
      eval_array_type = node.eval_array_type;
      eval_type = 6;
    }
    if ( node.value_type == 15 ) {
      eval_type = 15;
      eval_function = node.eval_function;
    }
  }
  
  public void defineNodeTypeTo( CodeNode node , RangerAppWriterContext ctx ) {
    switch (type_name ) { 
      case "double" : 
        node.value_type = 2;
        node.eval_type = 2;
        node.eval_type_name = "double";
        break;
      case "int" : 
        node.value_type = 3;
        node.eval_type = 3;
        node.eval_type_name = "int";
        break;
      case "char" : 
        node.value_type = 12;
        node.eval_type = 12;
        node.eval_type_name = "char";
        break;
      case "charbuffer" : 
        node.value_type = 13;
        node.eval_type = 13;
        node.eval_type_name = "charbuffer";
        break;
      case "string" : 
        node.value_type = 4;
        node.eval_type = 4;
        node.eval_type_name = "string";
        break;
      case "boolean" : 
        node.value_type = 5;
        node.eval_type = 5;
        node.eval_type_name = "string";
        break;
      default: 
        if ( true == expression ) {
          node.value_type = 15;
          node.eval_type = 15;
          node.expression = true;
        }
        if ( value_type == 6 ) {
          node.value_type = 6;
          node.eval_type = 6;
          node.eval_type_name = type_name;
          node.eval_array_type = array_type;
        }
        if ( value_type == 7 ) {
          node.value_type = 7;
          node.eval_type = 7;
          node.eval_type_name = type_name;
          node.eval_array_type = array_type;
          node.key_type = key_type;
        }
        if ( value_type == 11 ) {
          node.value_type = 11;
          node.eval_type = 11;
          node.eval_type_name = type_name;
        }
        if ( value_type == 9 ) {
          if ( ctx.isEnumDefined(type_name) ) {
            node.value_type = 11;
            node.eval_type = 11;
            node.eval_type_name = type_name;
          }
          if ( ctx.isDefinedClass(type_name) ) {
            node.value_type = 8;
            node.eval_type = 8;
            node.eval_type_name = type_name;
          }
        }
        break;
    }
  }
  
  public void ifNoTypeSetToVoid() {
    if ( (((type_name.length()) == 0) && ((key_type.length()) == 0)) && ((array_type.length()) == 0) ) {
      type_name = "void";
    }
  }
  
  public boolean ifNoTypeSetToEvalTypeOf( CodeNode node ) {
    if ( (((type_name.length()) == 0) && ((key_type.length()) == 0)) && ((array_type.length()) == 0) ) {
      type_name = node.eval_type_name;
      array_type = node.eval_array_type;
      key_type = node.eval_key_type;
      value_type = node.eval_type;
      eval_type = node.eval_type;
      eval_type_name = node.eval_type_name;
      eval_array_type = node.eval_array_type;
      eval_key_type = node.eval_key_type;
      if ( node.value_type == 15 ) {
        if ( !expression_value.isPresent() ) {
          final CodeNode copyOf = node.rebuildWithType(new RangerArgMatch(), false);
          copyOf.children.remove(copyOf.children.size() - 1);
          expression_value = Optional.of(copyOf);
        }
      }
      return true;
    }
    return false;
  }
}
