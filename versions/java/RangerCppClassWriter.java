import java.util.Optional;

class RangerCppClassWriter extends RangerGenericClassWriter { 
  public boolean header_created = false;
  
  public String adjustType( String tn ) {
    if ( tn.equals("this") ) {
      return "this";
    }
    return tn;
  }
  
  public void WriteScalarValue( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    switch (node.value_type ) { 
      case 2 : 
        wr.out("" + node.double_value, false);
        break;
      case 4 : 
        final String s_19 = this.EncodeString(node, ctx, wr);
        wr.out(("std::string(" + (("\"" + s_19) + "\"")) + ")", false);
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
    switch (type_string ) { 
      case "char" : 
        return "char";
      case "charbuffer" : 
        return "const char*";
      case "int" : 
        return "int";
      case "string" : 
        return "std::string";
      case "boolean" : 
        return "bool";
      case "double" : 
        return "double";
    }
    if ( ctx.isDefinedClass(type_string) ) {
      return ("std::shared_ptr<" + type_string) + ">";
    }
    return type_string;
  }
  
  public String getTypeString2( String type_string , RangerAppWriterContext ctx ) {
    switch (type_string ) { 
      case "char" : 
        return "char";
      case "charbuffer" : 
        return "const char*";
      case "int" : 
        return "int";
      case "string" : 
        return "std::string";
      case "boolean" : 
        return "bool";
      case "double" : 
        return "double";
    }
    return type_string;
  }
  
  public void writePtr( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.type_name.equals("void") ) {
      return;
    }
  }
  
  public void writeTypeDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    int v_type_3 = node.value_type;
    String t_name_2 = node.type_name;
    String a_name_3 = node.array_type;
    String k_name_2 = node.key_type;
    if ( ((v_type_3 == 8) || (v_type_3 == 9)) || (v_type_3 == 0) ) {
      v_type_3 = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type_3 = node.eval_type;
      if ( (node.eval_type_name.length()) > 0 ) {
        t_name_2 = node.eval_type_name;
      }
      if ( (node.eval_array_type.length()) > 0 ) {
        a_name_3 = node.eval_array_type;
      }
      if ( (node.eval_key_type.length()) > 0 ) {
        k_name_2 = node.eval_key_type;
      }
    }
    switch (v_type_3 ) { 
      case 11 : 
        wr.out("int", false);
        break;
      case 3 : 
        wr.out("int", false);
        break;
      case 12 : 
        wr.out("char", false);
        break;
      case 13 : 
        wr.out("const char*", false);
        break;
      case 2 : 
        wr.out("double", false);
        break;
      case 4 : 
        wr.addImport("<string>");
        wr.out("std::string", false);
        break;
      case 5 : 
        wr.out("bool", false);
        break;
      case 7 : 
        wr.out(((("std::map<" + this.getObjectTypeString(k_name_2, ctx)) + ",") + this.getObjectTypeString(a_name_3, ctx)) + ">", false);
        wr.addImport("<map>");
        break;
      case 6 : 
        wr.out(("std::vector<" + this.getObjectTypeString(a_name_3, ctx)) + ">", false);
        wr.addImport("<vector>");
        break;
      default: 
        if ( node.type_name.equals("void") ) {
          wr.out("void", false);
          return;
        }
        if ( ctx.isDefinedClass(t_name_2) ) {
          final RangerAppClassDesc cc_5 = ctx.findClass(t_name_2);
          wr.out("std::shared_ptr<", false);
          wr.out(cc_5.name, false);
          wr.out(">", false);
          return;
        }
        if ( node.hasFlag("optional") ) {
          wr.out("shared_ptr< vector<", false);
          wr.out(this.getTypeString2(t_name_2, ctx), false);
          wr.out(">", false);
          return;
        }
        wr.out(this.getTypeString2(t_name_2, ctx), false);
        break;
    }
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.vref.equals("this") ) {
      wr.out("this", false);
      return;
    }
    if ( node.eval_type == 11 ) {
      final String rootObjName_7 = node.ns.get(0);
      final String enumName_7 = node.ns.get(1);
      final Optional<RangerAppEnum> e_13 = ctx.getEnum(rootObjName_7);
      if ( e_13.isPresent() ) {
        wr.out("" + ((Optional.ofNullable(e_13.get().values.get(enumName_7))).get()), false);
        return;
      }
    }
    boolean had_static = false;
    if ( (node.nsp.size()) > 0 ) {
      for ( int i_94 = 0; i_94 < node.nsp.size(); i_94++) {
        RangerAppParamDesc p_24 = node.nsp.get(i_94);
        if ( i_94 > 0 ) {
          if ( had_static ) {
            wr.out("::", false);
          } else {
            wr.out("->", false);
          }
        }
        if ( i_94 == 0 ) {
          final String part_6 = node.ns.get(0);
          if ( part_6.equals("this") ) {
            wr.out("this", false);
            continue;
          }
        }
        if ( (p_24.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_24.compiledName), false);
        } else {
          if ( (p_24.name.length()) > 0 ) {
            wr.out(this.adjustType(p_24.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_94))), false);
          }
        }
        if ( p_24.isClass() ) {
          had_static = true;
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p_29 = node.paramDesc;
      wr.out(p_29.get().compiledName, false);
      return;
    }
    for ( int i_99 = 0; i_99 < node.ns.size(); i_99++) {
      String part_11 = node.ns.get(i_99);
      if ( i_99 > 0 ) {
        if ( had_static ) {
          wr.out("::", false);
        } else {
          wr.out("->", false);
        }
      }
      if ( ctx.hasClass(part_11) ) {
        had_static = true;
      } else {
        had_static = false;
      }
      wr.out(this.adjustType(part_11), false);
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
        wr.out("", false);
      } else {
        wr.out("", false);
      }
      this.writeTypeDef(p_29.get().nameNode.get(), ctx, wr);
      wr.out(" ", false);
      wr.out(p_29.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_6 = node.getThird();
        this.WalkNode(value_6, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_13.value_type == 6 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p_29.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
        }
        if ( nn_13.value_type == 7 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p_29.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
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
  
  public void writeCppHeaderVar( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr , boolean do_initialize ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_16 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_31 = nn_16.paramDesc;
      if ( (p_31.get().ref_cnt == 0) && (p_31.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p_31.get().set_cnt > 0) || p_31.get().is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("", false);
      }
      this.writeTypeDef(p_31.get().nameNode.get(), ctx, wr);
      wr.out(" ", false);
      wr.out(p_31.get().compiledName, false);
      if ( (p_31.get().ref_cnt == 0) && (p_31.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_31.get().ref_cnt == 0) && (p_31.get().is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_99 = 0; i_99 < fnDesc.params.size(); i_99++) {
      RangerAppParamDesc arg_18 = fnDesc.params.get(i_99);
      if ( i_99 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.writeTypeDef(arg_18.nameNode.get(), ctx, wr);
      wr.out((" " + arg_18.name) + " ", false);
    }
  }
  
  public void writeFnCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasFnCall ) {
      final CodeNode fc_27 = node.getFirst();
      this.WriteVRef(fc_27, ctx, wr);
      wr.out("(", false);
      ctx.setInExpr();
      final CodeNode givenArgs_6 = node.getSecond();
      for ( int i_101 = 0; i_101 < node.fnDesc.get().params.size(); i_101++) {
        RangerAppParamDesc arg_21 = node.fnDesc.get().params.get(i_101);
        if ( i_101 > 0 ) {
          wr.out(", ", false);
        }
        if ( i_101 >= (givenArgs_6.children.size()) ) {
          final Optional<CodeNode> defVal_3 = arg_21.nameNode.get().getFlag("default");
          if ( defVal_3.isPresent() ) {
            final CodeNode fc_38 = defVal_3.get().vref_annotation.get().getFirst();
            this.WalkNode(fc_38, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        final CodeNode n_12 = givenArgs_6.children.get(i_101);
        this.WalkNode(n_12, ctx, wr);
      }
      ctx.unsetInExpr();
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
      wr.out(" std::make_shared<", false);
      wr.out(node.clDesc.get().name, false);
      wr.out(">(", false);
      final Optional<RangerAppFunctionDesc> constr_5 = cl_8.get().constructor_fn;
      final CodeNode givenArgs_9 = node.getThird();
      if ( constr_5.isPresent() ) {
        for ( int i_103 = 0; i_103 < constr_5.get().params.size(); i_103++) {
          RangerAppParamDesc arg_23 = constr_5.get().params.get(i_103);
          final CodeNode n_15 = givenArgs_9.children.get(i_103);
          if ( i_103 > 0 ) {
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
  
  public void writeClassHeader( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final Optional<RangerAppClassDesc> cl_11 = node.clDesc;
    if ( !cl_11.isPresent() ) {
      return;
    }
    wr.out("class " + cl_11.get().name, false);
    Optional<RangerAppClassDesc> parentClass_3 = Optional.empty();
    if ( (cl_11.get().extends_classes.size()) > 0 ) {
      wr.out(" : ", false);
      for ( int i_105 = 0; i_105 < cl_11.get().extends_classes.size(); i_105++) {
        String pName_4 = cl_11.get().extends_classes.get(i_105);
        wr.out("public ", false);
        wr.out(pName_4, false);
        parentClass_3 = Optional.of(ctx.findClass(pName_4));
      }
    }
    wr.out(" { ", true);
    wr.indent(1);
    wr.out("public :", true);
    wr.indent(1);
    for ( int i_109 = 0; i_109 < cl_11.get().variables.size(); i_109++) {
      RangerAppParamDesc pvar_6 = cl_11.get().variables.get(i_109);
      this.writeCppHeaderVar(pvar_6.node.get(), ctx, wr, false);
    }
    wr.out("/* class constructor */ ", true);
    wr.out(cl_11.get().name + "(", false);
    if ( cl_11.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_8 = cl_11.get().constructor_fn;
      this.writeArgsDef(constr_8.get(), ctx, wr);
    }
    wr.out(" );", true);
    for ( int i_112 = 0; i_112 < cl_11.get().static_methods.size(); i_112++) {
      RangerAppFunctionDesc variant_7 = cl_11.get().static_methods.get(i_112);
      if ( i_112 == 0 ) {
        wr.out("/* static methods */ ", true);
      }
      wr.out("static ", false);
      this.writeTypeDef(variant_7.nameNode.get(), ctx, wr);
      wr.out((" " + variant_7.name) + "(", false);
      this.writeArgsDef(variant_7, ctx, wr);
      wr.out(");", true);
    }
    for ( int i_115 = 0; i_115 < cl_11.get().defined_variants.size(); i_115++) {
      String fnVar_4 = cl_11.get().defined_variants.get(i_115);
      if ( i_115 == 0 ) {
        wr.out("/* instance methods */ ", true);
      }
      final Optional<RangerAppMethodVariants> mVs_4 = Optional.ofNullable(cl_11.get().method_variants.get(fnVar_4));
      for ( int i_122 = 0; i_122 < mVs_4.get().variants.size(); i_122++) {
        RangerAppFunctionDesc variant_12 = mVs_4.get().variants.get(i_122);
        this.writeTypeDef(variant_12.nameNode.get(), ctx, wr);
        wr.out((" " + variant_12.name) + "(", false);
        this.writeArgsDef(variant_12, ctx, wr);
        wr.out(");", true);
      }
    }
    wr.indent(-1);
    wr.indent(-1);
    wr.out("};", true);
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_13 = node.clDesc;
    final CodeWriter wr_6 = orig_wr;
    if ( !cl_13.isPresent() ) {
      return;
    }
    if ( header_created == false ) {
      wr_6.createTag("c++Imports");
      wr_6.out("", true);
      wr_6.out("// define classes here to avoid compiler errors", true);
      wr_6.createTag("c++ClassDefs");
      wr_6.out("", true);
      wr_6.out("// header definitions", true);
      wr_6.createTag("c++Header");
      wr_6.out("", true);
      wr_6.createTag("utilities");
      header_created = true;
    }
    final CodeWriter classWriter = orig_wr.getTag("c++ClassDefs");
    final CodeWriter headerWriter = orig_wr.getTag("c++Header");
    /** unused:  final String projectName = "project"   **/ ;
    classWriter.out(("class " + cl_13.get().name) + ";", true);
    this.writeClassHeader(node, ctx, headerWriter);
    wr_6.out("", true);
    wr_6.out(((cl_13.get().name + "::") + cl_13.get().name) + "(", false);
    if ( cl_13.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_10 = cl_13.get().constructor_fn;
      this.writeArgsDef(constr_10.get(), ctx, wr_6);
    }
    wr_6.out(" ) {", true);
    wr_6.indent(1);
    for ( int i_115 = 0; i_115 < cl_13.get().variables.size(); i_115++) {
      RangerAppParamDesc pvar_9 = cl_13.get().variables.get(i_115);
      final CodeNode nn_18 = pvar_9.node.get();
      if ( (nn_18.children.size()) > 2 ) {
        final CodeNode valueNode = nn_18.children.get(2);
        wr_6.out(("this->" + pvar_9.compiledName) + " = ", false);
        this.WalkNode(valueNode, ctx, wr_6);
        wr_6.out(";", true);
      }
    }
    if ( cl_13.get().has_constructor ) {
      final RangerAppFunctionDesc constr_14 = cl_13.get().constructor_fn.get();
      wr_6.newline();
      final RangerAppWriterContext subCtx_22 = constr_14.fnCtx.get();
      subCtx_22.is_function = true;
      this.WalkNode(constr_14.fnBody.get(), subCtx_22, wr_6);
      wr_6.newline();
    }
    wr_6.indent(-1);
    wr_6.out("}", true);
    for ( int i_119 = 0; i_119 < cl_13.get().static_methods.size(); i_119++) {
      RangerAppFunctionDesc variant_12 = cl_13.get().static_methods.get(i_119);
      if ( variant_12.nameNode.get().hasFlag("main") ) {
        continue;
      }
      wr_6.out("", true);
      this.writeTypeDef(variant_12.nameNode.get(), ctx, wr_6);
      wr_6.out(" ", false);
      wr_6.out((" " + cl_13.get().name) + "::", false);
      wr_6.out(variant_12.name + "(", false);
      this.writeArgsDef(variant_12, ctx, wr_6);
      wr_6.out(") {", true);
      wr_6.indent(1);
      wr_6.newline();
      final RangerAppWriterContext subCtx_27 = variant_12.fnCtx.get();
      subCtx_27.is_function = true;
      this.WalkNode(variant_12.fnBody.get(), subCtx_27, wr_6);
      wr_6.newline();
      wr_6.indent(-1);
      wr_6.out("}", true);
    }
    for ( int i_122 = 0; i_122 < cl_13.get().defined_variants.size(); i_122++) {
      String fnVar_7 = cl_13.get().defined_variants.get(i_122);
      final Optional<RangerAppMethodVariants> mVs_7 = Optional.ofNullable(cl_13.get().method_variants.get(fnVar_7));
      for ( int i_129 = 0; i_129 < mVs_7.get().variants.size(); i_129++) {
        RangerAppFunctionDesc variant_16 = mVs_7.get().variants.get(i_129);
        wr_6.out("", true);
        this.writeTypeDef(variant_16.nameNode.get(), ctx, wr_6);
        wr_6.out(" ", false);
        wr_6.out((" " + cl_13.get().name) + "::", false);
        wr_6.out(variant_16.name + "(", false);
        this.writeArgsDef(variant_16, ctx, wr_6);
        wr_6.out(") {", true);
        wr_6.indent(1);
        wr_6.newline();
        final RangerAppWriterContext subCtx_30 = variant_16.fnCtx.get();
        subCtx_30.is_function = true;
        this.WalkNode(variant_16.fnBody.get(), subCtx_30, wr_6);
        wr_6.newline();
        wr_6.indent(-1);
        wr_6.out("}", true);
      }
    }
    for ( int i_128 = 0; i_128 < cl_13.get().static_methods.size(); i_128++) {
      RangerAppFunctionDesc variant_19 = cl_13.get().static_methods.get(i_128);
      if ( variant_19.nameNode.get().hasFlag("main") ) {
        wr_6.out("", true);
        wr_6.out("int main(int argc, char* argv[]) {", true);
        wr_6.indent(1);
        wr_6.newline();
        final RangerAppWriterContext subCtx_33 = variant_19.fnCtx.get();
        subCtx_33.is_function = true;
        this.WalkNode(variant_19.fnBody.get(), subCtx_33, wr_6);
        wr_6.newline();
        wr_6.out("return 0;", true);
        wr_6.indent(-1);
        wr_6.out("}", true);
      }
    }
  }
}
