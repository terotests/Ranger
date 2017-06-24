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
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.vref.equals("this") ) {
      wr.out("$this", false);
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.size()) > 1 ) {
        final String rootObjName_12 = node.ns.get(0);
        final String enumName_12 = node.ns.get(1);
        final Optional<RangerAppEnum> e_18 = ctx.getEnum(rootObjName_12);
        if ( e_18.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e_18.get().values.get(enumName_12))).get()), false);
          return;
        }
      }
    }
    if ( (node.nsp.size()) > 0 ) {
      for ( int i_150 = 0; i_150 < node.nsp.size(); i_150++) {
        RangerAppParamDesc p_44 = node.nsp.get(i_150);
        if ( i_150 == 0 ) {
          final String part_17 = node.ns.get(0);
          if ( part_17.equals("this") ) {
            wr.out("$this", false);
            continue;
          }
        }
        if ( i_150 > 0 ) {
          wr.out("->", false);
        }
        if ( i_150 == 0 ) {
          wr.out("$", false);
          if ( p_44.nameNode.get().hasFlag("optional") ) {
          }
          final String part_26 = node.ns.get(0);
          if ( (!part_26.equals("this")) && ctx.hasCurrentClass() ) {
            final Optional<RangerAppClassDesc> uc = ctx.getCurrentClass();
            final RangerAppClassDesc currC_16 = uc.get();
            final Optional<RangerAppParamDesc> up_9 = currC_16.findVariable(part_26);
            if ( up_9.isPresent() ) {
              wr.out(thisName + "->", false);
            }
          }
        }
        if ( (p_44.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_44.compiledName), false);
        } else {
          if ( (p_44.name.length()) > 0 ) {
            wr.out(this.adjustType(p_44.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_150))), false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      wr.out("$", false);
      final String part_25 = node.ns.get(0);
      if ( (!part_25.equals("this")) && ctx.hasCurrentClass() ) {
        final Optional<RangerAppClassDesc> uc_6 = ctx.getCurrentClass();
        final RangerAppClassDesc currC_21 = uc_6.get();
        final Optional<RangerAppParamDesc> up_14 = currC_21.findVariable(part_25);
        if ( up_14.isPresent() ) {
          wr.out(thisName + "->", false);
        }
      }
      final Optional<RangerAppParamDesc> p_49 = node.paramDesc;
      wr.out(p_49.get().compiledName, false);
      return;
    }
    boolean b_was_static_5 = false;
    for ( int i_155 = 0; i_155 < node.ns.size(); i_155++) {
      String part_28 = node.ns.get(i_155);
      if ( i_155 > 0 ) {
        if ( (i_155 == 1) && b_was_static_5 ) {
          wr.out("::", false);
        } else {
          wr.out("->", false);
        }
      }
      if ( i_155 == 0 ) {
        if ( ctx.hasClass(part_28) ) {
          b_was_static_5 = true;
        } else {
          wr.out("$", false);
        }
        if ( (!part_28.equals("this")) && ctx.hasCurrentClass() ) {
          final Optional<RangerAppClassDesc> uc_9 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_24 = uc_9.get();
          final Optional<RangerAppParamDesc> up_17 = currC_24.findVariable(part_28);
          if ( up_17.isPresent() ) {
            wr.out(thisName + "->", false);
          }
        }
      }
      wr.out(this.adjustType(part_28), false);
    }
  }
  
  public void writeVarInitDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_20 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_49 = nn_20.paramDesc;
      if ( (p_49.get().ref_cnt == 0) && (p_49.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("$this->" + p_49.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_15 = node.getThird();
        this.WalkNode(value_15, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_20.value_type == 6 ) {
          wr.out(" = array()", false);
        }
        if ( nn_20.value_type == 7 ) {
          wr.out(" = array()", false);
        }
      }
      if ( (p_49.get().ref_cnt == 0) && (p_49.get().is_class_variable == false) ) {
        wr.out("   **/", true);
        return;
      }
      wr.out(";", false);
      if ( (p_49.get().ref_cnt == 0) && (p_49.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      wr.newline();
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_23 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_51 = nn_23.paramDesc;
      if ( (p_51.get().ref_cnt == 0) && (p_51.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("$" + p_51.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_18 = node.getThird();
        this.WalkNode(value_18, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_23.value_type == 6 ) {
          wr.out(" = array()", false);
        }
        if ( nn_23.value_type == 7 ) {
          wr.out(" = array()", false);
        }
      }
      if ( (p_51.get().ref_cnt == 0) && (p_51.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_51.get().ref_cnt == 0) && (p_51.get().is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  public void writeClassVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_25 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_53 = nn_25.paramDesc;
      wr.out(("var $" + p_53.get().compiledName) + ";", true);
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_155 = 0; i_155 < fnDesc.params.size(); i_155++) {
      RangerAppParamDesc arg_27 = fnDesc.params.get(i_155);
      if ( i_155 > 0 ) {
        wr.out(",", false);
      }
      wr.out((" $" + arg_27.name) + " ", false);
    }
  }
  
  public void writeFnCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasFnCall ) {
      final CodeNode fc_33 = node.getFirst();
      this.WriteVRef(fc_33, ctx, wr);
      wr.out("(", false);
      final CodeNode givenArgs_9 = node.getSecond();
      ctx.setInExpr();
      for ( int i_157 = 0; i_157 < node.fnDesc.get().params.size(); i_157++) {
        RangerAppParamDesc arg_30 = node.fnDesc.get().params.get(i_157);
        if ( i_157 > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs_9.children.size()) <= i_157 ) {
          final Optional<CodeNode> defVal_4 = arg_30.nameNode.get().getFlag("default");
          if ( defVal_4.isPresent() ) {
            final CodeNode fc_44 = defVal_4.get().vref_annotation.get().getFirst();
            this.WalkNode(fc_44, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        final CodeNode n_15 = givenArgs_9.children.get(i_157);
        this.WalkNode(n_15, ctx, wr);
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
      final Optional<RangerAppClassDesc> cl_14 = node.clDesc;
      /** unused:  final CodeNode fc_38 = node.getSecond()   **/ ;
      wr.out(" new ", false);
      wr.out(node.clDesc.get().name, false);
      wr.out("(", false);
      final Optional<RangerAppFunctionDesc> constr_15 = cl_14.get().constructor_fn;
      final CodeNode givenArgs_12 = node.getThird();
      if ( constr_15.isPresent() ) {
        for ( int i_159 = 0; i_159 < constr_15.get().params.size(); i_159++) {
          RangerAppParamDesc arg_32 = constr_15.get().params.get(i_159);
          final CodeNode n_18 = givenArgs_12.children.get(i_159);
          if ( i_159 > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (arg_32.nameNode.isPresent()) ) {
            this.WalkNode(n_18, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_17 = node.clDesc;
    if ( !cl_17.isPresent() ) {
      return;
    }
    final CodeWriter wr_10 = orig_wr;
    /** unused:  final CodeWriter importFork_5 = wr_10.fork()   **/ ;
    if ( wrote_header == false ) {
      wr_10.out("<? ", true);
      wr_10.out("", true);
      wrote_header = true;
    }
    wr_10.out("class " + cl_17.get().name, false);
    Optional<RangerAppClassDesc> parentClass_3 = Optional.empty();
    if ( (cl_17.get().extends_classes.size()) > 0 ) {
      wr_10.out(" extends ", false);
      for ( int i_161 = 0; i_161 < cl_17.get().extends_classes.size(); i_161++) {
        String pName_8 = cl_17.get().extends_classes.get(i_161);
        wr_10.out(pName_8, false);
        parentClass_3 = Optional.of(ctx.findClass(pName_8));
      }
    }
    wr_10.out(" { ", true);
    wr_10.indent(1);
    for ( int i_165 = 0; i_165 < cl_17.get().variables.size(); i_165++) {
      RangerAppParamDesc pvar_15 = cl_17.get().variables.get(i_165);
      this.writeClassVarDef(pvar_15.node.get(), ctx, wr_10);
    }
    wr_10.out("", true);
    wr_10.out("function __construct(", false);
    if ( cl_17.get().has_constructor ) {
      final RangerAppFunctionDesc constr_18 = cl_17.get().constructor_fn.get();
      this.writeArgsDef(constr_18, ctx, wr_10);
    }
    wr_10.out(" ) {", true);
    wr_10.indent(1);
    if ( parentClass_3.isPresent()) {
      wr_10.out("parent::__construct();", true);
    }
    for ( int i_168 = 0; i_168 < cl_17.get().variables.size(); i_168++) {
      RangerAppParamDesc pvar_20 = cl_17.get().variables.get(i_168);
      this.writeVarInitDef(pvar_20.node.get(), ctx, wr_10);
    }
    if ( cl_17.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_22 = cl_17.get().constructor_fn;
      wr_10.newline();
      final RangerAppWriterContext subCtx_39 = constr_22.get().fnCtx.get();
      subCtx_39.is_function = true;
      this.WalkNode(constr_22.get().fnBody.get(), subCtx_39, wr_10);
    }
    wr_10.newline();
    wr_10.indent(-1);
    wr_10.out("}", true);
    for ( int i_171 = 0; i_171 < cl_17.get().static_methods.size(); i_171++) {
      RangerAppFunctionDesc variant_20 = cl_17.get().static_methods.get(i_171);
      wr_10.out("", true);
      if ( variant_20.nameNode.get().hasFlag("main") ) {
        continue;
      } else {
        wr_10.out("public static function ", false);
        wr_10.out(variant_20.name + "(", false);
        this.writeArgsDef(variant_20, ctx, wr_10);
        wr_10.out(") {", true);
      }
      wr_10.indent(1);
      wr_10.newline();
      final RangerAppWriterContext subCtx_44 = variant_20.fnCtx.get();
      subCtx_44.is_function = true;
      this.WalkNode(variant_20.fnBody.get(), subCtx_44, wr_10);
      wr_10.newline();
      wr_10.indent(-1);
      wr_10.out("}", true);
    }
    for ( int i_174 = 0; i_174 < cl_17.get().defined_variants.size(); i_174++) {
      String fnVar_10 = cl_17.get().defined_variants.get(i_174);
      final Optional<RangerAppMethodVariants> mVs_10 = Optional.ofNullable(cl_17.get().method_variants.get(fnVar_10));
      for ( int i_181 = 0; i_181 < mVs_10.get().variants.size(); i_181++) {
        RangerAppFunctionDesc variant_25 = mVs_10.get().variants.get(i_181);
        wr_10.out("", true);
        wr_10.out(("function " + variant_25.name) + "(", false);
        this.writeArgsDef(variant_25, ctx, wr_10);
        wr_10.out(") {", true);
        wr_10.indent(1);
        wr_10.newline();
        final RangerAppWriterContext subCtx_47 = variant_25.fnCtx.get();
        subCtx_47.is_function = true;
        this.WalkNode(variant_25.fnBody.get(), subCtx_47, wr_10);
        wr_10.newline();
        wr_10.indent(-1);
        wr_10.out("}", true);
      }
    }
    wr_10.indent(-1);
    wr_10.out("}", true);
    for ( int i_180 = 0; i_180 < cl_17.get().static_methods.size(); i_180++) {
      RangerAppFunctionDesc variant_28 = cl_17.get().static_methods.get(i_180);
      ctx.disableCurrentClass();
      wr_10.out("", true);
      if ( variant_28.nameNode.get().hasFlag("main") ) {
        wr_10.out("/* static PHP main routine */", false);
        wr_10.newline();
        this.WalkNode(variant_28.fnBody.get(), ctx, wr_10);
        wr_10.newline();
      }
    }
  }
}
