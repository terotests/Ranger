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
        final String s_20 = this.EncodeString(node, ctx, wr);
        wr.out(("\"" + s_20) + "\"", false);
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
      final RangerAppClassDesc cc_5 = ctx.findClass(type_string);
      if ( cc_5.doesInherit() ) {
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
    int v_type_7 = node.value_type;
    String a_name_3 = node.array_type;
    if ( ((v_type_7 == 8) || (v_type_7 == 9)) || (v_type_7 == 0) ) {
      v_type_7 = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type_7 = node.eval_type;
      if ( (node.eval_array_type.length()) > 0 ) {
        a_name_3 = node.eval_array_type;
      }
    }
    switch (v_type_7 ) { 
      case 7 : 
        if ( ctx.isDefinedClass(a_name_3) ) {
          final RangerAppClassDesc cc_8 = ctx.findClass(a_name_3);
          if ( cc_8.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name_3, ctx), false);
            return;
          }
        }
        if ( ctx.isPrimitiveType(a_name_3) == false ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name_3, ctx) + "", false);
        break;
      case 6 : 
        if ( ctx.isDefinedClass(a_name_3) ) {
          final RangerAppClassDesc cc_14 = ctx.findClass(a_name_3);
          if ( cc_14.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name_3, ctx), false);
            return;
          }
        }
        if ( (write_raw_type == false) && (ctx.isPrimitiveType(a_name_3) == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name_3, ctx) + "", false);
        break;
      default: 
        break;
    }
  }
  
  public void writeTypeDef2( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    int v_type_10 = node.value_type;
    String t_name_2 = node.type_name;
    String a_name_6 = node.array_type;
    String k_name_2 = node.key_type;
    if ( ((v_type_10 == 8) || (v_type_10 == 9)) || (v_type_10 == 0) ) {
      v_type_10 = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type_10 = node.eval_type;
      if ( (node.eval_type_name.length()) > 0 ) {
        t_name_2 = node.eval_type_name;
      }
      if ( (node.eval_array_type.length()) > 0 ) {
        a_name_6 = node.eval_array_type;
      }
      if ( (node.eval_key_type.length()) > 0 ) {
        k_name_2 = node.eval_key_type;
      }
    }
    switch (v_type_10 ) { 
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
          wr.out(this.getObjectTypeString(a_name_6, ctx) + "", false);
        } else {
          wr.out(("map[" + this.getObjectTypeString(k_name_2, ctx)) + "]", false);
          if ( ctx.isDefinedClass(a_name_6) ) {
            final RangerAppClassDesc cc_12 = ctx.findClass(a_name_6);
            if ( cc_12.doesInherit() ) {
              wr.out("IFACE_" + this.getTypeString2(a_name_6, ctx), false);
              return;
            }
          }
          if ( (write_raw_type == false) && (ctx.isPrimitiveType(a_name_6) == false) ) {
            wr.out("*", false);
          }
          wr.out(this.getObjectTypeString(a_name_6, ctx) + "", false);
        }
        break;
      case 6 : 
        if ( false == write_raw_type ) {
          wr.out("[]", false);
        }
        if ( ctx.isDefinedClass(a_name_6) ) {
          final RangerAppClassDesc cc_18 = ctx.findClass(a_name_6);
          if ( cc_18.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(a_name_6, ctx), false);
            return;
          }
        }
        if ( (write_raw_type == false) && (ctx.isPrimitiveType(a_name_6) == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getObjectTypeString(a_name_6, ctx) + "", false);
        break;
      default: 
        if ( node.type_name.equals("void") ) {
          wr.out("()", false);
          return;
        }
        if ( ctx.isDefinedClass(t_name_2) ) {
          final RangerAppClassDesc cc_22 = ctx.findClass(t_name_2);
          if ( cc_22.doesInherit() ) {
            wr.out("IFACE_" + this.getTypeString2(t_name_2, ctx), false);
            return;
          }
        }
        if ( (write_raw_type == false) && (node.isPrimitiveType() == false) ) {
          wr.out("*", false);
        }
        wr.out(this.getTypeString2(t_name_2, ctx), false);
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
        final String rootObjName_10 = node.ns.get(0);
        final String enumName_10 = node.ns.get(1);
        final Optional<RangerAppEnum> e_16 = ctx.getEnum(rootObjName_10);
        if ( e_16.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e_16.get().values.get(enumName_10))).get()), false);
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
      for ( int i_120 = 0; i_120 < node.nsp.size(); i_120++) {
        RangerAppParamDesc p_33 = node.nsp.get(i_120);
        if ( next_is_gs ) {
          if ( p_33.isProperty() ) {
            wr.out(".Get_", false);
            needs_par = true;
          } else {
            needs_par = false;
          }
          next_is_gs = false;
        }
        if ( needs_par == false ) {
          if ( i_120 > 0 ) {
            if ( had_static ) {
              wr.out("_static_", false);
            } else {
              wr.out(".", false);
            }
          }
        }
        if ( ctx.isDefinedClass(p_33.nameNode.get().type_name) ) {
          final RangerAppClassDesc c_8 = ctx.findClass(p_33.nameNode.get().type_name);
          if ( c_8.doesInherit() ) {
            next_is_gs = true;
          }
        }
        if ( i_120 == 0 ) {
          final String part_9 = node.ns.get(0);
          if ( part_9.equals("this") ) {
            wr.out(thisName, false);
            continue;
          }
          if ( (!part_9.equals(thisName)) && ctx.isMemberVariable(part_9) ) {
            final Optional<RangerAppClassDesc> cc_18 = ctx.getCurrentClass();
            final RangerAppClassDesc currC_8 = cc_18.get();
            final Optional<RangerAppParamDesc> up = currC_8.findVariable(part_9);
            if ( up.isPresent() ) {
              /** unused:  final RangerAppParamDesc p3 = up.get()   **/ ;
              wr.out(thisName + ".", false);
            }
          }
        }
        if ( (p_33.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_33.compiledName), false);
        } else {
          if ( (p_33.name.length()) > 0 ) {
            wr.out(this.adjustType(p_33.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_120))), false);
          }
        }
        if ( needs_par ) {
          wr.out("()", false);
          needs_par = false;
        }
        if ( p_33.nameNode.get().hasFlag("optional") && (i_120 != ns_last) ) {
          wr.out(".value.(", false);
          this.writeTypeDef(p_33.nameNode.get(), ctx, wr);
          wr.out(")", false);
        }
        if ( p_33.isClass() ) {
          had_static = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final String part_14 = node.ns.get(0);
      if ( (!part_14.equals(thisName)) && ctx.isMemberVariable(part_14) ) {
        final Optional<RangerAppClassDesc> cc_22 = ctx.getCurrentClass();
        final RangerAppClassDesc currC_13 = cc_22.get();
        final Optional<RangerAppParamDesc> up_6 = currC_13.findVariable(part_14);
        if ( up_6.isPresent() ) {
          /** unused:  final RangerAppParamDesc p3_6 = up_6.get()   **/ ;
          wr.out(thisName + ".", false);
        }
      }
      final Optional<RangerAppParamDesc> p_38 = node.paramDesc;
      wr.out(p_38.get().compiledName, false);
      return;
    }
    boolean b_was_static = false;
    for ( int i_125 = 0; i_125 < node.ns.size(); i_125++) {
      String part_17 = node.ns.get(i_125);
      if ( i_125 > 0 ) {
        if ( (i_125 == 1) && b_was_static ) {
          wr.out("_static_", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_125 == 0 ) {
        if ( part_17.equals("this") ) {
          wr.out(thisName, false);
          continue;
        }
        if ( ctx.hasClass(part_17) ) {
          b_was_static = true;
        }
        if ( (!part_17.equals("this")) && ctx.isMemberVariable(part_17) ) {
          final Optional<RangerAppClassDesc> cc_25 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_16 = cc_25.get();
          final Optional<RangerAppParamDesc> up_9 = currC_16.findVariable(part_17);
          if ( up_9.isPresent() ) {
            /** unused:  final RangerAppParamDesc p3_9 = up_9.get()   **/ ;
            wr.out(thisName + ".", false);
          }
        }
      }
      wr.out(this.adjustType(part_17), false);
    }
  }
  
  public void WriteSetterVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.vref.equals("this") ) {
      wr.out(thisName, false);
      return;
    }
    if ( node.eval_type == 11 ) {
      final String rootObjName_13 = node.ns.get(0);
      final String enumName_13 = node.ns.get(1);
      final Optional<RangerAppEnum> e_19 = ctx.getEnum(rootObjName_13);
      if ( e_19.isPresent() ) {
        wr.out("" + ((Optional.ofNullable(e_19.get().values.get(enumName_13))).get()), false);
        return;
      }
    }
    boolean next_is_gs_4 = false;
    /** unused:  final boolean last_was_setter_4 = false   **/ ;
    boolean needs_par_4 = false;
    final int ns_len = (node.ns.size()) - 1;
    if ( (node.nsp.size()) > 0 ) {
      boolean had_static_4 = false;
      for ( int i_125 = 0; i_125 < node.nsp.size(); i_125++) {
        RangerAppParamDesc p_38 = node.nsp.get(i_125);
        if ( next_is_gs_4 ) {
          if ( p_38.isProperty() ) {
            wr.out(".Get_", false);
            needs_par_4 = true;
          } else {
            needs_par_4 = false;
          }
          next_is_gs_4 = false;
        }
        if ( needs_par_4 == false ) {
          if ( i_125 > 0 ) {
            if ( had_static_4 ) {
              wr.out("_static_", false);
            } else {
              wr.out(".", false);
            }
          }
        }
        if ( ctx.isDefinedClass(p_38.nameNode.get().type_name) ) {
          final RangerAppClassDesc c_11 = ctx.findClass(p_38.nameNode.get().type_name);
          if ( c_11.doesInherit() ) {
            next_is_gs_4 = true;
          }
        }
        if ( i_125 == 0 ) {
          final String part_16 = node.ns.get(0);
          if ( part_16.equals("this") ) {
            wr.out(thisName, false);
            continue;
          }
          if ( (!part_16.equals(thisName)) && ctx.isMemberVariable(part_16) ) {
            final Optional<RangerAppClassDesc> cc_24 = ctx.getCurrentClass();
            final RangerAppClassDesc currC_15 = cc_24.get();
            final Optional<RangerAppParamDesc> up_8 = currC_15.findVariable(part_16);
            if ( up_8.isPresent() ) {
              /** unused:  final RangerAppParamDesc p3_8 = up_8.get()   **/ ;
              wr.out(thisName + ".", false);
            }
          }
        }
        if ( (p_38.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_38.compiledName), false);
        } else {
          if ( (p_38.name.length()) > 0 ) {
            wr.out(this.adjustType(p_38.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_125))), false);
          }
        }
        if ( needs_par_4 ) {
          wr.out("()", false);
          needs_par_4 = false;
        }
        if ( i_125 < ns_len ) {
          if ( p_38.nameNode.get().hasFlag("optional") ) {
            wr.out(".value.(", false);
            this.writeTypeDef(p_38.nameNode.get(), ctx, wr);
            wr.out(")", false);
          }
        }
        if ( p_38.isClass() ) {
          had_static_4 = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final String part_20 = node.ns.get(0);
      if ( (!part_20.equals(thisName)) && ctx.isMemberVariable(part_20) ) {
        final Optional<RangerAppClassDesc> cc_28 = ctx.getCurrentClass();
        final RangerAppClassDesc currC_19 = cc_28.get();
        final Optional<RangerAppParamDesc> up_12 = currC_19.findVariable(part_20);
        if ( up_12.isPresent() ) {
          /** unused:  final RangerAppParamDesc p3_12 = up_12.get()   **/ ;
          wr.out(thisName + ".", false);
        }
      }
      final Optional<RangerAppParamDesc> p_42 = node.paramDesc;
      wr.out(p_42.get().compiledName, false);
      return;
    }
    boolean b_was_static_4 = false;
    for ( int i_129 = 0; i_129 < node.ns.size(); i_129++) {
      String part_23 = node.ns.get(i_129);
      if ( i_129 > 0 ) {
        if ( (i_129 == 1) && b_was_static_4 ) {
          wr.out("_static_", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_129 == 0 ) {
        if ( part_23.equals("this") ) {
          wr.out(thisName, false);
          continue;
        }
        if ( ctx.hasClass(part_23) ) {
          b_was_static_4 = true;
        }
        if ( (!part_23.equals("this")) && ctx.isMemberVariable(part_23) ) {
          final Optional<RangerAppClassDesc> cc_31 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_22 = cc_31.get();
          final Optional<RangerAppParamDesc> up_15 = currC_22.findVariable(part_23);
          if ( up_15.isPresent() ) {
            /** unused:  final RangerAppParamDesc p3_15 = up_15.get()   **/ ;
            wr.out(thisName + ".", false);
          }
        }
      }
      wr.out(this.adjustType(part_23), false);
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
    for ( int i_129 = 0; i_129 < left.ns.size(); i_129++) {
      String part_22 = left.ns.get(i_129);
      if ( next_is_gs_6 ) {
        if ( i_129 == len_5 ) {
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
        if ( i_129 > 0 ) {
          if ( (i_129 == 1) && b_was_static_6 ) {
            wr.out("_static_", false);
          } else {
            wr.out(".", false);
          }
        }
      }
      if ( i_129 == 0 ) {
        if ( part_22.equals("this") ) {
          wr.out(thisName, false);
          continue;
        }
        if ( ctx.hasClass(part_22) ) {
          b_was_static_6 = true;
        }
        final RangerAppParamDesc partDef = ctx.getVariableDef(part_22);
        if ( partDef.nameNode.isPresent() ) {
          if ( ctx.isDefinedClass(partDef.nameNode.get().type_name) ) {
            final RangerAppClassDesc c_13 = ctx.findClass(partDef.nameNode.get().type_name);
            if ( c_13.doesInherit() ) {
              next_is_gs_6 = true;
            }
          }
        }
        if ( (!part_22.equals("this")) && ctx.isMemberVariable(part_22) ) {
          final Optional<RangerAppClassDesc> cc_30 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_21 = cc_30.get();
          final Optional<RangerAppParamDesc> up_14 = currC_21.findVariable(part_22);
          if ( up_14.isPresent() ) {
            /** unused:  final RangerAppParamDesc p3_14 = up_14.get()   **/ ;
            wr.out(thisName + ".", false);
          }
        }
      }
      if ( (left.nsp.size()) > 0 ) {
        final RangerAppParamDesc p_45 = left.nsp.get(i_129);
        wr.out(this.adjustType(p_45.compiledName), false);
      } else {
        if ( left.hasParamDesc ) {
          wr.out(left.paramDesc.get().compiledName, false);
        } else {
          wr.out(this.adjustType(part_22), false);
        }
      }
      if ( needs_par_6 ) {
        wr.out("()", false);
        needs_par_6 = false;
      }
      if ( (left.nsp.size()) >= (i_129 + 1) ) {
        final RangerAppParamDesc pp_6 = left.nsp.get(i_129);
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
      final CodeNode nn_16 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_44 = nn_16.paramDesc;
      wr.out(p_44.get().compiledName + " ", false);
      if ( p_44.get().nameNode.get().hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_44.get().nameNode.get(), ctx, wr);
      }
      if ( p_44.get().ref_cnt == 0 ) {
        wr.out(" /**  unused  **/ ", false);
      }
      wr.out("", true);
      if ( p_44.get().nameNode.get().hasFlag("optional") ) {
      }
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_19 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_46 = nn_19.paramDesc;
      boolean b_not_used = false;
      if ( (p_46.get().ref_cnt == 0) && (p_46.get().is_class_variable == false) ) {
        wr.out(("/** unused:  " + p_46.get().compiledName) + "*/", true);
        b_not_used = true;
        return;
      }
      final boolean map_or_hash = (nn_19.value_type == 6) || (nn_19.value_type == 7);
      if ( nn_19.hasFlag("optional") ) {
        wr.out(("var " + p_46.get().compiledName) + " *GoNullable = new(GoNullable); ", true);
        if ( (node.children.size()) > 2 ) {
          final CodeNode value_9 = node.children.get(2);
          if ( value_9.hasParamDesc ) {
            final Optional<CodeNode> pnn = value_9.paramDesc.get().nameNode;
            if ( pnn.get().hasFlag("optional") ) {
              wr.out(p_46.get().compiledName + ".value = ", false);
              ctx.setInExpr();
              final CodeNode value_23 = node.getThird();
              this.WalkNode(value_23, ctx, wr);
              ctx.unsetInExpr();
              wr.out(".value;", true);
              wr.out(p_46.get().compiledName + ".has_value = ", false);
              ctx.setInExpr();
              final CodeNode value_33 = node.getThird();
              this.WalkNode(value_33, ctx, wr);
              ctx.unsetInExpr();
              wr.out(".has_value;", true);
              return;
            } else {
              wr.out(p_46.get().compiledName + ".value = ", false);
              ctx.setInExpr();
              final CodeNode value_41 = node.getThird();
              this.WalkNode(value_41, ctx, wr);
              ctx.unsetInExpr();
              wr.out(";", true);
              wr.out(p_46.get().compiledName + ".has_value = true;", true);
              return;
            }
          } else {
            wr.out(p_46.get().compiledName + " = ", false);
            ctx.setInExpr();
            final CodeNode value_44 = node.getThird();
            this.WalkNode(value_44, ctx, wr);
            ctx.unsetInExpr();
            wr.out(";", true);
            return;
          }
        }
        return;
      } else {
        if ( ((p_46.get().set_cnt > 0) || p_46.get().is_class_variable) || map_or_hash ) {
          wr.out(("var " + p_46.get().compiledName) + " ", false);
        } else {
          wr.out(("var " + p_46.get().compiledName) + " ", false);
        }
      }
      this.writeTypeDef2(p_46.get().nameNode.get(), ctx, wr);
      if ( (node.children.size()) > 2 ) {
        final CodeNode value_32 = node.getThird();
        if ( value_32.expression && ((value_32.children.size()) > 1) ) {
          final CodeNode fc_30 = value_32.children.get(0);
          if ( fc_30.vref.equals("array_extract") ) {
            this.goExtractAssign(value_32, p_46.get(), ctx, wr);
            return;
          }
        }
        wr.out(" = ", false);
        ctx.setInExpr();
        this.WalkNode(value_32, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_19.value_type == 6 ) {
          wr.out(" = make(", false);
          this.writeTypeDef(p_46.get().nameNode.get(), ctx, wr);
          wr.out(", 0)", false);
        }
        if ( nn_19.value_type == 7 ) {
          wr.out(" = make(", false);
          this.writeTypeDef(p_46.get().nameNode.get(), ctx, wr);
          wr.out(")", false);
        }
      }
      wr.out(";", false);
      if ( (p_46.get().ref_cnt == 0) && (p_46.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_46.get().ref_cnt == 0) && (p_46.get().is_class_variable == false) ) {
        wr.out("   **/ ", true);
      } else {
        wr.newline();
      }
      if ( b_not_used == false ) {
        if ( nn_19.hasFlag("optional") ) {
          wr.addImport("errors");
        }
      }
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_131 = 0; i_131 < fnDesc.params.size(); i_131++) {
      RangerAppParamDesc arg_24 = fnDesc.params.get(i_131);
      if ( i_131 > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg_24.name + " ", false);
      if ( arg_24.nameNode.get().hasFlag("optional") ) {
        wr.out("*GoNullable", false);
      } else {
        this.writeTypeDef(arg_24.nameNode.get(), ctx, wr);
      }
    }
  }
  
  public void writeNewCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasNewOper ) {
      final Optional<RangerAppClassDesc> cl_12 = node.clDesc;
      /** unused:  final CodeNode fc_33 = node.getSecond()   **/ ;
      wr.out(("CreateNew_" + node.clDesc.get().name) + "(", false);
      final Optional<RangerAppFunctionDesc> constr_11 = cl_12.get().constructor_fn;
      final CodeNode givenArgs_8 = node.getThird();
      if ( constr_11.isPresent() ) {
        for ( int i_133 = 0; i_133 < constr_11.get().params.size(); i_133++) {
          RangerAppParamDesc arg_27 = constr_11.get().params.get(i_133);
          final CodeNode n_14 = givenArgs_8.children.get(i_133);
          if ( i_133 > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (arg_27.nameNode.isPresent()) ) {
            this.WalkNode(n_14, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  
  public void CustomOperator( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fc_35 = node.getFirst();
    final String cmd_3 = fc_35.vref;
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
        for ( int i_135 = 0; i_135 < left_4.ns.size(); i_135++) {
          String part_24 = left_4.ns.get(i_135);
          if ( next_is_gs_8 ) {
            if ( i_135 == len_8 ) {
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
            if ( i_135 > 0 ) {
              if ( (i_135 == 1) && b_was_static_8 ) {
                wr.out("_static_", false);
              } else {
                wr.out(".", false);
              }
            }
          }
          if ( i_135 == 0 ) {
            if ( part_24.equals("this") ) {
              wr.out(thisName, false);
              continue;
            }
            if ( ctx.hasClass(part_24) ) {
              b_was_static_8 = true;
            }
            if ( (!part_24.equals("this")) && ctx.isMemberVariable(part_24) ) {
              final Optional<RangerAppClassDesc> cc_32 = ctx.getCurrentClass();
              final RangerAppClassDesc currC_23 = cc_32.get();
              final Optional<RangerAppParamDesc> up_16 = currC_23.findVariable(part_24);
              if ( up_16.isPresent() ) {
                /** unused:  final RangerAppParamDesc p3_16 = up_16.get()   **/ ;
                wr.out(thisName + ".", false);
              }
            }
          }
          RangerAppParamDesc partDef_4 = ctx.getVariableDef(part_24);
          if ( (left_4.nsp.size()) > i_135 ) {
            partDef_4 = left_4.nsp.get(i_135);
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
            final RangerAppParamDesc p_48 = left_4.nsp.get(i_135);
            wr.out(this.adjustType(p_48.compiledName), false);
          } else {
            if ( left_4.hasParamDesc ) {
              wr.out(left_4.paramDesc.get().compiledName, false);
            } else {
              wr.out(this.adjustType(part_24), false);
            }
          }
          if ( needs_par_8 ) {
            wr.out("()", false);
            needs_par_8 = false;
          }
          if ( (left_4.nsp.size()) >= (i_135 + 1) ) {
            final RangerAppParamDesc pp_9 = left_4.nsp.get(i_135);
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
    final Optional<RangerAppClassDesc> cl_15 = node.clDesc;
    if ( !cl_15.isPresent() ) {
      return;
    }
    final CodeWriter wr_9 = orig_wr;
    if ( did_write_nullable == false ) {
      wr_9.raw("\r\ntype GoNullable struct { \r\n  value interface{}\r\n  has_value bool\r\n}\r\n", true);
      wr_9.createTag("utilities");
      did_write_nullable = true;
    }
    HashMap<String,Boolean> declaredVariable_2 = new HashMap<String,Boolean>();
    wr_9.out(("type " + cl_15.get().name) + " struct { ", true);
    wr_9.indent(1);
    for ( int i_137 = 0; i_137 < cl_15.get().variables.size(); i_137++) {
      RangerAppParamDesc pvar_9 = cl_15.get().variables.get(i_137);
      this.writeStructField(pvar_9.node.get(), ctx, wr_9);
      declaredVariable_2.put(pvar_9.name, true);
    }
    if ( (cl_15.get().extends_classes.size()) > 0 ) {
      for ( int i_141 = 0; i_141 < cl_15.get().extends_classes.size(); i_141++) {
        String pName_4 = cl_15.get().extends_classes.get(i_141);
        final RangerAppClassDesc pC_2 = ctx.findClass(pName_4);
        wr_9.out("// inherited from parent class " + pName_4, true);
        for ( int i_150 = 0; i_150 < pC_2.variables.size(); i_150++) {
          RangerAppParamDesc pvar_14 = pC_2.variables.get(i_150);
          if ( declaredVariable_2.containsKey(pvar_14.name) ) {
            continue;
          }
          this.writeStructField(pvar_14.node.get(), ctx, wr_9);
        }
      }
    }
    wr_9.indent(-1);
    wr_9.out("}", true);
    wr_9.out(("type IFACE_" + cl_15.get().name) + " interface { ", true);
    wr_9.indent(1);
    for ( int i_147 = 0; i_147 < cl_15.get().variables.size(); i_147++) {
      RangerAppParamDesc p_50 = cl_15.get().variables.get(i_147);
      wr_9.out("Get_", false);
      wr_9.out(p_50.compiledName + "() ", false);
      if ( p_50.nameNode.get().hasFlag("optional") ) {
        wr_9.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_50.nameNode.get(), ctx, wr_9);
      }
      wr_9.out("", true);
      wr_9.out("Set_", false);
      wr_9.out(p_50.compiledName + "(value ", false);
      if ( p_50.nameNode.get().hasFlag("optional") ) {
        wr_9.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_50.nameNode.get(), ctx, wr_9);
      }
      wr_9.out(") ", true);
    }
    for ( int i_150 = 0; i_150 < cl_15.get().defined_variants.size(); i_150++) {
      String fnVar_7 = cl_15.get().defined_variants.get(i_150);
      final Optional<RangerAppMethodVariants> mVs_7 = Optional.ofNullable(cl_15.get().method_variants.get(fnVar_7));
      for ( int i_157 = 0; i_157 < mVs_7.get().variants.size(); i_157++) {
        RangerAppFunctionDesc variant_15 = mVs_7.get().variants.get(i_157);
        wr_9.out(variant_15.name + "(", false);
        this.writeArgsDef(variant_15, ctx, wr_9);
        wr_9.out(") ", false);
        if ( variant_15.nameNode.get().hasFlag("optional") ) {
          wr_9.out("*GoNullable", false);
        } else {
          this.writeTypeDef(variant_15.nameNode.get(), ctx, wr_9);
        }
        wr_9.out("", true);
      }
    }
    wr_9.indent(-1);
    wr_9.out("}", true);
    thisName = "me";
    wr_9.out("", true);
    wr_9.out(("func CreateNew_" + cl_15.get().name) + "(", false);
    if ( cl_15.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_14 = cl_15.get().constructor_fn;
      for ( int i_156 = 0; i_156 < constr_14.get().params.size(); i_156++) {
        RangerAppParamDesc arg_29 = constr_14.get().params.get(i_156);
        if ( i_156 > 0 ) {
          wr_9.out(", ", false);
        }
        wr_9.out(arg_29.name + " ", false);
        this.writeTypeDef(arg_29.nameNode.get(), ctx, wr_9);
      }
    }
    wr_9.out((") *" + cl_15.get().name) + " {", true);
    wr_9.indent(1);
    wr_9.newline();
    wr_9.out(("me := new(" + cl_15.get().name) + ")", true);
    for ( int i_159 = 0; i_159 < cl_15.get().variables.size(); i_159++) {
      RangerAppParamDesc pvar_17 = cl_15.get().variables.get(i_159);
      final CodeNode nn_21 = pvar_17.node.get();
      if ( (nn_21.children.size()) > 2 ) {
        final CodeNode valueNode = nn_21.children.get(2);
        wr_9.out(("me." + pvar_17.compiledName) + " = ", false);
        this.WalkNode(valueNode, ctx, wr_9);
        wr_9.out("", true);
      } else {
        final Optional<CodeNode> pNameN = pvar_17.nameNode;
        if ( pNameN.get().value_type == 6 ) {
          wr_9.out(("me." + pvar_17.compiledName) + " = ", false);
          wr_9.out("make(", false);
          this.writeTypeDef(pvar_17.nameNode.get(), ctx, wr_9);
          wr_9.out(",0)", true);
        }
        if ( pNameN.get().value_type == 7 ) {
          wr_9.out(("me." + pvar_17.compiledName) + " = ", false);
          wr_9.out("make(", false);
          this.writeTypeDef(pvar_17.nameNode.get(), ctx, wr_9);
          wr_9.out(")", true);
        }
      }
    }
    for ( int i_162 = 0; i_162 < cl_15.get().variables.size(); i_162++) {
      RangerAppParamDesc pvar_20 = cl_15.get().variables.get(i_162);
      if ( pvar_20.nameNode.get().hasFlag("optional") ) {
        wr_9.out(("me." + pvar_20.compiledName) + " = new(GoNullable);", true);
      }
    }
    if ( (cl_15.get().extends_classes.size()) > 0 ) {
      for ( int i_165 = 0; i_165 < cl_15.get().extends_classes.size(); i_165++) {
        String pName_9 = cl_15.get().extends_classes.get(i_165);
        final RangerAppClassDesc pC_7 = ctx.findClass(pName_9);
        for ( int i_174 = 0; i_174 < pC_7.variables.size(); i_174++) {
          RangerAppParamDesc pvar_23 = pC_7.variables.get(i_174);
          final CodeNode nn_25 = pvar_23.node.get();
          if ( (nn_25.children.size()) > 2 ) {
            final CodeNode valueNode_6 = nn_25.children.get(2);
            wr_9.out(("me." + pvar_23.compiledName) + " = ", false);
            this.WalkNode(valueNode_6, ctx, wr_9);
            wr_9.out("", true);
          } else {
            final CodeNode pNameN_6 = pvar_23.nameNode.get();
            if ( pNameN_6.value_type == 6 ) {
              wr_9.out(("me." + pvar_23.compiledName) + " = ", false);
              wr_9.out("make(", false);
              this.writeTypeDef(pvar_23.nameNode.get(), ctx, wr_9);
              wr_9.out(",0)", true);
            }
            if ( pNameN_6.value_type == 7 ) {
              wr_9.out(("me." + pvar_23.compiledName) + " = ", false);
              wr_9.out("make(", false);
              this.writeTypeDef(pvar_23.nameNode.get(), ctx, wr_9);
              wr_9.out(")", true);
            }
          }
        }
        for ( int i_179 = 0; i_179 < pC_7.variables.size(); i_179++) {
          RangerAppParamDesc pvar_30 = pC_7.variables.get(i_179);
          if ( pvar_30.nameNode.get().hasFlag("optional") ) {
            wr_9.out(("me." + pvar_30.compiledName) + " = new(GoNullable);", true);
          }
        }
        if ( pC_7.has_constructor ) {
          final Optional<RangerAppFunctionDesc> constr_18 = pC_7.constructor_fn;
          final RangerAppWriterContext subCtx_33 = constr_18.get().fnCtx.get();
          subCtx_33.is_function = true;
          this.WalkNode(constr_18.get().fnBody.get(), subCtx_33, wr_9);
        }
      }
    }
    if ( cl_15.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_21 = cl_15.get().constructor_fn;
      final RangerAppWriterContext subCtx_38 = constr_21.get().fnCtx.get();
      subCtx_38.is_function = true;
      this.WalkNode(constr_21.get().fnBody.get(), subCtx_38, wr_9);
    }
    wr_9.out("return me;", true);
    wr_9.indent(-1);
    wr_9.out("}", true);
    thisName = "this";
    for ( int i_174 = 0; i_174 < cl_15.get().static_methods.size(); i_174++) {
      RangerAppFunctionDesc variant_20 = cl_15.get().static_methods.get(i_174);
      if ( variant_20.nameNode.get().hasFlag("main") ) {
        continue;
      }
      wr_9.newline();
      wr_9.out(((("func " + cl_15.get().name) + "_static_") + variant_20.name) + "(", false);
      this.writeArgsDef(variant_20, ctx, wr_9);
      wr_9.out(") ", false);
      this.writeTypeDef(variant_20.nameNode.get(), ctx, wr_9);
      wr_9.out(" {", true);
      wr_9.indent(1);
      wr_9.newline();
      final RangerAppWriterContext subCtx_41 = variant_20.fnCtx.get();
      subCtx_41.is_function = true;
      this.WalkNode(variant_20.fnBody.get(), subCtx_41, wr_9);
      wr_9.newline();
      wr_9.indent(-1);
      wr_9.out("}", true);
    }
    HashMap<String,Boolean> declaredFn = new HashMap<String,Boolean>();
    for ( int i_177 = 0; i_177 < cl_15.get().defined_variants.size(); i_177++) {
      String fnVar_12 = cl_15.get().defined_variants.get(i_177);
      final Optional<RangerAppMethodVariants> mVs_12 = Optional.ofNullable(cl_15.get().method_variants.get(fnVar_12));
      for ( int i_184 = 0; i_184 < mVs_12.get().variants.size(); i_184++) {
        RangerAppFunctionDesc variant_23 = mVs_12.get().variants.get(i_184);
        declaredFn.put(variant_23.name, true);
        wr_9.out(((("func (this *" + cl_15.get().name) + ") ") + variant_23.name) + " (", false);
        this.writeArgsDef(variant_23, ctx, wr_9);
        wr_9.out(") ", false);
        if ( variant_23.nameNode.get().hasFlag("optional") ) {
          wr_9.out("*GoNullable", false);
        } else {
          this.writeTypeDef(variant_23.nameNode.get(), ctx, wr_9);
        }
        wr_9.out(" {", true);
        wr_9.indent(1);
        wr_9.newline();
        final RangerAppWriterContext subCtx_44 = variant_23.fnCtx.get();
        subCtx_44.is_function = true;
        this.WalkNode(variant_23.fnBody.get(), subCtx_44, wr_9);
        wr_9.newline();
        wr_9.indent(-1);
        wr_9.out("}", true);
      }
    }
    if ( (cl_15.get().extends_classes.size()) > 0 ) {
      for ( int i_183 = 0; i_183 < cl_15.get().extends_classes.size(); i_183++) {
        String pName_12 = cl_15.get().extends_classes.get(i_183);
        final RangerAppClassDesc pC_10 = ctx.findClass(pName_12);
        wr_9.out("// inherited methods from parent class " + pName_12, true);
        for ( int i_192 = 0; i_192 < pC_10.defined_variants.size(); i_192++) {
          String fnVar_15 = pC_10.defined_variants.get(i_192);
          final Optional<RangerAppMethodVariants> mVs_15 = Optional.ofNullable(pC_10.method_variants.get(fnVar_15));
          for ( int i_200 = 0; i_200 < mVs_15.get().variants.size(); i_200++) {
            RangerAppFunctionDesc variant_26 = mVs_15.get().variants.get(i_200);
            if ( declaredFn.containsKey(variant_26.name) ) {
              continue;
            }
            wr_9.out(((("func (this *" + cl_15.get().name) + ") ") + variant_26.name) + " (", false);
            this.writeArgsDef(variant_26, ctx, wr_9);
            wr_9.out(") ", false);
            if ( variant_26.nameNode.get().hasFlag("optional") ) {
              wr_9.out("*GoNullable", false);
            } else {
              this.writeTypeDef(variant_26.nameNode.get(), ctx, wr_9);
            }
            wr_9.out(" {", true);
            wr_9.indent(1);
            wr_9.newline();
            final RangerAppWriterContext subCtx_47 = variant_26.fnCtx.get();
            subCtx_47.is_function = true;
            this.WalkNode(variant_26.fnBody.get(), subCtx_47, wr_9);
            wr_9.newline();
            wr_9.indent(-1);
            wr_9.out("}", true);
          }
        }
      }
    }
    HashMap<String,Boolean> declaredGetter = new HashMap<String,Boolean>();
    for ( int i_192 = 0; i_192 < cl_15.get().variables.size(); i_192++) {
      RangerAppParamDesc p_54 = cl_15.get().variables.get(i_192);
      declaredGetter.put(p_54.name, true);
      wr_9.newline();
      wr_9.out("// getter for variable " + p_54.name, true);
      wr_9.out(("func (this *" + cl_15.get().name) + ") ", false);
      wr_9.out("Get_", false);
      wr_9.out(p_54.compiledName + "() ", false);
      if ( p_54.nameNode.get().hasFlag("optional") ) {
        wr_9.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_54.nameNode.get(), ctx, wr_9);
      }
      wr_9.out(" {", true);
      wr_9.indent(1);
      wr_9.out("return this." + p_54.compiledName, true);
      wr_9.indent(-1);
      wr_9.out("}", true);
      wr_9.newline();
      wr_9.out("// setter for variable " + p_54.name, true);
      wr_9.out(("func (this *" + cl_15.get().name) + ") ", false);
      wr_9.out("Set_", false);
      wr_9.out(p_54.compiledName + "( value ", false);
      if ( p_54.nameNode.get().hasFlag("optional") ) {
        wr_9.out("*GoNullable", false);
      } else {
        this.writeTypeDef(p_54.nameNode.get(), ctx, wr_9);
      }
      wr_9.out(") ", false);
      wr_9.out(" {", true);
      wr_9.indent(1);
      wr_9.out(("this." + p_54.compiledName) + " = value ", true);
      wr_9.indent(-1);
      wr_9.out("}", true);
    }
    if ( (cl_15.get().extends_classes.size()) > 0 ) {
      for ( int i_195 = 0; i_195 < cl_15.get().extends_classes.size(); i_195++) {
        String pName_15 = cl_15.get().extends_classes.get(i_195);
        final RangerAppClassDesc pC_13 = ctx.findClass(pName_15);
        wr_9.out("// inherited getters and setters from the parent class " + pName_15, true);
        for ( int i_204 = 0; i_204 < pC_13.variables.size(); i_204++) {
          RangerAppParamDesc p_57 = pC_13.variables.get(i_204);
          if ( declaredGetter.containsKey(p_57.name) ) {
            continue;
          }
          wr_9.newline();
          wr_9.out("// getter for variable " + p_57.name, true);
          wr_9.out(("func (this *" + cl_15.get().name) + ") ", false);
          wr_9.out("Get_", false);
          wr_9.out(p_57.compiledName + "() ", false);
          if ( p_57.nameNode.get().hasFlag("optional") ) {
            wr_9.out("*GoNullable", false);
          } else {
            this.writeTypeDef(p_57.nameNode.get(), ctx, wr_9);
          }
          wr_9.out(" {", true);
          wr_9.indent(1);
          wr_9.out("return this." + p_57.compiledName, true);
          wr_9.indent(-1);
          wr_9.out("}", true);
          wr_9.newline();
          wr_9.out("// getter for variable " + p_57.name, true);
          wr_9.out(("func (this *" + cl_15.get().name) + ") ", false);
          wr_9.out("Set_", false);
          wr_9.out(p_57.compiledName + "( value ", false);
          if ( p_57.nameNode.get().hasFlag("optional") ) {
            wr_9.out("*GoNullable", false);
          } else {
            this.writeTypeDef(p_57.nameNode.get(), ctx, wr_9);
          }
          wr_9.out(") ", false);
          wr_9.out(" {", true);
          wr_9.indent(1);
          wr_9.out(("this." + p_57.compiledName) + " = value ", true);
          wr_9.indent(-1);
          wr_9.out("}", true);
        }
      }
    }
    for ( int i_201 = 0; i_201 < cl_15.get().static_methods.size(); i_201++) {
      RangerAppFunctionDesc variant_29 = cl_15.get().static_methods.get(i_201);
      if ( variant_29.nameNode.get().hasFlag("main") ) {
        wr_9.out("func main() {", true);
        wr_9.indent(1);
        wr_9.newline();
        final RangerAppWriterContext subCtx_50 = variant_29.fnCtx.get();
        subCtx_50.is_function = true;
        this.WalkNode(variant_29.fnBody.get(), subCtx_50, wr_9);
        wr_9.newline();
        wr_9.indent(-1);
        wr_9.out("}", true);
      }
    }
  }
}
