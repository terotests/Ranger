import java.util.Optional;

class RangerPHPClassWriter extends RangerGenericClassWriter { 
  public String thisName = "this";
  public boolean wrote_header = false;
  
  public String adjustType( String tn ) {
    if ( tn.equals("this") ) {
      return "this";
    }
    return tn;
  }
  
  public String EncodeString( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    /** unused:  final String encoded_str_4 = ""   **/ ;
    final int str_length_3 = node.string_value.length();
    String encoded_str_10 = "";
    int ii_12 = 0;
    while (ii_12 < str_length_3) {
      final int cc_20 = (int)node.string_value.charAt(ii_12);
      switch (cc_20 ) { 
        case 8 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(98))));
          break;
        case 9 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(116))));
          break;
        case 10 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(110))));
          break;
        case 12 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(102))));
          break;
        case 13 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(114))));
          break;
        case 34 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(34))));
          break;
        case 36 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(34))));
          break;
        case 92 : 
          encoded_str_10 = (encoded_str_10 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(92))));
          break;
        default: 
          encoded_str_10 = encoded_str_10 + ((new String( Character.toChars(cc_20))));
          break;
      }
      ii_12 = ii_12 + 1;
    }
    return encoded_str_10;
  }
  
  public void WriteScalarValue( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    switch (node.value_type ) { 
      case 2 : 
        wr.out("" + node.double_value, false);
        break;
      case 4 : 
        final String s_22 = this.EncodeString(node, ctx, wr);
        wr.out(("\"" + s_22) + "\"", false);
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
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.vref.equals("this") ) {
      wr.out("$this", false);
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.size()) > 1 ) {
        final String rootObjName_13 = node.ns.get(0);
        final String enumName_13 = node.ns.get(1);
        final Optional<RangerAppEnum> e_19 = ctx.getEnum(rootObjName_13);
        if ( e_19.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e_19.get().values.get(enumName_13))).get()), false);
          return;
        }
      }
    }
    if ( (node.nsp.size()) > 0 ) {
      for ( int i_166 = 0; i_166 < node.nsp.size(); i_166++) {
        RangerAppParamDesc p_48 = node.nsp.get(i_166);
        if ( i_166 == 0 ) {
          final String part_19 = node.ns.get(0);
          if ( part_19.equals("this") ) {
            wr.out("$this", false);
            continue;
          }
        }
        if ( i_166 > 0 ) {
          wr.out("->", false);
        }
        if ( i_166 == 0 ) {
          wr.out("$", false);
          if ( p_48.nameNode.get().hasFlag("optional") ) {
          }
          final String part_28 = node.ns.get(0);
          if ( (!part_28.equals("this")) && ctx.hasCurrentClass() ) {
            final Optional<RangerAppClassDesc> uc = ctx.getCurrentClass();
            final RangerAppClassDesc currC_16 = uc.get();
            final Optional<RangerAppParamDesc> up_9 = currC_16.findVariable(part_28);
            if ( up_9.isPresent() ) {
              wr.out(thisName + "->", false);
            }
          }
        }
        if ( (p_48.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_48.compiledName), false);
        } else {
          if ( (p_48.name.length()) > 0 ) {
            wr.out(this.adjustType(p_48.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_166))), false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      wr.out("$", false);
      final String part_27 = node.ns.get(0);
      if ( (!part_27.equals("this")) && ctx.hasCurrentClass() ) {
        final Optional<RangerAppClassDesc> uc_6 = ctx.getCurrentClass();
        final RangerAppClassDesc currC_21 = uc_6.get();
        final Optional<RangerAppParamDesc> up_14 = currC_21.findVariable(part_27);
        if ( up_14.isPresent() ) {
          wr.out(thisName + "->", false);
        }
      }
      final Optional<RangerAppParamDesc> p_53 = node.paramDesc;
      wr.out(p_53.get().compiledName, false);
      return;
    }
    boolean b_was_static_5 = false;
    for ( int i_171 = 0; i_171 < node.ns.size(); i_171++) {
      String part_30 = node.ns.get(i_171);
      if ( i_171 > 0 ) {
        if ( (i_171 == 1) && b_was_static_5 ) {
          wr.out("::", false);
        } else {
          wr.out("->", false);
        }
      }
      if ( i_171 == 0 ) {
        if ( ctx.hasClass(part_30) ) {
          b_was_static_5 = true;
        } else {
          wr.out("$", false);
        }
        if ( (!part_30.equals("this")) && ctx.hasCurrentClass() ) {
          final Optional<RangerAppClassDesc> uc_9 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_24 = uc_9.get();
          final Optional<RangerAppParamDesc> up_17 = currC_24.findVariable(part_30);
          if ( up_17.isPresent() ) {
            wr.out(thisName + "->", false);
          }
        }
      }
      wr.out(this.adjustType(part_30), false);
    }
  }
  
  public void writeVarInitDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_23 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_53 = nn_23.paramDesc;
      if ( (p_53.get().ref_cnt == 0) && (p_53.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("$this->" + p_53.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_16 = node.getThird();
        this.WalkNode(value_16, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_23.value_type == 6 ) {
          wr.out(" = array()", false);
        }
        if ( nn_23.value_type == 7 ) {
          wr.out(" = array()", false);
        }
      }
      if ( (p_53.get().ref_cnt == 0) && (p_53.get().is_class_variable == false) ) {
        wr.out("   **/", true);
        return;
      }
      wr.out(";", false);
      if ( (p_53.get().ref_cnt == 0) && (p_53.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      wr.newline();
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_26 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_55 = nn_26.paramDesc;
      if ( (p_55.get().ref_cnt == 0) && (p_55.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("$" + p_55.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_19 = node.getThird();
        this.WalkNode(value_19, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_26.value_type == 6 ) {
          wr.out(" = array()", false);
        }
        if ( nn_26.value_type == 7 ) {
          wr.out(" = array()", false);
        }
      }
      if ( (p_55.get().ref_cnt == 0) && (p_55.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_55.get().ref_cnt == 0) && (p_55.get().is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  public void writeClassVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_28 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_57 = nn_28.paramDesc;
      wr.out(("var $" + p_57.get().compiledName) + ";", true);
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_171 = 0; i_171 < fnDesc.params.size(); i_171++) {
      RangerAppParamDesc arg_30 = fnDesc.params.get(i_171);
      if ( i_171 > 0 ) {
        wr.out(",", false);
      }
      wr.out((" $" + arg_30.name) + " ", false);
    }
  }
  
  public void writeFnCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasFnCall ) {
      final CodeNode fc_36 = node.getFirst();
      this.WriteVRef(fc_36, ctx, wr);
      wr.out("(", false);
      final CodeNode givenArgs_11 = node.getSecond();
      ctx.setInExpr();
      for ( int i_173 = 0; i_173 < node.fnDesc.get().params.size(); i_173++) {
        RangerAppParamDesc arg_33 = node.fnDesc.get().params.get(i_173);
        if ( i_173 > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs_11.children.size()) <= i_173 ) {
          final Optional<CodeNode> defVal_5 = arg_33.nameNode.get().getFlag("default");
          if ( defVal_5.isPresent() ) {
            final CodeNode fc_47 = defVal_5.get().vref_annotation.get().getFirst();
            this.WalkNode(fc_47, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        final CodeNode n_17 = givenArgs_11.children.get(i_173);
        this.WalkNode(n_17, ctx, wr);
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
      final Optional<RangerAppClassDesc> cl_17 = node.clDesc;
      /** unused:  final CodeNode fc_41 = node.getSecond()   **/ ;
      wr.out(" new ", false);
      wr.out(node.clDesc.get().name, false);
      wr.out("(", false);
      final Optional<RangerAppFunctionDesc> constr_19 = cl_17.get().constructor_fn;
      final CodeNode givenArgs_14 = node.getThird();
      if ( constr_19.isPresent() ) {
        for ( int i_175 = 0; i_175 < constr_19.get().params.size(); i_175++) {
          RangerAppParamDesc arg_35 = constr_19.get().params.get(i_175);
          final CodeNode n_20 = givenArgs_14.children.get(i_175);
          if ( i_175 > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (arg_35.nameNode.isPresent()) ) {
            this.WalkNode(n_20, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_20 = node.clDesc;
    if ( !cl_20.isPresent() ) {
      return;
    }
    final CodeWriter wr_11 = orig_wr;
    /** unused:  final CodeWriter importFork_5 = wr_11.fork()   **/ ;
    if ( wrote_header == false ) {
      wr_11.out("<? ", true);
      wr_11.out("", true);
      wrote_header = true;
    }
    wr_11.out("class " + cl_20.get().name, false);
    Optional<RangerAppClassDesc> parentClass_4 = Optional.empty();
    if ( (cl_20.get().extends_classes.size()) > 0 ) {
      wr_11.out(" extends ", false);
      for ( int i_177 = 0; i_177 < cl_20.get().extends_classes.size(); i_177++) {
        String pName_9 = cl_20.get().extends_classes.get(i_177);
        wr_11.out(pName_9, false);
        parentClass_4 = Optional.of(ctx.findClass(pName_9));
      }
    }
    wr_11.out(" { ", true);
    wr_11.indent(1);
    for ( int i_181 = 0; i_181 < cl_20.get().variables.size(); i_181++) {
      RangerAppParamDesc pvar_17 = cl_20.get().variables.get(i_181);
      this.writeClassVarDef(pvar_17.node.get(), ctx, wr_11);
    }
    wr_11.out("", true);
    wr_11.out("function __construct(", false);
    if ( cl_20.get().has_constructor ) {
      final RangerAppFunctionDesc constr_22 = cl_20.get().constructor_fn.get();
      this.writeArgsDef(constr_22, ctx, wr_11);
    }
    wr_11.out(" ) {", true);
    wr_11.indent(1);
    if ( parentClass_4.isPresent()) {
      wr_11.out("parent::__construct();", true);
    }
    for ( int i_184 = 0; i_184 < cl_20.get().variables.size(); i_184++) {
      RangerAppParamDesc pvar_22 = cl_20.get().variables.get(i_184);
      this.writeVarInitDef(pvar_22.node.get(), ctx, wr_11);
    }
    if ( cl_20.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_26 = cl_20.get().constructor_fn;
      wr_11.newline();
      final RangerAppWriterContext subCtx_43 = constr_26.get().fnCtx.get();
      subCtx_43.is_function = true;
      this.WalkNode(constr_26.get().fnBody.get(), subCtx_43, wr_11);
    }
    wr_11.newline();
    wr_11.indent(-1);
    wr_11.out("}", true);
    for ( int i_187 = 0; i_187 < cl_20.get().static_methods.size(); i_187++) {
      RangerAppFunctionDesc variant_25 = cl_20.get().static_methods.get(i_187);
      wr_11.out("", true);
      if ( variant_25.nameNode.get().hasFlag("main") ) {
        continue;
      } else {
        wr_11.out("public static function ", false);
        wr_11.out(variant_25.name + "(", false);
        this.writeArgsDef(variant_25, ctx, wr_11);
        wr_11.out(") {", true);
      }
      wr_11.indent(1);
      wr_11.newline();
      final RangerAppWriterContext subCtx_48 = variant_25.fnCtx.get();
      subCtx_48.is_function = true;
      this.WalkNode(variant_25.fnBody.get(), subCtx_48, wr_11);
      wr_11.newline();
      wr_11.indent(-1);
      wr_11.out("}", true);
    }
    for ( int i_190 = 0; i_190 < cl_20.get().defined_variants.size(); i_190++) {
      String fnVar_12 = cl_20.get().defined_variants.get(i_190);
      final Optional<RangerAppMethodVariants> mVs_12 = Optional.ofNullable(cl_20.get().method_variants.get(fnVar_12));
      for ( int i_197 = 0; i_197 < mVs_12.get().variants.size(); i_197++) {
        RangerAppFunctionDesc variant_30 = mVs_12.get().variants.get(i_197);
        wr_11.out("", true);
        wr_11.out(("function " + variant_30.name) + "(", false);
        this.writeArgsDef(variant_30, ctx, wr_11);
        wr_11.out(") {", true);
        wr_11.indent(1);
        wr_11.newline();
        final RangerAppWriterContext subCtx_51 = variant_30.fnCtx.get();
        subCtx_51.is_function = true;
        this.WalkNode(variant_30.fnBody.get(), subCtx_51, wr_11);
        wr_11.newline();
        wr_11.indent(-1);
        wr_11.out("}", true);
      }
    }
    wr_11.indent(-1);
    wr_11.out("}", true);
    for ( int i_196 = 0; i_196 < cl_20.get().static_methods.size(); i_196++) {
      RangerAppFunctionDesc variant_33 = cl_20.get().static_methods.get(i_196);
      ctx.disableCurrentClass();
      wr_11.out("", true);
      if ( variant_33.nameNode.get().hasFlag("main") ) {
        wr_11.out("/* static PHP main routine */", false);
        wr_11.newline();
        this.WalkNode(variant_33.fnBody.get(), ctx, wr_11);
        wr_11.newline();
      }
    }
  }
}
