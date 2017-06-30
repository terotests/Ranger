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
        final String s_21 = this.EncodeString(node, ctx, wr);
        wr.out(("\"" + s_21) + "\"", false);
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
      final RangerAppClassDesc cc_6 = ctx.findClass(type_string);
      if ( cc_6.doesInherit() ) {
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
    int v_type_8 = node.value_type;
    String a_name_4 = node.array_type;
    if ( ((v_type_8 == 8) || (v_type_8 == 9)) || (v_type_8 == 0) ) {
      v_type_8 = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type_8 = node.eval_type;
      if ( (node.eval_array_type.length()) > 0 ) {
        a_name_4 = node.eval_array_type;
      }
    }
    switch (v_type_8 ) { 
      case 7 : 
        if ( ctx.isDefinedClass(a_name_4) ) {
          final RangerAppClassDesc cc_9 = ctx.findClass(a_name_4);
          if ( cc_9.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name_4, ctx), false);
            return;
          }
        }
        if ( ctx.isPrimitiveType(a_name_4) == false ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name_4, ctx) + "", false);
        break;
      case 6 : 
        if ( ctx.isDefinedClass(a_name_4) ) {
          final RangerAppClassDesc cc_15 = ctx.findClass(a_name_4);
          if ( cc_15.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name_4, ctx), false);
            return;
          }
        }
        if ( (write_raw_type == false) && (ctx.isPrimitiveType(a_name_4) == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name_4, ctx) + "", false);
        break;
      default: 
        break;
    }
  }
  
  public void writeTypeDef2( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    int v_type_11 = node.value_type;
    String t_name_3 = node.type_name;
    String a_name_7 = node.array_type;
    String k_name_3 = node.key_type;
    if ( ((v_type_11 == 8) || (v_type_11 == 9)) || (v_type_11 == 0) ) {
      v_type_11 = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type_11 = node.eval_type;
      if ( (node.eval_type_name.length()) > 0 ) {
        t_name_3 = node.eval_type_name;
      }
      if ( (node.eval_array_type.length()) > 0 ) {
        a_name_7 = node.eval_array_type;
      }
      if ( (node.eval_key_type.length()) > 0 ) {
        k_name_3 = node.eval_key_type;
      }
    }
    switch (v_type_11 ) { 
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
          wr.out(this.getObjectTypeString(a_name_7, ctx) + "", false);
        } else {
          wr.out(("map[" + this.getObjectTypeString(k_name_3, ctx)) + "]", false);
          if ( ctx.isDefinedClass(a_name_7) ) {
            final RangerAppClassDesc cc_13 = ctx.findClass(a_name_7);
            if ( cc_13.doesInherit() ) {
              wr.out("IFACE_" + this.getTypeString2(a_name_7, ctx), false);
              return;
            }
          }
          if ( (write_raw_type == false) && (ctx.isPrimitiveType(a_name_7) == false) ) {
            wr.out("*", false);
          }
          wr.out(this.getObjectTypeString(a_name_7, ctx) + "", false);
        }
        break;
      case 6 : 
        if ( false == write_raw_type ) {
          wr.out("[]", false);
        }
        if ( ctx.isDefinedClass(a_name_7) ) {
          final RangerAppClassDesc cc_19 = ctx.findClass(a_name_7);
          if ( cc_19.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name_7, ctx), false);
            return;
          }
        }
        if ( (write_raw_type == false) && (ctx.isPrimitiveType(a_name_7) == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name_7, ctx) + "", false);
        break;
      default: 
        if ( node.type_name.equals("void") ) {
          wr.out("()", false);
          return;
        }
        if ( ctx.isDefinedClass(t_name_3) ) {
          final RangerAppClassDesc cc_23 = ctx.findClass(t_name_3);
          if ( cc_23.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(t_name_3, ctx), false);
            return;
          }
        }
        if ( (write_raw_type == false) && (node.isPrimitiveType() == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getTypeString2(t_name_3, ctx), false);
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
        final String rootObjName_11 = node.ns.get(0);
        final String enumName_11 = node.ns.get(1);
        final Optional<RangerAppEnum> e_17 = ctx.getEnum(rootObjName_11);
        if ( e_17.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e_17.get().values.get(enumName_11))).get()), false);
          return;
        }
      }
    }
    boolean next_is_gs = false;
    /** unused:  final boolean last_was_setter = false   **/ ;
    boolean needs_par = false;
    final int ns_last = (node.ns.size()) - 1;
    if ( (node.nsp.size()) > 0 ) {
      boolean had_static_2 = false;
      for ( int i_136 = 0; i_136 < node.nsp.size(); i_136++) {
        RangerAppParamDesc p_37 = node.nsp.get(i_136);
        if ( next_is_gs ) {
          if ( p_37.isProperty() ) {
            wr.out(".Get_", false);
            needs_par = true;
          } else {
            needs_par = false;
          }
          next_is_gs = false;
        }
        if ( needs_par == false ) {
          if ( i_136 > 0 ) {
            if ( had_static_2 ) {
              wr.out("_static_", false);
            } else {
              wr.out(".", false);
            }
          }
        }
        if ( ctx.isDefinedClass(p_37.nameNode.get().type_name) ) {
          final RangerAppClassDesc c_8 = ctx.findClass(p_37.nameNode.get().type_name);
          if ( c_8.doesInherit() ) {
            next_is_gs = true;
          }
        }
        if ( i_136 == 0 ) {
          final String part_11 = node.ns.get(0);
          if ( part_11.equals("this") ) {
            wr.out(thisName, false);
            continue;
          }
          if ( (!part_11.equals(thisName)) && ctx.isMemberVariable(part_11) ) {
            final Optional<RangerAppClassDesc> cc_19 = ctx.getCurrentClass();
            final RangerAppClassDesc currC_8 = cc_19.get();
            final Optional<RangerAppParamDesc> up = currC_8.findVariable(part_11);
            if ( up.isPresent() ) {
              /** unused:  final RangerAppParamDesc p3 = up.get()   **/ ;
              wr.out(thisName + ".", false);
            }
          }
        }
        if ( (p_37.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_37.compiledName), false);
        } else {
          if ( (p_37.name.length()) > 0 ) {
            wr.out(this.adjustType(p_37.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_136))), false);
          }
        }
        if ( needs_par ) {
          wr.out("()", false);
          needs_par = false;
        }
        if ( p_37.nameNode.get().hasFlag("optional") && (i_136 != ns_last) ) {
          wr.out(".value.(", false);
          this.writeTypeDef(p_37.nameNode.get(), ctx, wr);
          wr.out(")", false);
        }
        if ( p_37.isClass() ) {
          had_static_2 = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final String part_16 = node.ns.get(0);
      if ( (!part_16.equals(thisName)) && ctx.isMemberVariable(part_16) ) {
        final Optional<RangerAppClassDesc> cc_23 = ctx.getCurrentClass();
        final RangerAppClassDesc currC_13 = cc_23.get();
        final Optional<RangerAppParamDesc> up_6 = currC_13.findVariable(part_16);
        if ( up_6.isPresent() ) {
          /** unused:  final RangerAppParamDesc p3_6 = up_6.get()   **/ ;
          wr.out(thisName + ".", false);
        }
      }
      final Optional<RangerAppParamDesc> p_42 = node.paramDesc;
      wr.out(p_42.get().compiledName, false);
      return;
    }
    boolean b_was_static = false;
    for ( int i_141 = 0; i_141 < node.ns.size(); i_141++) {
      String part_19 = node.ns.get(i_141);
      if ( i_141 > 0 ) {
        if ( (i_141 == 1) && b_was_static ) {
          wr.out("_static_", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_141 == 0 ) {
        if ( part_19.equals("this") ) {
          wr.out(thisName, false);
          continue;
        }
        if ( ctx.hasClass(part_19) ) {
          b_was_static = true;
        }
        if ( (!part_19.equals("this")) && ctx.isMemberVariable(part_19) ) {
          final Optional<RangerAppClassDesc> cc_26 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_16 = cc_26.get();
          final Optional<RangerAppParamDesc> up_9 = currC_16.findVariable(part_19);
          if ( up_9.isPresent() ) {
            /** unused:  final RangerAppParamDesc p3_9 = up_9.get()   **/ ;
            wr.out(thisName + ".", false);
          }
        }
      }
      wr.out(this.adjustType(part_19), false);
    }
  }
  
  public void WriteSetterVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.vref.equals("this") ) {
      wr.out(thisName, false);
      return;
    }
    if ( node.eval_type == 11 ) {
      final String rootObjName_14 = node.ns.get(0);
      final String enumName_14 = node.ns.get(1);
      final Optional<RangerAppEnum> e_20 = ctx.getEnum(rootObjName_14);
      if ( e_20.isPresent() ) {
        wr.out("" + ((Optional.ofNullable(e_20.get().values.get(enumName_14))).get()), false);
        return;
      }
    }
    boolean next_is_gs_4 = false;
    /** unused:  final boolean last_was_setter_4 = false   **/ ;
    boolean needs_par_4 = false;
    final int ns_len = (node.ns.size()) - 1;
    if ( (node.nsp.size()) > 0 ) {
      boolean had_static_5 = false;
      for ( int i_141 = 0; i_141 < node.nsp.size(); i_141++) {
        RangerAppParamDesc p_42 = node.nsp.get(i_141);
        if ( next_is_gs_4 ) {
          if ( p_42.isProperty() ) {
            wr.out(".Get_", false);
            needs_par_4 = true;
          } else {
            needs_par_4 = false;
          }
          next_is_gs_4 = false;
        }
        if ( needs_par_4 == false ) {
          if ( i_141 > 0 ) {
            if ( had_static_5 ) {
              wr.out("_static_", false);
            } else {
              wr.out(".", false);
            }
          }
        }
        if ( ctx.isDefinedClass(p_42.nameNode.get().type_name) ) {
          final RangerAppClassDesc c_11 = ctx.findClass(p_42.nameNode.get().type_name);
          if ( c_11.doesInherit() ) {
            next_is_gs_4 = true;
          }
        }
        if ( i_141 == 0 ) {
          final String part_18 = node.ns.get(0);
          if ( part_18.equals("this") ) {
            wr.out(thisName, false);
            continue;
          }
          if ( (!part_18.equals(thisName)) && ctx.isMemberVariable(part_18) ) {
            final Optional<RangerAppClassDesc> cc_25 = ctx.getCurrentClass();
            final RangerAppClassDesc currC_15 = cc_25.get();
            final Optional<RangerAppParamDesc> up_8 = currC_15.findVariable(part_18);
            if ( up_8.isPresent() ) {
              /** unused:  final RangerAppParamDesc p3_8 = up_8.get()   **/ ;
              wr.out(thisName + ".", false);
            }
          }
        }
        if ( (p_42.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_42.compiledName), false);
        } else {
          if ( (p_42.name.length()) > 0 ) {
            wr.out(this.adjustType(p_42.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_141))), false);
          }
        }
        if ( needs_par_4 ) {
          wr.out("()", false);
          needs_par_4 = false;
        }
        if ( i_141 < ns_len ) {
          if ( p_42.nameNode.get().hasFlag("optional") ) {
            wr.out(".value.(", false);
            this.writeTypeDef(p_42.nameNode.get(), ctx, wr);
            wr.out(")", false);
          }
        }
        if ( p_42.isClass() ) {
          had_static_5 = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final String part_22 = node.ns.get(0);
      if ( (!part_22.equals(thisName)) && ctx.isMemberVariable(part_22) ) {
        final Optional<RangerAppClassDesc> cc_29 = ctx.getCurrentClass();
        final RangerAppClassDesc currC_19 = cc_29.get();
        final Optional<RangerAppParamDesc> up_12 = currC_19.findVariable(part_22);
        if ( up_12.isPresent() ) {
          /** unused:  final RangerAppParamDesc p3_12 = up_12.get()   **/ ;
          wr.out(thisName + ".", false);
        }
      }
      final Optional<RangerAppParamDesc> p_46 = node.paramDesc;
      wr.out(p_46.get().compiledName, false);
      return;
    }
    boolean b_was_static_4 = false;
    for ( int i_145 = 0; i_145 < node.ns.size(); i_145++) {
      String part_25 = node.ns.get(i_145);
      if ( i_145 > 0 ) {
        if ( (i_145 == 1) && b_was_static_4 ) {
          wr.out("_static_", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_145 == 0 ) {
        if ( part_25.equals("this") ) {
          wr.out(thisName, false);
          continue;
        }
        if ( ctx.hasClass(part_25) ) {
          b_was_static_4 = true;
        }
        if ( (!part_25.equals("this")) && ctx.isMemberVariable(part_25) ) {
          final Optional<RangerAppClassDesc> cc_32 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_22 = cc_32.get();
          final Optional<RangerAppParamDesc> up_15 = currC_22.findVariable(part_25);
          if ( up_15.isPresent() ) {
            /** unused:  final RangerAppParamDesc p3_15 = up_15.get()   **/ ;
            wr.out(thisName + ".", false);
          }
        }
      }
      wr.out(this.adjustType(part_25), false);
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
    final int len_5 = (left.ns.size()) - 1;
    /** unused:  final String last_part = left.ns.get(len_5)   **/ ;
    boolean next_is_gs_6 = false;
    boolean last_was_setter_6 = false;
    boolean needs_par_6 = false;
    boolean b_was_static_6 = false;
    for ( int i_145 = 0; i_145 < left.ns.size(); i_145++) {
      String part_24 = left.ns.get(i_145);
      if ( next_is_gs_6 ) {
        if ( i_145 == len_5 ) {
          wr.out(".Set_", false);
          last_was_setter_6 = true;
        } else {
          wr.out(".Get_", false);
          needs_par_6 = true;
          next_is_gs_6 = false;
          last_was_setter_6 = false;
        }
      }
      if ( (last_was_setter_6 == false) && (needs_par_6 == false) ) {
        if ( i_145 > 0 ) {
          if ( (i_145 == 1) && b_was_static_6 ) {
            wr.out("_static_", false);
          } else {
            wr.out(".", false);
          }
        }
      }
      if ( i_145 == 0 ) {
        if ( part_24.equals("this") ) {
          wr.out(thisName, false);
          continue;
        }
        if ( ctx.hasClass(part_24) ) {
          b_was_static_6 = true;
        }
        final RangerAppParamDesc partDef = ctx.getVariableDef(part_24);
        if ( partDef.nameNode.isPresent() ) {
          if ( ctx.isDefinedClass(partDef.nameNode.get().type_name) ) {
            final RangerAppClassDesc c_13 = ctx.findClass(partDef.nameNode.get().type_name);
            if ( c_13.doesInherit() ) {
              next_is_gs_6 = true;
            }
          }
        }
        if ( (!part_24.equals("this")) && ctx.isMemberVariable(part_24) ) {
          final Optional<RangerAppClassDesc> cc_31 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_21 = cc_31.get();
          final Optional<RangerAppParamDesc> up_14 = currC_21.findVariable(part_24);
          if ( up_14.isPresent() ) {
            /** unused:  final RangerAppParamDesc p3_14 = up_14.get()   **/ ;
            wr.out(thisName + ".", false);
          }
        }
      }
      if ( (left.nsp.size()) > 0 ) {
        final RangerAppParamDesc p_49 = left.nsp.get(i_145);
        wr.out(this.adjustType(p_49.compiledName), false);
      } else {
        if ( left.hasParamDesc ) {
          wr.out(left.paramDesc.get().compiledName, false);
        } else {
          wr.out(this.adjustType(part_24), false);
        }
      }
      if ( needs_par_6 ) {
        wr.out("()", false);
        needs_par_6 = false;
      }
      if ( (left.nsp.size()) >= (i_145 + 1) ) {
        final RangerAppParamDesc pp_6 = left.nsp.get(i_145);
        if ( pp_6.nameNode.get().hasFlag("optional") ) {
          wr.out(".value.(", false);
          this.writeTypeDef(pp_6.nameNode.get(), ctx, wr);
          wr.out(")", false);
        }
      }
    }
    if ( last_was_setter_6 ) {
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
      final CodeNode nn_19 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_48 = nn_19.paramDesc;
      wr.out(p_48.get().compiledName + " ", false);
      if ( p_48.get().nameNode.get().hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_48.get().nameNode.get(), ctx, wr);
      }
      if ( p_48.get().ref_cnt == 0 ) {
        wr.out(" /**  unused  **/ ", false);
      }
      wr.out("", true);
      if ( p_48.get().nameNode.get().hasFlag("optional") ) {
      }
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_22 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_50 = nn_22.paramDesc;
      boolean b_not_used = false;
      if ( (p_50.get().ref_cnt == 0) && (p_50.get().is_class_variable == false) ) {
        wr.out(("/** unused:  " + p_50.get().compiledName) + "*/", true);
        b_not_used = true;
        return;
      }
      final boolean map_or_hash = (nn_22.value_type == 6) || (nn_22.value_type == 7);
      if ( nn_22.hasFlag("optional") ) {
        wr.out(("var " + p_50.get().compiledName) + " *GoNullable = new(GoNullable); ", true);
        if ( (node.children.size()) > 2 ) {
          final CodeNode value_10 = node.children.get(2);
          if ( value_10.hasParamDesc ) {
            final Optional<CodeNode> pnn = value_10.paramDesc.get().nameNode;
            if ( pnn.get().hasFlag("optional") ) {
              wr.out(p_50.get().compiledName + ".value = ", false);
              ctx.setInExpr();
              final CodeNode value_24 = node.getThird();
              this.WalkNode(value_24, ctx, wr);
              ctx.unsetInExpr();
              wr.out(".value;", true);
              wr.out(p_50.get().compiledName + ".has_value = ", false);
              ctx.setInExpr();
              final CodeNode value_34 = node.getThird();
              this.WalkNode(value_34, ctx, wr);
              ctx.unsetInExpr();
              wr.out(".has_value;", true);
              return;
            } else {
              wr.out(p_50.get().compiledName + ".value = ", false);
              ctx.setInExpr();
              final CodeNode value_42 = node.getThird();
              this.WalkNode(value_42, ctx, wr);
              ctx.unsetInExpr();
              wr.out(";", true);
              wr.out(p_50.get().compiledName + ".has_value = true;", true);
              return;
            }
          } else {
            wr.out(p_50.get().compiledName + " = ", false);
            ctx.setInExpr();
            final CodeNode value_45 = node.getThird();
            this.WalkNode(value_45, ctx, wr);
            ctx.unsetInExpr();
            wr.out(";", true);
            return;
          }
        }
        return;
      } else {
        if ( ((p_50.get().set_cnt > 0) || p_50.get().is_class_variable) || map_or_hash ) {
          wr.out(("var " + p_50.get().compiledName) + " ", false);
        } else {
          wr.out(("var " + p_50.get().compiledName) + " ", false);
        }
      }
      this.writeTypeDef2(p_50.get().nameNode.get(), ctx, wr);
      if ( (node.children.size()) > 2 ) {
        final CodeNode value_33 = node.getThird();
        if ( value_33.expression && ((value_33.children.size()) > 1) ) {
          final CodeNode fc_33 = value_33.children.get(0);
          if ( fc_33.vref.equals("array_extract") ) {
            this.goExtractAssign(value_33, p_50.get(), ctx, wr);
            return;
          }
        }
        wr.out(" = ", false);
        ctx.setInExpr();
        this.WalkNode(value_33, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_22.value_type == 6 ) {
          wr.out(" = make(", false);
          this.writeTypeDef(p_50.get().nameNode.get(), ctx, wr);
          wr.out(", 0)", false);
        }
        if ( nn_22.value_type == 7 ) {
          wr.out(" = make(", false);
          this.writeTypeDef(p_50.get().nameNode.get(), ctx, wr);
          wr.out(")", false);
        }
      }
      wr.out(";", false);
      if ( (p_50.get().ref_cnt == 0) && (p_50.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_50.get().ref_cnt == 0) && (p_50.get().is_class_variable == false) ) {
        wr.out("   **/ ", true);
      } else {
        wr.newline();
      }
      if ( b_not_used == false ) {
        if ( nn_22.hasFlag("optional") ) {
          wr.addImport("errors");
        }
      }
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_147 = 0; i_147 < fnDesc.params.size(); i_147++) {
      RangerAppParamDesc arg_27 = fnDesc.params.get(i_147);
      if ( i_147 > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg_27.name + " ", false);
      if ( arg_27.nameNode.get().hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(arg_27.nameNode.get(), ctx, wr);
      }
    }
  }
  
  public void writeNewCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasNewOper ) {
      final Optional<RangerAppClassDesc> cl_15 = node.clDesc;
      /** unused:  final CodeNode fc_36 = node.getSecond()   **/ ;
      wr.out(("CreateNew_" + node.clDesc.get().name) + "(", false);
      final Optional<RangerAppFunctionDesc> constr_15 = cl_15.get().constructor_fn;
      final CodeNode givenArgs_10 = node.getThird();
      if ( constr_15.isPresent() ) {
        for ( int i_149 = 0; i_149 < constr_15.get().params.size(); i_149++) {
          RangerAppParamDesc arg_30 = constr_15.get().params.get(i_149);
          final CodeNode n_16 = givenArgs_10.children.get(i_149);
          if ( i_149 > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (arg_30.nameNode.isPresent()) ) {
            this.WalkNode(n_16, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  
  public void CustomOperator( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fc_38 = node.getFirst();
    final String cmd_3 = fc_38.vref;
    if ( ((cmd_3.equals("=")) || (cmd_3.equals("push"))) || (cmd_3.equals("removeLast")) ) {
      final CodeNode left_4 = node.getSecond();
      CodeNode right = left_4;
      if ( (cmd_3.equals("=")) || (cmd_3.equals("push")) ) {
        right = node.getThird();
      }
      wr.newline();
      boolean b_was_static_8 = false;
      if ( left_4.hasParamDesc ) {
        final int len_8 = (left_4.ns.size()) - 1;
        /** unused:  final String last_part_4 = left_4.ns.get(len_8)   **/ ;
        boolean next_is_gs_8 = false;
        boolean last_was_setter_8 = false;
        boolean needs_par_8 = false;
        for ( int i_151 = 0; i_151 < left_4.ns.size(); i_151++) {
          String part_26 = left_4.ns.get(i_151);
          if ( next_is_gs_8 ) {
            if ( i_151 == len_8 ) {
              wr.out(".Set_", false);
              last_was_setter_8 = true;
            } else {
              wr.out(".Get_", false);
              needs_par_8 = true;
              next_is_gs_8 = false;
              last_was_setter_8 = false;
            }
          }
          if ( (last_was_setter_8 == false) && (needs_par_8 == false) ) {
            if ( i_151 > 0 ) {
              if ( (i_151 == 1) && b_was_static_8 ) {
                wr.out("_static_", false);
              } else {
                wr.out(".", false);
              }
            }
          }
          if ( i_151 == 0 ) {
            if ( part_26.equals("this") ) {
              wr.out(thisName, false);
              continue;
            }
            if ( ctx.hasClass(part_26) ) {
              b_was_static_8 = true;
            }
            if ( (!part_26.equals("this")) && ctx.isMemberVariable(part_26) ) {
              final Optional<RangerAppClassDesc> cc_33 = ctx.getCurrentClass();
              final RangerAppClassDesc currC_23 = cc_33.get();
              final Optional<RangerAppParamDesc> up_16 = currC_23.findVariable(part_26);
              if ( up_16.isPresent() ) {
                /** unused:  final RangerAppParamDesc p3_16 = up_16.get()   **/ ;
                wr.out(thisName + ".", false);
              }
            }
          }
          RangerAppParamDesc partDef_4 = ctx.getVariableDef(part_26);
          if ( (left_4.nsp.size()) > i_151 ) {
            partDef_4 = left_4.nsp.get(i_151);
          }
          if ( partDef_4.nameNode.isPresent() ) {
            if ( ctx.isDefinedClass(partDef_4.nameNode.get().type_name) ) {
              final RangerAppClassDesc c_15 = ctx.findClass(partDef_4.nameNode.get().type_name);
              if ( c_15.doesInherit() ) {
                next_is_gs_8 = true;
              }
            }
          }
          if ( (left_4.nsp.size()) > 0 ) {
            final RangerAppParamDesc p_52 = left_4.nsp.get(i_151);
            wr.out(this.adjustType(p_52.compiledName), false);
          } else {
            if ( left_4.hasParamDesc ) {
              wr.out(left_4.paramDesc.get().compiledName, false);
            } else {
              wr.out(this.adjustType(part_26), false);
            }
          }
          if ( needs_par_8 ) {
            wr.out("()", false);
            needs_par_8 = false;
          }
          if ( (left_4.nsp.size()) >= (i_151 + 1) ) {
            final RangerAppParamDesc pp_9 = left_4.nsp.get(i_151);
            if ( pp_9.nameNode.get().hasFlag("optional") ) {
              wr.out(".value.(", false);
              this.writeTypeDef(pp_9.nameNode.get(), ctx, wr);
              wr.out(")", false);
            }
          }
        }
        if ( cmd_3.equals("removeLast") ) {
          if ( last_was_setter_8 ) {
            wr.out("(", false);
            ctx.setInExpr();
            this.WalkNode(left_4, ctx, wr);
            wr.out("[:len(", false);
            this.WalkNode(left_4, ctx, wr);
            wr.out(")-1]", false);
            ctx.unsetInExpr();
            wr.out("); ", true);
          } else {
            wr.out(" = ", false);
            ctx.setInExpr();
            this.WalkNode(left_4, ctx, wr);
            wr.out("[:len(", false);
            this.WalkNode(left_4, ctx, wr);
            wr.out(")-1]", false);
            ctx.unsetInExpr();
            wr.out("; ", true);
          }
          return;
        }
        if ( cmd_3.equals("push") ) {
          if ( last_was_setter_8 ) {
            wr.out("(", false);
            ctx.setInExpr();
            wr.out("append(", false);
            this.WalkNode(left_4, ctx, wr);
            wr.out(",", false);
            this.WalkNode(right, ctx, wr);
            ctx.unsetInExpr();
            wr.out(")); ", true);
          } else {
            wr.out(" = ", false);
            wr.out("append(", false);
            ctx.setInExpr();
            this.WalkNode(left_4, ctx, wr);
            wr.out(",", false);
            this.WalkNode(right, ctx, wr);
            ctx.unsetInExpr();
            wr.out("); ", true);
          }
          return;
        }
        if ( last_was_setter_8 ) {
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
      this.WriteSetterVRef(left_4, ctx, wr);
      wr.out(" = ", false);
      ctx.setInExpr();
      this.WalkNode(right, ctx, wr);
      ctx.unsetInExpr();
      wr.out("; /* custom */", true);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_18 = node.clDesc;
    if ( !cl_18.isPresent() ) {
      return;
    }
    final CodeWriter wr_10 = orig_wr;
    if ( did_write_nullable == false ) {
      wr_10.raw("\r\ntype GoNullable struct { \r\n  value interface{}\r\n  has_value bool\r\n}\r\n", true);
      wr_10.createTag("utilities");
      did_write_nullable = true;
    }
    HashMap<String,Boolean> declaredVariable_2 = new HashMap<String,Boolean>();
    wr_10.out(("type " + cl_18.get().name) + " struct { ", true);
    wr_10.indent(1);
    for ( int i_153 = 0; i_153 < cl_18.get().variables.size(); i_153++) {
      RangerAppParamDesc pvar_11 = cl_18.get().variables.get(i_153);
      this.writeStructField(pvar_11.node.get(), ctx, wr_10);
      declaredVariable_2.put(pvar_11.name, true);
    }
    if ( (cl_18.get().extends_classes.size()) > 0 ) {
      for ( int i_157 = 0; i_157 < cl_18.get().extends_classes.size(); i_157++) {
        String pName_5 = cl_18.get().extends_classes.get(i_157);
        final RangerAppClassDesc pC_2 = ctx.findClass(pName_5);
        wr_10.out("// inherited from parent class " + pName_5, true);
        for ( int i_166 = 0; i_166 < pC_2.variables.size(); i_166++) {
          RangerAppParamDesc pvar_16 = pC_2.variables.get(i_166);
          if ( declaredVariable_2.containsKey(pvar_16.name) ) {
            continue;
          }
          this.writeStructField(pvar_16.node.get(), ctx, wr_10);
        }
      }
    }
    wr_10.indent(-1);
    wr_10.out("}", true);
    wr_10.out(("type IFACE_" + cl_18.get().name) + " interface { ", true);
    wr_10.indent(1);
    for ( int i_163 = 0; i_163 < cl_18.get().variables.size(); i_163++) {
      RangerAppParamDesc p_54 = cl_18.get().variables.get(i_163);
      wr_10.out("Get_", false);
      wr_10.out(p_54.compiledName + "() ", false);
      if ( p_54.nameNode.get().hasFlag("optional") ) {
        wr_10.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_54.nameNode.get(), ctx, wr_10);
      }
      wr_10.out("", true);
      wr_10.out("Set_", false);
      wr_10.out(p_54.compiledName + "(value ", false);
      if ( p_54.nameNode.get().hasFlag("optional") ) {
        wr_10.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_54.nameNode.get(), ctx, wr_10);
      }
      wr_10.out(") ", true);
    }
    for ( int i_166 = 0; i_166 < cl_18.get().defined_variants.size(); i_166++) {
      String fnVar_9 = cl_18.get().defined_variants.get(i_166);
      final Optional<RangerAppMethodVariants> mVs_9 = Optional.ofNullable(cl_18.get().method_variants.get(fnVar_9));
      for ( int i_173 = 0; i_173 < mVs_9.get().variants.size(); i_173++) {
        RangerAppFunctionDesc variant_20 = mVs_9.get().variants.get(i_173);
        wr_10.out(variant_20.name + "(", false);
        this.writeArgsDef(variant_20, ctx, wr_10);
        wr_10.out(") ", false);
        if ( variant_20.nameNode.get().hasFlag("optional") ) {
          wr_10.out("*GoNullable", false);
        } else {
          this.writeTypeDef(variant_20.nameNode.get(), ctx, wr_10);
        }
        wr_10.out("", true);
      }
    }
    wr_10.indent(-1);
    wr_10.out("}", true);
    thisName = "me";
    wr_10.out("", true);
    wr_10.out(("func CreateNew_" + cl_18.get().name) + "(", false);
    if ( cl_18.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_18 = cl_18.get().constructor_fn;
      for ( int i_172 = 0; i_172 < constr_18.get().params.size(); i_172++) {
        RangerAppParamDesc arg_32 = constr_18.get().params.get(i_172);
        if ( i_172 > 0 ) {
          wr_10.out(", ", false);
        }
        wr_10.out(arg_32.name + " ", false);
        this.writeTypeDef(arg_32.nameNode.get(), ctx, wr_10);
      }
    }
    wr_10.out((") *" + cl_18.get().name) + " {", true);
    wr_10.indent(1);
    wr_10.newline();
    wr_10.out(("me := new(" + cl_18.get().name) + ")", true);
    for ( int i_175 = 0; i_175 < cl_18.get().variables.size(); i_175++) {
      RangerAppParamDesc pvar_19 = cl_18.get().variables.get(i_175);
      final CodeNode nn_24 = pvar_19.node.get();
      if ( (nn_24.children.size()) > 2 ) {
        final CodeNode valueNode_2 = nn_24.children.get(2);
        wr_10.out(("me." + pvar_19.compiledName) + " = ", false);
        this.WalkNode(valueNode_2, ctx, wr_10);
        wr_10.out("", true);
      } else {
        final Optional<CodeNode> pNameN = pvar_19.nameNode;
        if ( pNameN.get().value_type == 6 ) {
          wr_10.out(("me." + pvar_19.compiledName) + " = ", false);
          wr_10.out("make(", false);
          this.writeTypeDef(pvar_19.nameNode.get(), ctx, wr_10);
          wr_10.out(",0)", true);
        }
        if ( pNameN.get().value_type == 7 ) {
          wr_10.out(("me." + pvar_19.compiledName) + " = ", false);
          wr_10.out("make(", false);
          this.writeTypeDef(pvar_19.nameNode.get(), ctx, wr_10);
          wr_10.out(")", true);
        }
      }
    }
    for ( int i_178 = 0; i_178 < cl_18.get().variables.size(); i_178++) {
      RangerAppParamDesc pvar_22 = cl_18.get().variables.get(i_178);
      if ( pvar_22.nameNode.get().hasFlag("optional") ) {
        wr_10.out(("me." + pvar_22.compiledName) + " = new(GoNullable);", true);
      }
    }
    if ( (cl_18.get().extends_classes.size()) > 0 ) {
      for ( int i_181 = 0; i_181 < cl_18.get().extends_classes.size(); i_181++) {
        String pName_10 = cl_18.get().extends_classes.get(i_181);
        final RangerAppClassDesc pC_7 = ctx.findClass(pName_10);
        for ( int i_190 = 0; i_190 < pC_7.variables.size(); i_190++) {
          RangerAppParamDesc pvar_25 = pC_7.variables.get(i_190);
          final CodeNode nn_28 = pvar_25.node.get();
          if ( (nn_28.children.size()) > 2 ) {
            final CodeNode valueNode_7 = nn_28.children.get(2);
            wr_10.out(("me." + pvar_25.compiledName) + " = ", false);
            this.WalkNode(valueNode_7, ctx, wr_10);
            wr_10.out("", true);
          } else {
            final CodeNode pNameN_6 = pvar_25.nameNode.get();
            if ( pNameN_6.value_type == 6 ) {
              wr_10.out(("me." + pvar_25.compiledName) + " = ", false);
              wr_10.out("make(", false);
              this.writeTypeDef(pvar_25.nameNode.get(), ctx, wr_10);
              wr_10.out(",0)", true);
            }
            if ( pNameN_6.value_type == 7 ) {
              wr_10.out(("me." + pvar_25.compiledName) + " = ", false);
              wr_10.out("make(", false);
              this.writeTypeDef(pvar_25.nameNode.get(), ctx, wr_10);
              wr_10.out(")", true);
            }
          }
        }
        for ( int i_195 = 0; i_195 < pC_7.variables.size(); i_195++) {
          RangerAppParamDesc pvar_32 = pC_7.variables.get(i_195);
          if ( pvar_32.nameNode.get().hasFlag("optional") ) {
            wr_10.out(("me." + pvar_32.compiledName) + " = new(GoNullable);", true);
          }
        }
        if ( pC_7.has_constructor ) {
          final Optional<RangerAppFunctionDesc> constr_22 = pC_7.constructor_fn;
          final RangerAppWriterContext subCtx_37 = constr_22.get().fnCtx.get();
          subCtx_37.is_function = true;
          this.WalkNode(constr_22.get().fnBody.get(), subCtx_37, wr_10);
        }
      }
    }
    if ( cl_18.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_25 = cl_18.get().constructor_fn;
      final RangerAppWriterContext subCtx_42 = constr_25.get().fnCtx.get();
      subCtx_42.is_function = true;
      this.WalkNode(constr_25.get().fnBody.get(), subCtx_42, wr_10);
    }
    wr_10.out("return me;", true);
    wr_10.indent(-1);
    wr_10.out("}", true);
    thisName = "this";
    for ( int i_190 = 0; i_190 < cl_18.get().static_methods.size(); i_190++) {
      RangerAppFunctionDesc variant_25 = cl_18.get().static_methods.get(i_190);
      if ( variant_25.nameNode.get().hasFlag("main") ) {
        continue;
      }
      wr_10.newline();
      wr_10.out(((("func " + cl_18.get().name) + "_static_") + variant_25.name) + "(", false);
      this.writeArgsDef(variant_25, ctx, wr_10);
      wr_10.out(") ", false);
      this.writeTypeDef(variant_25.nameNode.get(), ctx, wr_10);
      wr_10.out(" {", true);
      wr_10.indent(1);
      wr_10.newline();
      final RangerAppWriterContext subCtx_45 = variant_25.fnCtx.get();
      subCtx_45.is_function = true;
      this.WalkNode(variant_25.fnBody.get(), subCtx_45, wr_10);
      wr_10.newline();
      wr_10.indent(-1);
      wr_10.out("}", true);
    }
    HashMap<String,Boolean> declaredFn = new HashMap<String,Boolean>();
    for ( int i_193 = 0; i_193 < cl_18.get().defined_variants.size(); i_193++) {
      String fnVar_14 = cl_18.get().defined_variants.get(i_193);
      final Optional<RangerAppMethodVariants> mVs_14 = Optional.ofNullable(cl_18.get().method_variants.get(fnVar_14));
      for ( int i_200 = 0; i_200 < mVs_14.get().variants.size(); i_200++) {
        RangerAppFunctionDesc variant_28 = mVs_14.get().variants.get(i_200);
        declaredFn.put(variant_28.name, true);
        wr_10.out(((("func (this *" + cl_18.get().name) + ") ") + variant_28.name) + " (", false);
        this.writeArgsDef(variant_28, ctx, wr_10);
        wr_10.out(") ", false);
        if ( variant_28.nameNode.get().hasFlag("optional") ) {
          wr_10.out("*GoNullable", false);
        } else {
          this.writeTypeDef(variant_28.nameNode.get(), ctx, wr_10);
        }
        wr_10.out(" {", true);
        wr_10.indent(1);
        wr_10.newline();
        final RangerAppWriterContext subCtx_48 = variant_28.fnCtx.get();
        subCtx_48.is_function = true;
        this.WalkNode(variant_28.fnBody.get(), subCtx_48, wr_10);
        wr_10.newline();
        wr_10.indent(-1);
        wr_10.out("}", true);
      }
    }
    if ( (cl_18.get().extends_classes.size()) > 0 ) {
      for ( int i_199 = 0; i_199 < cl_18.get().extends_classes.size(); i_199++) {
        String pName_13 = cl_18.get().extends_classes.get(i_199);
        final RangerAppClassDesc pC_10 = ctx.findClass(pName_13);
        wr_10.out("// inherited methods from parent class " + pName_13, true);
        for ( int i_208 = 0; i_208 < pC_10.defined_variants.size(); i_208++) {
          String fnVar_17 = pC_10.defined_variants.get(i_208);
          final Optional<RangerAppMethodVariants> mVs_17 = Optional.ofNullable(pC_10.method_variants.get(fnVar_17));
          for ( int i_216 = 0; i_216 < mVs_17.get().variants.size(); i_216++) {
            RangerAppFunctionDesc variant_31 = mVs_17.get().variants.get(i_216);
            if ( declaredFn.containsKey(variant_31.name) ) {
              continue;
            }
            wr_10.out(((("func (this *" + cl_18.get().name) + ") ") + variant_31.name) + " (", false);
            this.writeArgsDef(variant_31, ctx, wr_10);
            wr_10.out(") ", false);
            if ( variant_31.nameNode.get().hasFlag("optional") ) {
              wr_10.out("*GoNullable", false);
            } else {
              this.writeTypeDef(variant_31.nameNode.get(), ctx, wr_10);
            }
            wr_10.out(" {", true);
            wr_10.indent(1);
            wr_10.newline();
            final RangerAppWriterContext subCtx_51 = variant_31.fnCtx.get();
            subCtx_51.is_function = true;
            this.WalkNode(variant_31.fnBody.get(), subCtx_51, wr_10);
            wr_10.newline();
            wr_10.indent(-1);
            wr_10.out("}", true);
          }
        }
      }
    }
    HashMap<String,Boolean> declaredGetter = new HashMap<String,Boolean>();
    for ( int i_208 = 0; i_208 < cl_18.get().variables.size(); i_208++) {
      RangerAppParamDesc p_58 = cl_18.get().variables.get(i_208);
      declaredGetter.put(p_58.name, true);
      wr_10.newline();
      wr_10.out("// getter for variable " + p_58.name, true);
      wr_10.out(("func (this *" + cl_18.get().name) + ") ", false);
      wr_10.out("Get_", false);
      wr_10.out(p_58.compiledName + "() ", false);
      if ( p_58.nameNode.get().hasFlag("optional") ) {
        wr_10.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_58.nameNode.get(), ctx, wr_10);
      }
      wr_10.out(" {", true);
      wr_10.indent(1);
      wr_10.out("return this." + p_58.compiledName, true);
      wr_10.indent(-1);
      wr_10.out("}", true);
      wr_10.newline();
      wr_10.out("// setter for variable " + p_58.name, true);
      wr_10.out(("func (this *" + cl_18.get().name) + ") ", false);
      wr_10.out("Set_", false);
      wr_10.out(p_58.compiledName + "( value ", false);
      if ( p_58.nameNode.get().hasFlag("optional") ) {
        wr_10.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_58.nameNode.get(), ctx, wr_10);
      }
      wr_10.out(") ", false);
      wr_10.out(" {", true);
      wr_10.indent(1);
      wr_10.out(("this." + p_58.compiledName) + " = value ", true);
      wr_10.indent(-1);
      wr_10.out("}", true);
    }
    if ( (cl_18.get().extends_classes.size()) > 0 ) {
      for ( int i_211 = 0; i_211 < cl_18.get().extends_classes.size(); i_211++) {
        String pName_16 = cl_18.get().extends_classes.get(i_211);
        final RangerAppClassDesc pC_13 = ctx.findClass(pName_16);
        wr_10.out("// inherited getters and setters from the parent class " + pName_16, true);
        for ( int i_220 = 0; i_220 < pC_13.variables.size(); i_220++) {
          RangerAppParamDesc p_61 = pC_13.variables.get(i_220);
          if ( declaredGetter.containsKey(p_61.name) ) {
            continue;
          }
          wr_10.newline();
          wr_10.out("// getter for variable " + p_61.name, true);
          wr_10.out(("func (this *" + cl_18.get().name) + ") ", false);
          wr_10.out("Get_", false);
          wr_10.out(p_61.compiledName + "() ", false);
          if ( p_61.nameNode.get().hasFlag("optional") ) {
            wr_10.out("*GoNullable", false);
          } else {
            this.writeTypeDef(p_61.nameNode.get(), ctx, wr_10);
          }
          wr_10.out(" {", true);
          wr_10.indent(1);
          wr_10.out("return this." + p_61.compiledName, true);
          wr_10.indent(-1);
          wr_10.out("}", true);
          wr_10.newline();
          wr_10.out("// getter for variable " + p_61.name, true);
          wr_10.out(("func (this *" + cl_18.get().name) + ") ", false);
          wr_10.out("Set_", false);
          wr_10.out(p_61.compiledName + "( value ", false);
          if ( p_61.nameNode.get().hasFlag("optional") ) {
            wr_10.out("*GoNullable", false);
          } else {
            this.writeTypeDef(p_61.nameNode.get(), ctx, wr_10);
          }
          wr_10.out(") ", false);
          wr_10.out(" {", true);
          wr_10.indent(1);
          wr_10.out(("this." + p_61.compiledName) + " = value ", true);
          wr_10.indent(-1);
          wr_10.out("}", true);
        }
      }
    }
    for ( int i_217 = 0; i_217 < cl_18.get().static_methods.size(); i_217++) {
      RangerAppFunctionDesc variant_34 = cl_18.get().static_methods.get(i_217);
      if ( variant_34.nameNode.get().hasFlag("main") ) {
        wr_10.out("func main() {", true);
        wr_10.indent(1);
        wr_10.newline();
        final RangerAppWriterContext subCtx_54 = variant_34.fnCtx.get();
        subCtx_54.is_function = true;
        this.WalkNode(variant_34.fnBody.get(), subCtx_54, wr_10);
        wr_10.newline();
        wr_10.indent(-1);
        wr_10.out("}", true);
      }
    }
  }
}
