import java.util.Optional;

class RangerKotlinClassWriter extends RangerGenericClassWriter { 
  
  public void WriteScalarValue( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    switch (node.value_type ) { 
      case 2 : 
        wr.out(node.getParsedString(), false);
        break;
      case 4 : 
        final String s_19 = this.EncodeString(node, ctx, wr);
        wr.out(("\"" + s_19) + "\"", false);
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
    int v_type_3 = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type_3 = node.eval_type;
    }
    switch (v_type_3 ) { 
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
        final String rootObjName_7 = node.ns.get(0);
        final String enumName_7 = node.ns.get(1);
        final Optional<RangerAppEnum> e_13 = ctx.getEnum(rootObjName_7);
        if ( e_13.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e_13.get().values.get(enumName_7))).get()), false);
          return;
        }
      }
    }
    if ( (node.nsp.size()) > 0 ) {
      for ( int i_93 = 0; i_93 < node.nsp.size(); i_93++) {
        RangerAppParamDesc p_24 = node.nsp.get(i_93);
        if ( i_93 > 0 ) {
          wr.out(".", false);
        }
        if ( (p_24.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_24.compiledName), false);
        } else {
          if ( (p_24.name.length()) > 0 ) {
            wr.out(this.adjustType(p_24.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_93))), false);
          }
        }
        if ( i_93 == 0 ) {
          if ( p_24.nameNode.get().hasFlag("optional") ) {
            wr.out("!!", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p_29 = node.paramDesc;
      wr.out(p_29.get().compiledName, false);
      return;
    }
    for ( int i_98 = 0; i_98 < node.ns.size(); i_98++) {
      String part_6 = node.ns.get(i_98);
      if ( i_98 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_6), false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_13 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_29 = nn_13.paramDesc;
      if ( (p_29.get().ref_cnt == 0) && (p_29.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p_29.get().set_cnt > 0) || p_29.get().is_class_variable ) {
        wr.out("var ", false);
      } else {
        wr.out("val ", false);
      }
      wr.out(p_29.get().compiledName, false);
      wr.out(" : ", false);
      this.writeTypeDef(p_29.get().nameNode.get(), ctx, wr);
      wr.out(" ", false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_6 = node.getThird();
        this.WalkNode(value_6, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_13.value_type == 6 ) {
          wr.out(" = arrayListOf()", false);
        }
        if ( nn_13.value_type == 7 ) {
          wr.out(" = hashMapOf()", false);
        }
      }
      if ( (p_29.get().ref_cnt == 0) && (p_29.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_29.get().ref_cnt == 0) && (p_29.get().is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_98 = 0; i_98 < fnDesc.params.size(); i_98++) {
      RangerAppParamDesc arg_18 = fnDesc.params.get(i_98);
      if ( i_98 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      wr.out(arg_18.name + " : ", false);
      this.writeTypeDef(arg_18.nameNode.get(), ctx, wr);
    }
  }
  
  public void writeFnCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasFnCall ) {
      final CodeNode fc_27 = node.getFirst();
      this.WriteVRef(fc_27, ctx, wr);
      wr.out("(", false);
      final CodeNode givenArgs_6 = node.getSecond();
      for ( int i_100 = 0; i_100 < node.fnDesc.get().params.size(); i_100++) {
        RangerAppParamDesc arg_21 = node.fnDesc.get().params.get(i_100);
        if ( i_100 > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs_6.children.size()) <= i_100 ) {
          final Optional<CodeNode> defVal_3 = arg_21.nameNode.get().getFlag("default");
          if ( defVal_3.isPresent() ) {
            final CodeNode fc_38 = defVal_3.get().vref_annotation.get().getFirst();
            this.WalkNode(fc_38, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        final CodeNode n_12 = givenArgs_6.children.get(i_100);
        this.WalkNode(n_12, ctx, wr);
      }
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.out(";", true);
      }
    }
  }
  
  public void writeNewCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasNewOper ) {
      final Optional<RangerAppClassDesc> cl_8 = node.clDesc;
      /** unused:  final CodeNode fc_32 = node.getSecond()   **/ ;
      wr.out(" ", false);
      wr.out(node.clDesc.get().name, false);
      wr.out("(", false);
      final Optional<RangerAppFunctionDesc> constr_5 = cl_8.get().constructor_fn;
      final CodeNode givenArgs_9 = node.getThird();
      if ( constr_5.isPresent() ) {
        for ( int i_102 = 0; i_102 < constr_5.get().params.size(); i_102++) {
          RangerAppParamDesc arg_23 = constr_5.get().params.get(i_102);
          final CodeNode n_15 = givenArgs_9.children.get(i_102);
          if ( i_102 > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (arg_23.nameNode.isPresent()) ) {
            this.WalkNode(n_15, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_11 = node.clDesc;
    if ( !cl_11.isPresent() ) {
      return;
    }
    final CodeWriter wr_6 = orig_wr;
    /** unused:  final CodeWriter importFork_2 = wr_6.fork()   **/ ;
    wr_6.out("", true);
    wr_6.out("class " + cl_11.get().name, false);
    if ( cl_11.get().has_constructor ) {
      final RangerAppFunctionDesc constr_8 = cl_11.get().constructor_fn.get();
      wr_6.out("(", false);
      this.writeArgsDef(constr_8, ctx, wr_6);
      wr_6.out(" ) ", true);
    }
    wr_6.out(" {", true);
    wr_6.indent(1);
    for ( int i_104 = 0; i_104 < cl_11.get().variables.size(); i_104++) {
      RangerAppParamDesc pvar_6 = cl_11.get().variables.get(i_104);
      this.writeVarDef(pvar_6.node.get(), ctx, wr_6);
    }
    if ( cl_11.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_12 = cl_11.get().constructor_fn;
      wr_6.out("", true);
      wr_6.out("init {", true);
      wr_6.indent(1);
      wr_6.newline();
      final RangerAppWriterContext subCtx_22 = constr_12.get().fnCtx.get();
      subCtx_22.is_function = true;
      this.WalkNode(constr_12.get().fnBody.get(), subCtx_22, wr_6);
      wr_6.newline();
      wr_6.indent(-1);
      wr_6.out("}", true);
    }
    if ( (cl_11.get().static_methods.size()) > 0 ) {
      wr_6.out("companion object {", true);
      wr_6.indent(1);
    }
    for ( int i_108 = 0; i_108 < cl_11.get().static_methods.size(); i_108++) {
      RangerAppFunctionDesc variant_7 = cl_11.get().static_methods.get(i_108);
      wr_6.out("", true);
      if ( variant_7.nameNode.get().hasFlag("main") ) {
        continue;
      }
      wr_6.out("fun ", false);
      wr_6.out(" ", false);
      wr_6.out(variant_7.name + "(", false);
      this.writeArgsDef(variant_7, ctx, wr_6);
      wr_6.out(") : ", false);
      this.writeTypeDef(variant_7.nameNode.get(), ctx, wr_6);
      wr_6.out(" {", true);
      wr_6.indent(1);
      wr_6.newline();
      final RangerAppWriterContext subCtx_27 = variant_7.fnCtx.get();
      subCtx_27.is_function = true;
      this.WalkNode(variant_7.fnBody.get(), subCtx_27, wr_6);
      wr_6.newline();
      wr_6.indent(-1);
      wr_6.out("}", true);
    }
    if ( (cl_11.get().static_methods.size()) > 0 ) {
      wr_6.indent(-1);
      wr_6.out("}", true);
    }
    for ( int i_111 = 0; i_111 < cl_11.get().defined_variants.size(); i_111++) {
      String fnVar_4 = cl_11.get().defined_variants.get(i_111);
      final Optional<RangerAppMethodVariants> mVs_4 = Optional.ofNullable(cl_11.get().method_variants.get(fnVar_4));
      for ( int i_118 = 0; i_118 < mVs_4.get().variants.size(); i_118++) {
        RangerAppFunctionDesc variant_12 = mVs_4.get().variants.get(i_118);
        wr_6.out("", true);
        wr_6.out("fun ", false);
        wr_6.out(" ", false);
        wr_6.out(variant_12.name + "(", false);
        this.writeArgsDef(variant_12, ctx, wr_6);
        wr_6.out(") : ", false);
        this.writeTypeDef(variant_12.nameNode.get(), ctx, wr_6);
        wr_6.out(" {", true);
        wr_6.indent(1);
        wr_6.newline();
        final RangerAppWriterContext subCtx_30 = variant_12.fnCtx.get();
        subCtx_30.is_function = true;
        this.WalkNode(variant_12.fnBody.get(), subCtx_30, wr_6);
        wr_6.newline();
        wr_6.indent(-1);
        wr_6.out("}", true);
      }
    }
    wr_6.indent(-1);
    wr_6.out("}", true);
    for ( int i_117 = 0; i_117 < cl_11.get().static_methods.size(); i_117++) {
      RangerAppFunctionDesc variant_15 = cl_11.get().static_methods.get(i_117);
      wr_6.out("", true);
      if ( variant_15.nameNode.get().hasFlag("main") ) {
        wr_6.out("fun main(args : Array<String>) {", true);
        wr_6.indent(1);
        wr_6.newline();
        final RangerAppWriterContext subCtx_33 = variant_15.fnCtx.get();
        subCtx_33.is_function = true;
        this.WalkNode(variant_15.fnBody.get(), subCtx_33, wr_6);
        wr_6.newline();
        wr_6.indent(-1);
        wr_6.out("}", true);
      }
    }
  }
}
