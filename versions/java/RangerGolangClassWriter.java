import java.util.Optional;
import java.util.*;

class RangerGolangClassWriter extends RangerGenericClassWriter { 
  public String thisName = "this";
  public boolean write_raw_type = false;
  public boolean did_write_nullable = false;
  
  public void WriteScalarValue( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    switch (node.value_type ) { 
      case 2 : 
        wr.out(node.getParsedString(), false);
        break;
      case 4 : 
        final String s = this.EncodeString(node, ctx, wr);
        wr.out(("\"" + s) + "\"", false);
        break;
      case 3 : 
        wr.out("" + node.int_value, false);
        break;
      case 5 : 
        if ( node.boolean_value ) {
          wr.out("true", false);
        } else {
          wr.out("false", false);
        }
        break;
    }
  }
  
  public String getObjectTypeString( String type_string , RangerAppWriterContext ctx ) {
    if ( type_string.equals("this") ) {
      return thisName;
    }
    if ( ctx.isDefinedClass(type_string) ) {
      final RangerAppClassDesc cc = ctx.findClass(type_string);
      if ( cc.doesInherit() ) {
        return "IFACE_" + ctx.transformTypeName(type_string);
      }
    }
    switch (type_string ) { 
      case "int" : 
        return "int64";
      case "string" : 
        return "string";
      case "boolean" : 
        return "bool";
      case "double" : 
        return "float64";
      case "char" : 
        return "byte";
      case "charbuffer" : 
        return "[]byte";
    }
    return ctx.transformTypeName(type_string);
  }
  
  public String getTypeString2( String type_string , RangerAppWriterContext ctx ) {
    if ( type_string.equals("this") ) {
      return thisName;
    }
    switch (type_string ) { 
      case "int" : 
        return "int64";
      case "string" : 
        return "string";
      case "boolean" : 
        return "bool";
      case "double" : 
        return "float64";
      case "char" : 
        return "byte";
      case "charbuffer" : 
        return "[]byte";
    }
    return ctx.transformTypeName(type_string);
  }
  
  public void writeRawTypeDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    write_raw_type = true;
    this.writeTypeDef(node, ctx, wr);
    write_raw_type = false;
  }
  
  public void writeTypeDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    this.writeTypeDef2(node, ctx, wr);
  }
  
  public void writeArrayTypeDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    int v_type = node.value_type;
    String a_name = node.array_type;
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_array_type.length()) > 0 ) {
        a_name = node.eval_array_type;
      }
    }
    switch (v_type ) { 
      case 7 : 
        if ( ctx.isDefinedClass(a_name) ) {
          final RangerAppClassDesc cc = ctx.findClass(a_name);
          if ( cc.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name, ctx), false);
            return;
          }
        }
        if ( ctx.isPrimitiveType(a_name) == false ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name, ctx) + "", false);
        break;
      case 6 : 
        if ( ctx.isDefinedClass(a_name) ) {
          final RangerAppClassDesc cc_1 = ctx.findClass(a_name);
          if ( cc_1.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name, ctx), false);
            return;
          }
        }
        if ( (write_raw_type == false) && (ctx.isPrimitiveType(a_name) == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name, ctx) + "", false);
        break;
      default: 
        break;
    }
  }
  
  public void writeTypeDef2( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    int v_type = node.value_type;
    String t_name = node.type_name;
    String a_name = node.array_type;
    String k_name = node.key_type;
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.length()) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.length()) > 0 ) {
        a_name = node.eval_array_type;
      }
      if ( (node.eval_key_type.length()) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    switch (v_type ) { 
      case 15 : 
        final CodeNode rv = node.expression_value.get().children.get(0);
        final CodeNode sec = node.expression_value.get().children.get(1);
        /** unused:  final CodeNode fc = sec.getFirst()   **/ ;
        wr.out("func(", false);
        for ( int i = 0; i < sec.children.size(); i++) {
          CodeNode arg = sec.children.get(i);
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          this.writeTypeDef2(arg, ctx, wr);
        }
        wr.out(") ", false);
        this.writeTypeDef2(rv, ctx, wr);
        break;
      case 11 : 
        wr.out("int64", false);
        break;
      case 3 : 
        wr.out("int64", false);
        break;
      case 2 : 
        wr.out("float64", false);
        break;
      case 4 : 
        wr.out("string", false);
        break;
      case 5 : 
        wr.out("bool", false);
        break;
      case 12 : 
        wr.out("byte", false);
        break;
      case 13 : 
        wr.out("[]byte", false);
        break;
      case 7 : 
        if ( write_raw_type ) {
          wr.out(this.getObjectTypeString(a_name, ctx) + "", false);
        } else {
          wr.out(("map[" + this.getObjectTypeString(k_name, ctx)) + "]", false);
          if ( ctx.isDefinedClass(a_name) ) {
            final RangerAppClassDesc cc = ctx.findClass(a_name);
            if ( cc.doesInherit() ) {
              wr.out("IFACE_" + this.getTypeString2(a_name, ctx), false);
              return;
            }
          }
          if ( (write_raw_type == false) && (ctx.isPrimitiveType(a_name) == false) ) {
            wr.out("*", false);
          }
          wr.out(this.getObjectTypeString(a_name, ctx) + "", false);
        }
        break;
      case 6 : 
        if ( false == write_raw_type ) {
          wr.out("[]", false);
        }
        if ( ctx.isDefinedClass(a_name) ) {
          final RangerAppClassDesc cc_1 = ctx.findClass(a_name);
          if ( cc_1.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name, ctx), false);
            return;
          }
        }
        if ( (write_raw_type == false) && (ctx.isPrimitiveType(a_name) == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name, ctx) + "", false);
        break;
      default: 
        if ( node.type_name.equals("void") ) {
          wr.out("()", false);
          return;
        }
        boolean b_iface = false;
        if ( ctx.isDefinedClass(t_name) ) {
          final RangerAppClassDesc cc_2 = ctx.findClass(t_name);
          b_iface = cc_2.is_interface;
        }
        if ( ctx.isDefinedClass(t_name) ) {
          final RangerAppClassDesc cc_3 = ctx.findClass(t_name);
          if ( cc_3.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(t_name, ctx), false);
            return;
          }
        }
        if ( ((write_raw_type == false) && (node.isPrimitiveType() == false)) && (b_iface == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getTypeString2(t_name, ctx), false);
        break;
    }
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.vref.equals("this") ) {
      wr.out(thisName, false);
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.size()) > 1 ) {
        final String rootObjName = node.ns.get(0);
        final String enumName = node.ns.get(1);
        final Optional<RangerAppEnum> e = ctx.getEnum(rootObjName);
        if ( e.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e.get().values.get(enumName))).get()), false);
          return;
        }
      }
    }
    boolean next_is_gs = false;
    /** unused:  final boolean last_was_setter = false   **/ ;
    boolean needs_par = false;
    final int ns_last = (node.ns.size()) - 1;
    if ( (node.nsp.size()) > 0 ) {
      boolean had_static = false;
      for ( int i = 0; i < node.nsp.size(); i++) {
        RangerAppParamDesc p = node.nsp.get(i);
        if ( next_is_gs ) {
          if ( p.isProperty() ) {
            wr.out(".Get_", false);
            needs_par = true;
          } else {
            needs_par = false;
          }
          next_is_gs = false;
        }
        if ( needs_par == false ) {
          if ( i > 0 ) {
            if ( had_static ) {
              wr.out("_static_", false);
            } else {
              wr.out(".", false);
            }
          }
        }
        if ( (p.nameNode.isPresent()) && ctx.isDefinedClass(p.nameNode.get().type_name) ) {
          final RangerAppClassDesc c = ctx.findClass(p.nameNode.get().type_name);
          if ( c.doesInherit() ) {
            next_is_gs = true;
          }
        }
        if ( i == 0 ) {
          final String part = node.ns.get(0);
          if ( part.equals("this") ) {
            wr.out(thisName, false);
            continue;
          }
          if ( (!part.equals(thisName)) && ctx.isMemberVariable(part) ) {
            final Optional<RangerAppClassDesc> cc = ctx.getCurrentClass();
            final RangerAppClassDesc currC = cc.get();
            final Optional<RangerAppParamDesc> up = currC.findVariable(part);
            if ( up.isPresent() ) {
              /** unused:  final RangerAppParamDesc p3 = up.get()   **/ ;
              wr.out(thisName + ".", false);
            }
          }
        }
        if ( (p.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p.compiledName), false);
        } else {
          if ( (p.name.length()) > 0 ) {
            wr.out(this.adjustType(p.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i))), false);
          }
        }
        if ( needs_par ) {
          wr.out("()", false);
          needs_par = false;
        }
        if ( ((p.nameNode.isPresent()) && p.nameNode.get().hasFlag("optional")) && (i != ns_last) ) {
          wr.out(".value.(", false);
          this.writeTypeDef(p.nameNode.get(), ctx, wr);
          wr.out(")", false);
        }
        if ( p.isClass() ) {
          had_static = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final String part_1 = node.ns.get(0);
      if ( (!part_1.equals(thisName)) && ctx.isMemberVariable(part_1) ) {
        final Optional<RangerAppClassDesc> cc_1 = ctx.getCurrentClass();
        final RangerAppClassDesc currC_1 = cc_1.get();
        final Optional<RangerAppParamDesc> up_1 = currC_1.findVariable(part_1);
        if ( up_1.isPresent() ) {
          /** unused:  final RangerAppParamDesc p3_1 = up_1.get()   **/ ;
          wr.out(thisName + ".", false);
        }
      }
      final Optional<RangerAppParamDesc> p_1 = node.paramDesc;
      wr.out(p_1.get().compiledName, false);
      return;
    }
    boolean b_was_static = false;
    for ( int i_1 = 0; i_1 < node.ns.size(); i_1++) {
      String part_2 = node.ns.get(i_1);
      if ( i_1 > 0 ) {
        if ( (i_1 == 1) && b_was_static ) {
          wr.out("_static_", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_1 == 0 ) {
        if ( part_2.equals("this") ) {
          wr.out(thisName, false);
          continue;
        }
        if ( ctx.hasClass(part_2) ) {
          b_was_static = true;
        }
        if ( (!part_2.equals("this")) && ctx.isMemberVariable(part_2) ) {
          final Optional<RangerAppClassDesc> cc_2 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_2 = cc_2.get();
          final Optional<RangerAppParamDesc> up_2 = currC_2.findVariable(part_2);
          if ( up_2.isPresent() ) {
            /** unused:  final RangerAppParamDesc p3_2 = up_2.get()   **/ ;
            wr.out(thisName + ".", false);
          }
        }
      }
      wr.out(this.adjustType(part_2), false);
    }
  }
  
  public void WriteSetterVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.vref.equals("this") ) {
      wr.out(thisName, false);
      return;
    }
    if ( node.eval_type == 11 ) {
      final String rootObjName = node.ns.get(0);
      final String enumName = node.ns.get(1);
      final Optional<RangerAppEnum> e = ctx.getEnum(rootObjName);
      if ( e.isPresent() ) {
        wr.out("" + ((Optional.ofNullable(e.get().values.get(enumName))).get()), false);
        return;
      }
    }
    boolean next_is_gs = false;
    /** unused:  final boolean last_was_setter = false   **/ ;
    boolean needs_par = false;
    final int ns_len = (node.ns.size()) - 1;
    if ( (node.nsp.size()) > 0 ) {
      boolean had_static = false;
      for ( int i = 0; i < node.nsp.size(); i++) {
        RangerAppParamDesc p = node.nsp.get(i);
        if ( next_is_gs ) {
          if ( p.isProperty() ) {
            wr.out(".Get_", false);
            needs_par = true;
          } else {
            needs_par = false;
          }
          next_is_gs = false;
        }
        if ( needs_par == false ) {
          if ( i > 0 ) {
            if ( had_static ) {
              wr.out("_static_", false);
            } else {
              wr.out(".", false);
            }
          }
        }
        if ( ctx.isDefinedClass(p.nameNode.get().type_name) ) {
          final RangerAppClassDesc c = ctx.findClass(p.nameNode.get().type_name);
          if ( c.doesInherit() ) {
            next_is_gs = true;
          }
        }
        if ( i == 0 ) {
          final String part = node.ns.get(0);
          if ( part.equals("this") ) {
            wr.out(thisName, false);
            continue;
          }
          if ( (!part.equals(thisName)) && ctx.isMemberVariable(part) ) {
            final Optional<RangerAppClassDesc> cc = ctx.getCurrentClass();
            final RangerAppClassDesc currC = cc.get();
            final Optional<RangerAppParamDesc> up = currC.findVariable(part);
            if ( up.isPresent() ) {
              /** unused:  final RangerAppParamDesc p3 = up.get()   **/ ;
              wr.out(thisName + ".", false);
            }
          }
        }
        if ( (p.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p.compiledName), false);
        } else {
          if ( (p.name.length()) > 0 ) {
            wr.out(this.adjustType(p.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i))), false);
          }
        }
        if ( needs_par ) {
          wr.out("()", false);
          needs_par = false;
        }
        if ( i < ns_len ) {
          if ( p.nameNode.get().hasFlag("optional") ) {
            wr.out(".value.(", false);
            this.writeTypeDef(p.nameNode.get(), ctx, wr);
            wr.out(")", false);
          }
        }
        if ( p.isClass() ) {
          had_static = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final String part_1 = node.ns.get(0);
      if ( (!part_1.equals(thisName)) && ctx.isMemberVariable(part_1) ) {
        final Optional<RangerAppClassDesc> cc_1 = ctx.getCurrentClass();
        final RangerAppClassDesc currC_1 = cc_1.get();
        final Optional<RangerAppParamDesc> up_1 = currC_1.findVariable(part_1);
        if ( up_1.isPresent() ) {
          /** unused:  final RangerAppParamDesc p3_1 = up_1.get()   **/ ;
          wr.out(thisName + ".", false);
        }
      }
      final Optional<RangerAppParamDesc> p_1 = node.paramDesc;
      wr.out(p_1.get().compiledName, false);
      return;
    }
    boolean b_was_static = false;
    for ( int i_1 = 0; i_1 < node.ns.size(); i_1++) {
      String part_2 = node.ns.get(i_1);
      if ( i_1 > 0 ) {
        if ( (i_1 == 1) && b_was_static ) {
          wr.out("_static_", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_1 == 0 ) {
        if ( part_2.equals("this") ) {
          wr.out(thisName, false);
          continue;
        }
        if ( ctx.hasClass(part_2) ) {
          b_was_static = true;
        }
        if ( (!part_2.equals("this")) && ctx.isMemberVariable(part_2) ) {
          final Optional<RangerAppClassDesc> cc_2 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_2 = cc_2.get();
          final Optional<RangerAppParamDesc> up_2 = currC_2.findVariable(part_2);
          if ( up_2.isPresent() ) {
            /** unused:  final RangerAppParamDesc p3_2 = up_2.get()   **/ ;
            wr.out(thisName + ".", false);
          }
        }
      }
      wr.out(this.adjustType(part_2), false);
    }
  }
  
  public void goExtractAssign( CodeNode value , RangerAppParamDesc p , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode arr_node = value.children.get(1);
    wr.newline();
    wr.out("", true);
    wr.out("// array_extract operator ", true);
    wr.out("var ", false);
    final RangerAppParamDesc pArr = new RangerAppParamDesc();
    pArr.name = "_arrTemp";
    pArr.node = Optional.of(arr_node);
    pArr.nameNode = Optional.of(arr_node);
    pArr.is_optional = false;
    ctx.defineVariable(p.name, pArr);
    wr.out(pArr.compiledName, false);
    wr.out(" ", false);
    this.writeTypeDef(arr_node, ctx, wr);
    wr.newline();
    wr.out(((p.compiledName + " , ") + pArr.compiledName) + " = ", false);
    ctx.setInExpr();
    this.WalkNode(value, ctx, wr);
    ctx.unsetInExpr();
    wr.out(";", true);
    final CodeNode left = arr_node;
    final int a_len = (left.ns.size()) - 1;
    /** unused:  final String last_part = left.ns.get(a_len)   **/ ;
    boolean next_is_gs = false;
    boolean last_was_setter = false;
    boolean needs_par = false;
    boolean b_was_static = false;
    for ( int i = 0; i < left.ns.size(); i++) {
      String part = left.ns.get(i);
      if ( next_is_gs ) {
        if ( i == a_len ) {
          wr.out(".Set_", false);
          last_was_setter = true;
        } else {
          wr.out(".Get_", false);
          needs_par = true;
          next_is_gs = false;
          last_was_setter = false;
        }
      }
      if ( (last_was_setter == false) && (needs_par == false) ) {
        if ( i > 0 ) {
          if ( (i == 1) && b_was_static ) {
            wr.out("_static_", false);
          } else {
            wr.out(".", false);
          }
        }
      }
      if ( i == 0 ) {
        if ( part.equals("this") ) {
          wr.out(thisName, false);
          continue;
        }
        if ( ctx.hasClass(part) ) {
          b_was_static = true;
        }
        final RangerAppParamDesc partDef = ctx.getVariableDef(part);
        if ( partDef.nameNode.isPresent() ) {
          if ( ctx.isDefinedClass(partDef.nameNode.get().type_name) ) {
            final RangerAppClassDesc c = ctx.findClass(partDef.nameNode.get().type_name);
            if ( c.doesInherit() ) {
              next_is_gs = true;
            }
          }
        }
        if ( (!part.equals("this")) && ctx.isMemberVariable(part) ) {
          final Optional<RangerAppClassDesc> cc = ctx.getCurrentClass();
          final RangerAppClassDesc currC = cc.get();
          final Optional<RangerAppParamDesc> up = currC.findVariable(part);
          if ( up.isPresent() ) {
            /** unused:  final RangerAppParamDesc p3 = up.get()   **/ ;
            wr.out(thisName + ".", false);
          }
        }
      }
      if ( (left.nsp.size()) > 0 ) {
        final RangerAppParamDesc p_1 = left.nsp.get(i);
        wr.out(this.adjustType(p_1.compiledName), false);
      } else {
        if ( left.hasParamDesc ) {
          wr.out(left.paramDesc.get().compiledName, false);
        } else {
          wr.out(this.adjustType(part), false);
        }
      }
      if ( needs_par ) {
        wr.out("()", false);
        needs_par = false;
      }
      if ( (left.nsp.size()) >= (i + 1) ) {
        final RangerAppParamDesc pp = left.nsp.get(i);
        if ( pp.nameNode.get().hasFlag("optional") ) {
          wr.out(".value.(", false);
          this.writeTypeDef(pp.nameNode.get(), ctx, wr);
          wr.out(")", false);
        }
      }
    }
    if ( last_was_setter ) {
      wr.out("(", false);
      wr.out(pArr.compiledName, false);
      wr.out("); ", true);
    } else {
      wr.out(" = ", false);
      wr.out(pArr.compiledName, false);
      wr.out("; ", true);
    }
    wr.out("", true);
  }
  
  public void writeStructField( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn = node.children.get(1);
      final Optional<RangerAppParamDesc> p = nn.paramDesc;
      wr.out(p.get().compiledName + " ", false);
      if ( p.get().nameNode.get().hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
      }
      if ( p.get().ref_cnt == 0 ) {
        wr.out(" /**  unused  **/ ", false);
      }
      wr.out("", true);
      if ( p.get().nameNode.get().hasFlag("optional") ) {
      }
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn = node.children.get(1);
      final Optional<RangerAppParamDesc> p = nn.paramDesc;
      boolean b_not_used = false;
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out(("/** unused:  " + p.get().compiledName) + "*/", true);
        b_not_used = true;
        return;
      }
      final boolean map_or_hash = (nn.value_type == 6) || (nn.value_type == 7);
      if ( nn.hasFlag("optional") ) {
        wr.out(("var " + p.get().compiledName) + " *GoNullable = new(GoNullable); ", true);
        if ( (node.children.size()) > 2 ) {
          final CodeNode value = node.children.get(2);
          if ( value.hasParamDesc ) {
            final Optional<CodeNode> pnn = value.paramDesc.get().nameNode;
            if ( pnn.get().hasFlag("optional") ) {
              wr.out(p.get().compiledName + ".value = ", false);
              ctx.setInExpr();
              final CodeNode value_1 = node.getThird();
              this.WalkNode(value_1, ctx, wr);
              ctx.unsetInExpr();
              wr.out(".value;", true);
              wr.out(p.get().compiledName + ".has_value = ", false);
              ctx.setInExpr();
              final CodeNode value_2 = node.getThird();
              this.WalkNode(value_2, ctx, wr);
              ctx.unsetInExpr();
              wr.out(".has_value;", true);
              return;
            } else {
              wr.out(p.get().compiledName + ".value = ", false);
              ctx.setInExpr();
              final CodeNode value_3 = node.getThird();
              this.WalkNode(value_3, ctx, wr);
              ctx.unsetInExpr();
              wr.out(";", true);
              wr.out(p.get().compiledName + ".has_value = true;", true);
              return;
            }
          } else {
            wr.out(p.get().compiledName + " = ", false);
            ctx.setInExpr();
            final CodeNode value_4 = node.getThird();
            this.WalkNode(value_4, ctx, wr);
            ctx.unsetInExpr();
            wr.out(";", true);
            return;
          }
        }
        return;
      } else {
        if ( ((p.get().set_cnt > 0) || p.get().is_class_variable) || map_or_hash ) {
          wr.out(("var " + p.get().compiledName) + " ", false);
        } else {
          wr.out(("var " + p.get().compiledName) + " ", false);
        }
      }
      this.writeTypeDef2(p.get().nameNode.get(), ctx, wr);
      if ( (node.children.size()) > 2 ) {
        final CodeNode value_5 = node.getThird();
        if ( value_5.expression && ((value_5.children.size()) > 1) ) {
          final CodeNode fc = value_5.children.get(0);
          if ( fc.vref.equals("array_extract") ) {
            this.goExtractAssign(value_5, p.get(), ctx, wr);
            return;
          }
        }
        wr.out(" = ", false);
        ctx.setInExpr();
        this.WalkNode(value_5, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = make(", false);
          this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
          wr.out(", 0)", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = make(", false);
          this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
          wr.out(")", false);
        }
      }
      wr.out(";", false);
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("   **/ ", true);
      } else {
        wr.newline();
      }
      if ( b_not_used == false ) {
        if ( nn.hasFlag("optional") ) {
          wr.addImport("errors");
        }
      }
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i = 0; i < fnDesc.params.size(); i++) {
      RangerAppParamDesc arg = fnDesc.params.get(i);
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg.name + " ", false);
      if ( arg.nameNode.get().hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(arg.nameNode.get(), ctx, wr);
      }
    }
  }
  
  public void writeNewCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasNewOper ) {
      final Optional<RangerAppClassDesc> cl = node.clDesc;
      /** unused:  final CodeNode fc = node.getSecond()   **/ ;
      wr.out(("CreateNew_" + node.clDesc.get().name) + "(", false);
      final Optional<RangerAppFunctionDesc> constr = cl.get().constructor_fn;
      final CodeNode givenArgs = node.getThird();
      if ( constr.isPresent() ) {
        for ( int i = 0; i < constr.get().params.size(); i++) {
          RangerAppParamDesc arg = constr.get().params.get(i);
          final CodeNode n = givenArgs.children.get(i);
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (arg.nameNode.isPresent()) ) {
            this.WalkNode(n, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  
  public void CreateLambdaCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fName = node.children.get(0);
    final CodeNode args = node.children.get(1);
    this.WriteVRef(fName, ctx, wr);
    wr.out("(", false);
    for ( int i = 0; i < args.children.size(); i++) {
      CodeNode arg = args.children.get(i);
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.value_type != 0 ) {
        this.WalkNode(arg, ctx, wr);
      }
    }
    wr.out(")", false);
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(";", true);
    }
  }
  
  public void CreateLambda( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final RangerAppWriterContext lambdaCtx = node.lambda_ctx.get();
    final CodeNode fnNode = node.children.get(0);
    final CodeNode args = node.children.get(1);
    final CodeNode body = node.children.get(2);
    wr.out("func (", false);
    for ( int i = 0; i < args.children.size(); i++) {
      CodeNode arg = args.children.get(i);
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      this.WalkNode(arg, lambdaCtx, wr);
      wr.out(" ", false);
      if ( arg.hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(arg, lambdaCtx, wr);
      }
    }
    wr.out(") ", false);
    if ( fnNode.hasFlag("optional") ) {
      wr.out("*GoNullable", false);
    } else {
      this.writeTypeDef(fnNode, lambdaCtx, wr);
    }
    wr.out(" {", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( int i_1 = 0; i_1 < body.children.size(); i_1++) {
      CodeNode item = body.children.get(i_1);
      this.WalkNode(item, lambdaCtx, wr);
    }
    wr.newline();
    wr.indent(-1);
    wr.out("}", false);
  }
  
  public void CustomOperator( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fc = node.getFirst();
    final String cmd = fc.vref;
    if ( ((cmd.equals("=")) || (cmd.equals("push"))) || (cmd.equals("removeLast")) ) {
      final CodeNode left = node.getSecond();
      CodeNode right = left;
      if ( (cmd.equals("=")) || (cmd.equals("push")) ) {
        right = node.getThird();
      }
      wr.newline();
      boolean b_was_static = false;
      if ( left.hasParamDesc ) {
        final int a_len = (left.ns.size()) - 1;
        /** unused:  final String last_part = left.ns.get(a_len)   **/ ;
        boolean next_is_gs = false;
        boolean last_was_setter = false;
        boolean needs_par = false;
        for ( int i = 0; i < left.ns.size(); i++) {
          String part = left.ns.get(i);
          if ( next_is_gs ) {
            if ( i == a_len ) {
              wr.out(".Set_", false);
              last_was_setter = true;
            } else {
              wr.out(".Get_", false);
              needs_par = true;
              next_is_gs = false;
              last_was_setter = false;
            }
          }
          if ( (last_was_setter == false) && (needs_par == false) ) {
            if ( i > 0 ) {
              if ( (i == 1) && b_was_static ) {
                wr.out("_static_", false);
              } else {
                wr.out(".", false);
              }
            }
          }
          if ( i == 0 ) {
            if ( part.equals("this") ) {
              wr.out(thisName, false);
              continue;
            }
            if ( ctx.hasClass(part) ) {
              b_was_static = true;
            }
            if ( (!part.equals("this")) && ctx.isMemberVariable(part) ) {
              final Optional<RangerAppClassDesc> cc = ctx.getCurrentClass();
              final RangerAppClassDesc currC = cc.get();
              final Optional<RangerAppParamDesc> up = currC.findVariable(part);
              if ( up.isPresent() ) {
                /** unused:  final RangerAppParamDesc p3 = up.get()   **/ ;
                wr.out(thisName + ".", false);
              }
            }
          }
          RangerAppParamDesc partDef = ctx.getVariableDef(part);
          if ( (left.nsp.size()) > i ) {
            partDef = left.nsp.get(i);
          }
          if ( partDef.nameNode.isPresent() ) {
            if ( ctx.isDefinedClass(partDef.nameNode.get().type_name) ) {
              final RangerAppClassDesc c = ctx.findClass(partDef.nameNode.get().type_name);
              if ( c.doesInherit() ) {
                next_is_gs = true;
              }
            }
          }
          if ( (left.nsp.size()) > 0 ) {
            final RangerAppParamDesc p = left.nsp.get(i);
            wr.out(this.adjustType(p.compiledName), false);
          } else {
            if ( left.hasParamDesc ) {
              wr.out(left.paramDesc.get().compiledName, false);
            } else {
              wr.out(this.adjustType(part), false);
            }
          }
          if ( needs_par ) {
            wr.out("()", false);
            needs_par = false;
          }
          if ( (left.nsp.size()) >= (i + 1) ) {
            final RangerAppParamDesc pp = left.nsp.get(i);
            if ( pp.nameNode.get().hasFlag("optional") ) {
              wr.out(".value.(", false);
              this.writeTypeDef(pp.nameNode.get(), ctx, wr);
              wr.out(")", false);
            }
          }
        }
        if ( cmd.equals("removeLast") ) {
          if ( last_was_setter ) {
            wr.out("(", false);
            ctx.setInExpr();
            this.WalkNode(left, ctx, wr);
            wr.out("[:len(", false);
            this.WalkNode(left, ctx, wr);
            wr.out(")-1]", false);
            ctx.unsetInExpr();
            wr.out("); ", true);
          } else {
            wr.out(" = ", false);
            ctx.setInExpr();
            this.WalkNode(left, ctx, wr);
            wr.out("[:len(", false);
            this.WalkNode(left, ctx, wr);
            wr.out(")-1]", false);
            ctx.unsetInExpr();
            wr.out("; ", true);
          }
          return;
        }
        if ( cmd.equals("push") ) {
          if ( last_was_setter ) {
            wr.out("(", false);
            ctx.setInExpr();
            wr.out("append(", false);
            this.WalkNode(left, ctx, wr);
            wr.out(",", false);
            this.WalkNode(right, ctx, wr);
            ctx.unsetInExpr();
            wr.out(")); ", true);
          } else {
            wr.out(" = ", false);
            wr.out("append(", false);
            ctx.setInExpr();
            this.WalkNode(left, ctx, wr);
            wr.out(",", false);
            this.WalkNode(right, ctx, wr);
            ctx.unsetInExpr();
            wr.out("); ", true);
          }
          return;
        }
        if ( last_was_setter ) {
          wr.out("(", false);
          ctx.setInExpr();
          this.WalkNode(right, ctx, wr);
          ctx.unsetInExpr();
          wr.out("); ", true);
        } else {
          wr.out(" = ", false);
          ctx.setInExpr();
          this.WalkNode(right, ctx, wr);
          ctx.unsetInExpr();
          wr.out("; ", true);
        }
        return;
      }
      this.WriteSetterVRef(left, ctx, wr);
      wr.out(" = ", false);
      ctx.setInExpr();
      this.WalkNode(right, ctx, wr);
      ctx.unsetInExpr();
      wr.out("; /* custom */", true);
    }
  }
  
  public void writeInterface( RangerAppClassDesc cl , RangerAppWriterContext ctx , CodeWriter wr ) {
    wr.out(("type " + cl.name) + " interface { ", true);
    wr.indent(1);
    for ( int i = 0; i < cl.defined_variants.size(); i++) {
      String fnVar = cl.defined_variants.get(i);
      final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(cl.method_variants.get(fnVar));
      for ( int i_1 = 0; i_1 < mVs.get().variants.size(); i_1++) {
        RangerAppFunctionDesc variant = mVs.get().variants.get(i_1);
        wr.out(variant.compiledName + "(", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") ", false);
        if ( variant.nameNode.get().hasFlag("optional") ) {
          wr.out("*GoNullable", false);
        } else {
          this.writeTypeDef(variant.nameNode.get(), ctx, wr);
        }
        wr.out("", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl = node.clDesc;
    if ( !cl.isPresent() ) {
      return;
    }
    final CodeWriter wr = orig_wr;
    if ( did_write_nullable == false ) {
      wr.raw("\r\ntype GoNullable struct { \r\n  value interface{}\r\n  has_value bool\r\n}\r\n", true);
      wr.createTag("utilities");
      did_write_nullable = true;
    }
    HashMap<String,Boolean> declaredVariable = new HashMap<String,Boolean>();
    wr.out(("type " + cl.get().name) + " struct { ", true);
    wr.indent(1);
    for ( int i = 0; i < cl.get().variables.size(); i++) {
      RangerAppParamDesc pvar = cl.get().variables.get(i);
      this.writeStructField(pvar.node.get(), ctx, wr);
      declaredVariable.put(pvar.name, true);
    }
    if ( (cl.get().extends_classes.size()) > 0 ) {
      for ( int i_1 = 0; i_1 < cl.get().extends_classes.size(); i_1++) {
        String pName = cl.get().extends_classes.get(i_1);
        final RangerAppClassDesc pC = ctx.findClass(pName);
        wr.out("// inherited from parent class " + pName, true);
        for ( int i_2 = 0; i_2 < pC.variables.size(); i_2++) {
          RangerAppParamDesc pvar_1 = pC.variables.get(i_2);
          if ( declaredVariable.containsKey(pvar_1.name) ) {
            continue;
          }
          this.writeStructField(pvar_1.node.get(), ctx, wr);
        }
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    wr.out(("type IFACE_" + cl.get().name) + " interface { ", true);
    wr.indent(1);
    for ( int i_3 = 0; i_3 < cl.get().variables.size(); i_3++) {
      RangerAppParamDesc p = cl.get().variables.get(i_3);
      wr.out("Get_", false);
      wr.out(p.compiledName + "() ", false);
      if ( p.nameNode.get().hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p.nameNode.get(), ctx, wr);
      }
      wr.out("", true);
      wr.out("Set_", false);
      wr.out(p.compiledName + "(value ", false);
      if ( p.nameNode.get().hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p.nameNode.get(), ctx, wr);
      }
      wr.out(") ", true);
    }
    for ( int i_4 = 0; i_4 < cl.get().defined_variants.size(); i_4++) {
      String fnVar = cl.get().defined_variants.get(i_4);
      final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(cl.get().method_variants.get(fnVar));
      for ( int i_5 = 0; i_5 < mVs.get().variants.size(); i_5++) {
        RangerAppFunctionDesc variant = mVs.get().variants.get(i_5);
        wr.out(variant.compiledName + "(", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") ", false);
        if ( variant.nameNode.get().hasFlag("optional") ) {
          wr.out("*GoNullable", false);
        } else {
          this.writeTypeDef(variant.nameNode.get(), ctx, wr);
        }
        wr.out("", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    thisName = "me";
    wr.out("", true);
    wr.out(("func CreateNew_" + cl.get().name) + "(", false);
    if ( cl.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr = cl.get().constructor_fn;
      for ( int i_6 = 0; i_6 < constr.get().params.size(); i_6++) {
        RangerAppParamDesc arg = constr.get().params.get(i_6);
        if ( i_6 > 0 ) {
          wr.out(", ", false);
        }
        wr.out(arg.name + " ", false);
        this.writeTypeDef(arg.nameNode.get(), ctx, wr);
      }
    }
    wr.out((") *" + cl.get().name) + " {", true);
    wr.indent(1);
    wr.newline();
    wr.out(("me := new(" + cl.get().name) + ")", true);
    for ( int i_7 = 0; i_7 < cl.get().variables.size(); i_7++) {
      RangerAppParamDesc pvar_2 = cl.get().variables.get(i_7);
      final CodeNode nn = pvar_2.node.get();
      if ( (nn.children.size()) > 2 ) {
        final CodeNode valueNode = nn.children.get(2);
        wr.out(("me." + pvar_2.compiledName) + " = ", false);
        this.WalkNode(valueNode, ctx, wr);
        wr.out("", true);
      } else {
        final Optional<CodeNode> pNameN = pvar_2.nameNode;
        if ( pNameN.get().value_type == 6 ) {
          wr.out(("me." + pvar_2.compiledName) + " = ", false);
          wr.out("make(", false);
          this.writeTypeDef(pvar_2.nameNode.get(), ctx, wr);
          wr.out(",0)", true);
        }
        if ( pNameN.get().value_type == 7 ) {
          wr.out(("me." + pvar_2.compiledName) + " = ", false);
          wr.out("make(", false);
          this.writeTypeDef(pvar_2.nameNode.get(), ctx, wr);
          wr.out(")", true);
        }
      }
    }
    for ( int i_8 = 0; i_8 < cl.get().variables.size(); i_8++) {
      RangerAppParamDesc pvar_3 = cl.get().variables.get(i_8);
      if ( pvar_3.nameNode.get().hasFlag("optional") ) {
        wr.out(("me." + pvar_3.compiledName) + " = new(GoNullable);", true);
      }
    }
    if ( (cl.get().extends_classes.size()) > 0 ) {
      for ( int i_9 = 0; i_9 < cl.get().extends_classes.size(); i_9++) {
        String pName_1 = cl.get().extends_classes.get(i_9);
        final RangerAppClassDesc pC_1 = ctx.findClass(pName_1);
        for ( int i_10 = 0; i_10 < pC_1.variables.size(); i_10++) {
          RangerAppParamDesc pvar_4 = pC_1.variables.get(i_10);
          final CodeNode nn_1 = pvar_4.node.get();
          if ( (nn_1.children.size()) > 2 ) {
            final CodeNode valueNode_1 = nn_1.children.get(2);
            wr.out(("me." + pvar_4.compiledName) + " = ", false);
            this.WalkNode(valueNode_1, ctx, wr);
            wr.out("", true);
          } else {
            final CodeNode pNameN_1 = pvar_4.nameNode.get();
            if ( pNameN_1.value_type == 6 ) {
              wr.out(("me." + pvar_4.compiledName) + " = ", false);
              wr.out("make(", false);
              this.writeTypeDef(pvar_4.nameNode.get(), ctx, wr);
              wr.out(",0)", true);
            }
            if ( pNameN_1.value_type == 7 ) {
              wr.out(("me." + pvar_4.compiledName) + " = ", false);
              wr.out("make(", false);
              this.writeTypeDef(pvar_4.nameNode.get(), ctx, wr);
              wr.out(")", true);
            }
          }
        }
        for ( int i_11 = 0; i_11 < pC_1.variables.size(); i_11++) {
          RangerAppParamDesc pvar_5 = pC_1.variables.get(i_11);
          if ( pvar_5.nameNode.get().hasFlag("optional") ) {
            wr.out(("me." + pvar_5.compiledName) + " = new(GoNullable);", true);
          }
        }
        if ( pC_1.has_constructor ) {
          final Optional<RangerAppFunctionDesc> constr_1 = pC_1.constructor_fn;
          final RangerAppWriterContext subCtx = constr_1.get().fnCtx.get();
          subCtx.is_function = true;
          this.WalkNode(constr_1.get().fnBody.get(), subCtx, wr);
        }
      }
    }
    if ( cl.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_2 = cl.get().constructor_fn;
      final RangerAppWriterContext subCtx_1 = constr_2.get().fnCtx.get();
      subCtx_1.is_function = true;
      this.WalkNode(constr_2.get().fnBody.get(), subCtx_1, wr);
    }
    wr.out("return me;", true);
    wr.indent(-1);
    wr.out("}", true);
    thisName = "this";
    for ( int i_12 = 0; i_12 < cl.get().static_methods.size(); i_12++) {
      RangerAppFunctionDesc variant_1 = cl.get().static_methods.get(i_12);
      if ( variant_1.nameNode.get().hasFlag("main") ) {
        continue;
      }
      wr.newline();
      wr.out(((("func " + cl.get().name) + "_static_") + variant_1.compiledName) + "(", false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") ", false);
      this.writeTypeDef(variant_1.nameNode.get(), ctx, wr);
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      final RangerAppWriterContext subCtx_2 = variant_1.fnCtx.get();
      subCtx_2.is_function = true;
      this.WalkNode(variant_1.fnBody.get(), subCtx_2, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    HashMap<String,Boolean> declaredFn = new HashMap<String,Boolean>();
    for ( int i_13 = 0; i_13 < cl.get().defined_variants.size(); i_13++) {
      String fnVar_1 = cl.get().defined_variants.get(i_13);
      final Optional<RangerAppMethodVariants> mVs_1 = Optional.ofNullable(cl.get().method_variants.get(fnVar_1));
      for ( int i_14 = 0; i_14 < mVs_1.get().variants.size(); i_14++) {
        RangerAppFunctionDesc variant_2 = mVs_1.get().variants.get(i_14);
        declaredFn.put(variant_2.name, true);
        wr.out(((("func (this *" + cl.get().name) + ") ") + variant_2.compiledName) + " (", false);
        this.writeArgsDef(variant_2, ctx, wr);
        wr.out(") ", false);
        if ( variant_2.nameNode.get().hasFlag("optional") ) {
          wr.out("*GoNullable", false);
        } else {
          this.writeTypeDef(variant_2.nameNode.get(), ctx, wr);
        }
        wr.out(" {", true);
        wr.indent(1);
        wr.newline();
        final RangerAppWriterContext subCtx_3 = variant_2.fnCtx.get();
        subCtx_3.is_function = true;
        this.WalkNode(variant_2.fnBody.get(), subCtx_3, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    if ( (cl.get().extends_classes.size()) > 0 ) {
      for ( int i_15 = 0; i_15 < cl.get().extends_classes.size(); i_15++) {
        String pName_2 = cl.get().extends_classes.get(i_15);
        final RangerAppClassDesc pC_2 = ctx.findClass(pName_2);
        wr.out("// inherited methods from parent class " + pName_2, true);
        for ( int i_16 = 0; i_16 < pC_2.defined_variants.size(); i_16++) {
          String fnVar_2 = pC_2.defined_variants.get(i_16);
          final Optional<RangerAppMethodVariants> mVs_2 = Optional.ofNullable(pC_2.method_variants.get(fnVar_2));
          for ( int i_17 = 0; i_17 < mVs_2.get().variants.size(); i_17++) {
            RangerAppFunctionDesc variant_3 = mVs_2.get().variants.get(i_17);
            if ( declaredFn.containsKey(variant_3.name) ) {
              continue;
            }
            wr.out(((("func (this *" + cl.get().name) + ") ") + variant_3.compiledName) + " (", false);
            this.writeArgsDef(variant_3, ctx, wr);
            wr.out(") ", false);
            if ( variant_3.nameNode.get().hasFlag("optional") ) {
              wr.out("*GoNullable", false);
            } else {
              this.writeTypeDef(variant_3.nameNode.get(), ctx, wr);
            }
            wr.out(" {", true);
            wr.indent(1);
            wr.newline();
            final RangerAppWriterContext subCtx_4 = variant_3.fnCtx.get();
            subCtx_4.is_function = true;
            this.WalkNode(variant_3.fnBody.get(), subCtx_4, wr);
            wr.newline();
            wr.indent(-1);
            wr.out("}", true);
          }
        }
      }
    }
    HashMap<String,Boolean> declaredGetter = new HashMap<String,Boolean>();
    for ( int i_18 = 0; i_18 < cl.get().variables.size(); i_18++) {
      RangerAppParamDesc p_1 = cl.get().variables.get(i_18);
      declaredGetter.put(p_1.name, true);
      wr.newline();
      wr.out("// getter for variable " + p_1.name, true);
      wr.out(("func (this *" + cl.get().name) + ") ", false);
      wr.out("Get_", false);
      wr.out(p_1.compiledName + "() ", false);
      if ( p_1.nameNode.get().hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_1.nameNode.get(), ctx, wr);
      }
      wr.out(" {", true);
      wr.indent(1);
      wr.out("return this." + p_1.compiledName, true);
      wr.indent(-1);
      wr.out("}", true);
      wr.newline();
      wr.out("// setter for variable " + p_1.name, true);
      wr.out(("func (this *" + cl.get().name) + ") ", false);
      wr.out("Set_", false);
      wr.out(p_1.compiledName + "( value ", false);
      if ( p_1.nameNode.get().hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_1.nameNode.get(), ctx, wr);
      }
      wr.out(") ", false);
      wr.out(" {", true);
      wr.indent(1);
      wr.out(("this." + p_1.compiledName) + " = value ", true);
      wr.indent(-1);
      wr.out("}", true);
    }
    if ( (cl.get().extends_classes.size()) > 0 ) {
      for ( int i_19 = 0; i_19 < cl.get().extends_classes.size(); i_19++) {
        String pName_3 = cl.get().extends_classes.get(i_19);
        final RangerAppClassDesc pC_3 = ctx.findClass(pName_3);
        wr.out("// inherited getters and setters from the parent class " + pName_3, true);
        for ( int i_20 = 0; i_20 < pC_3.variables.size(); i_20++) {
          RangerAppParamDesc p_2 = pC_3.variables.get(i_20);
          if ( declaredGetter.containsKey(p_2.name) ) {
            continue;
          }
          wr.newline();
          wr.out("// getter for variable " + p_2.name, true);
          wr.out(("func (this *" + cl.get().name) + ") ", false);
          wr.out("Get_", false);
          wr.out(p_2.compiledName + "() ", false);
          if ( p_2.nameNode.get().hasFlag("optional") ) {
            wr.out("*GoNullable", false);
          } else {
            this.writeTypeDef(p_2.nameNode.get(), ctx, wr);
          }
          wr.out(" {", true);
          wr.indent(1);
          wr.out("return this." + p_2.compiledName, true);
          wr.indent(-1);
          wr.out("}", true);
          wr.newline();
          wr.out("// getter for variable " + p_2.name, true);
          wr.out(("func (this *" + cl.get().name) + ") ", false);
          wr.out("Set_", false);
          wr.out(p_2.compiledName + "( value ", false);
          if ( p_2.nameNode.get().hasFlag("optional") ) {
            wr.out("*GoNullable", false);
          } else {
            this.writeTypeDef(p_2.nameNode.get(), ctx, wr);
          }
          wr.out(") ", false);
          wr.out(" {", true);
          wr.indent(1);
          wr.out(("this." + p_2.compiledName) + " = value ", true);
          wr.indent(-1);
          wr.out("}", true);
        }
      }
    }
    for ( int i_21 = 0; i_21 < cl.get().static_methods.size(); i_21++) {
      RangerAppFunctionDesc variant_4 = cl.get().static_methods.get(i_21);
      if ( variant_4.nameNode.get().hasFlag("main") && (variant_4.nameNode.get().code.get().filename.equals(ctx.getRootFile())) ) {
        wr.out("func main() {", true);
        wr.indent(1);
        wr.newline();
        final RangerAppWriterContext subCtx_5 = variant_4.fnCtx.get();
        subCtx_5.is_function = true;
        this.WalkNode(variant_4.fnBody.get(), subCtx_5, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
  }
}
