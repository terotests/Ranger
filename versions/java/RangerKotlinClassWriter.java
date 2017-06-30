import java.util.Optional;

class RangerKotlinClassWriter extends RangerGenericClassWriter { 
  
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
  
  public String adjustType( String tn ) {
    if ( tn.equals("this") ) {
      return "this";
    }
    return tn;
  }
  
  public String getObjectTypeString( String type_string , RangerAppWriterContext ctx ) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
      case "string" : 
        return "String";
      case "chararray" : 
        return "CharArray";
      case "char" : 
        return "char";
      case "boolean" : 
        return "Boolean";
      case "double" : 
        return "Double";
    }
    return type_string;
  }
  
  public String getTypeString( String type_string ) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
      case "string" : 
        return "String";
      case "chararray" : 
        return "CharArray";
      case "char" : 
        return "Char";
      case "boolean" : 
        return "Boolean";
      case "double" : 
        return "Double";
    }
    return type_string;
  }
  
  public void writeTypeDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    int v_type_4 = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type_4 = node.eval_type;
    }
    switch (v_type_4 ) { 
      case 11 : 
        wr.out("Int", false);
        break;
      case 3 : 
        wr.out("Int", false);
        break;
      case 2 : 
        wr.out("Double", false);
        break;
      case 12 : 
        wr.out("Char", false);
        break;
      case 13 : 
        wr.out("CharArray", false);
        break;
      case 4 : 
        wr.out("String", false);
        break;
      case 5 : 
        wr.out("Boolean", false);
        break;
      case 7 : 
        wr.out(((("MutableMap<" + this.getObjectTypeString(node.key_type, ctx)) + ",") + this.getObjectTypeString(node.array_type, ctx)) + ">", false);
        break;
      case 6 : 
        wr.out(("MutableList<" + this.getObjectTypeString(node.array_type, ctx)) + ">", false);
        break;
      default: 
        if ( node.type_name.equals("void") ) {
          wr.out("Unit", false);
        } else {
          wr.out(this.getTypeString(node.type_name), false);
        }
        break;
    }
    if ( node.hasFlag("optional") ) {
      wr.out("?", false);
    }
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.eval_type == 11 ) {
      if ( (node.ns.size()) > 1 ) {
        final String rootObjName_8 = node.ns.get(0);
        final String enumName_8 = node.ns.get(1);
        final Optional<RangerAppEnum> e_14 = ctx.getEnum(rootObjName_8);
        if ( e_14.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e_14.get().values.get(enumName_8))).get()), false);
          return;
        }
      }
    }
    if ( (node.nsp.size()) > 0 ) {
      for ( int i_109 = 0; i_109 < node.nsp.size(); i_109++) {
        RangerAppParamDesc p_28 = node.nsp.get(i_109);
        if ( i_109 > 0 ) {
          wr.out(".", false);
        }
        if ( (p_28.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_28.compiledName), false);
        } else {
          if ( (p_28.name.length()) > 0 ) {
            wr.out(this.adjustType(p_28.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_109))), false);
          }
        }
        if ( i_109 == 0 ) {
          if ( p_28.nameNode.get().hasFlag("optional") ) {
            wr.out("!!", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p_33 = node.paramDesc;
      wr.out(p_33.get().compiledName, false);
      return;
    }
    for ( int i_114 = 0; i_114 < node.ns.size(); i_114++) {
      String part_8 = node.ns.get(i_114);
      if ( i_114 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_8), false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_16 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_33 = nn_16.paramDesc;
      if ( (p_33.get().ref_cnt == 0) && (p_33.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p_33.get().set_cnt > 0) || p_33.get().is_class_variable ) {
        wr.out("var ", false);
      } else {
        wr.out("val ", false);
      }
      wr.out(p_33.get().compiledName, false);
      wr.out(" : ", false);
      this.writeTypeDef(p_33.get().nameNode.get(), ctx, wr);
      wr.out(" ", false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_7 = node.getThird();
        this.WalkNode(value_7, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_16.value_type == 6 ) {
          wr.out(" = arrayListOf()", false);
        }
        if ( nn_16.value_type == 7 ) {
          wr.out(" = hashMapOf()", false);
        }
      }
      if ( (p_33.get().ref_cnt == 0) && (p_33.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_33.get().ref_cnt == 0) && (p_33.get().is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_114 = 0; i_114 < fnDesc.params.size(); i_114++) {
      RangerAppParamDesc arg_21 = fnDesc.params.get(i_114);
      if ( i_114 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      wr.out(arg_21.name + " : ", false);
      this.writeTypeDef(arg_21.nameNode.get(), ctx, wr);
    }
  }
  
  public void writeFnCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasFnCall ) {
      final CodeNode fc_30 = node.getFirst();
      this.WriteVRef(fc_30, ctx, wr);
      wr.out("(", false);
      final CodeNode givenArgs_8 = node.getSecond();
      for ( int i_116 = 0; i_116 < node.fnDesc.get().params.size(); i_116++) {
        RangerAppParamDesc arg_24 = node.fnDesc.get().params.get(i_116);
        if ( i_116 > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs_8.children.size()) <= i_116 ) {
          final Optional<CodeNode> defVal_4 = arg_24.nameNode.get().getFlag("default");
          if ( defVal_4.isPresent() ) {
            final CodeNode fc_41 = defVal_4.get().vref_annotation.get().getFirst();
            this.WalkNode(fc_41, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        final CodeNode n_14 = givenArgs_8.children.get(i_116);
        this.WalkNode(n_14, ctx, wr);
      }
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  }
  
  public void writeNewCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasNewOper ) {
      final Optional<RangerAppClassDesc> cl_11 = node.clDesc;
      /** unused:  final CodeNode fc_35 = node.getSecond()   **/ ;
      wr.out(" ", false);
      wr.out(node.clDesc.get().name, false);
      wr.out("(", false);
      final Optional<RangerAppFunctionDesc> constr_9 = cl_11.get().constructor_fn;
      final CodeNode givenArgs_11 = node.getThird();
      if ( constr_9.isPresent() ) {
        for ( int i_118 = 0; i_118 < constr_9.get().params.size(); i_118++) {
          RangerAppParamDesc arg_26 = constr_9.get().params.get(i_118);
          final CodeNode n_17 = givenArgs_11.children.get(i_118);
          if ( i_118 > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (arg_26.nameNode.isPresent()) ) {
            this.WalkNode(n_17, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_14 = node.clDesc;
    if ( !cl_14.isPresent() ) {
      return;
    }
    final CodeWriter wr_7 = orig_wr;
    /** unused:  final CodeWriter importFork_2 = wr_7.fork()   **/ ;
    wr_7.out("", true);
    wr_7.out("class " + cl_14.get().name, false);
    if ( cl_14.get().has_constructor ) {
      final RangerAppFunctionDesc constr_12 = cl_14.get().constructor_fn.get();
      wr_7.out("(", false);
      this.writeArgsDef(constr_12, ctx, wr_7);
      wr_7.out(" ) ", true);
    }
    wr_7.out(" {", true);
    wr_7.indent(1);
    for ( int i_120 = 0; i_120 < cl_14.get().variables.size(); i_120++) {
      RangerAppParamDesc pvar_8 = cl_14.get().variables.get(i_120);
      this.writeVarDef(pvar_8.node.get(), ctx, wr_7);
    }
    if ( cl_14.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_16 = cl_14.get().constructor_fn;
      wr_7.out("", true);
      wr_7.out("init {", true);
      wr_7.indent(1);
      wr_7.newline();
      final RangerAppWriterContext subCtx_26 = constr_16.get().fnCtx.get();
      subCtx_26.is_function = true;
      this.WalkNode(constr_16.get().fnBody.get(), subCtx_26, wr_7);
      wr_7.newline();
      wr_7.indent(-1);
      wr_7.out("}", true);
    }
    if ( (cl_14.get().static_methods.size()) > 0 ) {
      wr_7.out("companion object {", true);
      wr_7.indent(1);
    }
    for ( int i_124 = 0; i_124 < cl_14.get().static_methods.size(); i_124++) {
      RangerAppFunctionDesc variant_12 = cl_14.get().static_methods.get(i_124);
      wr_7.out("", true);
      if ( variant_12.nameNode.get().hasFlag("main") ) {
        continue;
      }
      wr_7.out("fun ", false);
      wr_7.out(" ", false);
      wr_7.out(variant_12.name + "(", false);
      this.writeArgsDef(variant_12, ctx, wr_7);
      wr_7.out(") : ", false);
      this.writeTypeDef(variant_12.nameNode.get(), ctx, wr_7);
      wr_7.out(" {", true);
      wr_7.indent(1);
      wr_7.newline();
      final RangerAppWriterContext subCtx_31 = variant_12.fnCtx.get();
      subCtx_31.is_function = true;
      this.WalkNode(variant_12.fnBody.get(), subCtx_31, wr_7);
      wr_7.newline();
      wr_7.indent(-1);
      wr_7.out("}", true);
    }
    if ( (cl_14.get().static_methods.size()) > 0 ) {
      wr_7.indent(-1);
      wr_7.out("}", true);
    }
    for ( int i_127 = 0; i_127 < cl_14.get().defined_variants.size(); i_127++) {
      String fnVar_6 = cl_14.get().defined_variants.get(i_127);
      final Optional<RangerAppMethodVariants> mVs_6 = Optional.ofNullable(cl_14.get().method_variants.get(fnVar_6));
      for ( int i_134 = 0; i_134 < mVs_6.get().variants.size(); i_134++) {
        RangerAppFunctionDesc variant_17 = mVs_6.get().variants.get(i_134);
        wr_7.out("", true);
        wr_7.out("fun ", false);
        wr_7.out(" ", false);
        wr_7.out(variant_17.name + "(", false);
        this.writeArgsDef(variant_17, ctx, wr_7);
        wr_7.out(") : ", false);
        this.writeTypeDef(variant_17.nameNode.get(), ctx, wr_7);
        wr_7.out(" {", true);
        wr_7.indent(1);
        wr_7.newline();
        final RangerAppWriterContext subCtx_34 = variant_17.fnCtx.get();
        subCtx_34.is_function = true;
        this.WalkNode(variant_17.fnBody.get(), subCtx_34, wr_7);
        wr_7.newline();
        wr_7.indent(-1);
        wr_7.out("}", true);
      }
    }
    wr_7.indent(-1);
    wr_7.out("}", true);
    for ( int i_133 = 0; i_133 < cl_14.get().static_methods.size(); i_133++) {
      RangerAppFunctionDesc variant_20 = cl_14.get().static_methods.get(i_133);
      wr_7.out("", true);
      if ( variant_20.nameNode.get().hasFlag("main") ) {
        wr_7.out("fun main(args : Array<String>) {", true);
        wr_7.indent(1);
        wr_7.newline();
        final RangerAppWriterContext subCtx_37 = variant_20.fnCtx.get();
        subCtx_37.is_function = true;
        this.WalkNode(variant_20.fnBody.get(), subCtx_37, wr_7);
        wr_7.newline();
        wr_7.indent(-1);
        wr_7.out("}", true);
      }
    }
  }
}
