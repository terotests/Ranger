import java.util.Optional;

class RangerJavaScriptClassWriter extends RangerGenericClassWriter { 
  public String thisName = "this"     /** note: unused */;
  public boolean wrote_header = false;
  
  public String adjustType( String tn ) {
    if ( tn.equals("this") ) {
      return "this";
    }
    return tn;
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
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
      for ( int i_162 = 0; i_162 < node.nsp.size(); i_162++) {
        RangerAppParamDesc p_49 = node.nsp.get(i_162);
        if ( i_162 > 0 ) {
          wr.out(".", false);
        }
        if ( i_162 == 0 ) {
          if ( p_49.nameNode.get().hasFlag("optional") ) {
          }
          final String part_21 = node.ns.get(0);
          if ( (!part_21.equals("this")) && ctx.isMemberVariable(part_21) ) {
            final Optional<RangerAppClassDesc> uc_4 = ctx.getCurrentClass();
            final RangerAppClassDesc currC_19 = uc_4.get();
            final Optional<RangerAppParamDesc> up_12 = currC_19.findVariable(part_21);
            if ( up_12.isPresent() ) {
              wr.out("this.", false);
            }
          }
          if ( part_21.equals("this") ) {
            wr.out("this", false);
            continue;
          }
        }
        if ( (p_49.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_49.compiledName), false);
        } else {
          if ( (p_49.name.length()) > 0 ) {
            wr.out(this.adjustType(p_49.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_162))), false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final String part_26 = node.ns.get(0);
      if ( (!part_26.equals("this")) && ctx.isMemberVariable(part_26) ) {
        final Optional<RangerAppClassDesc> uc_9 = ctx.getCurrentClass();
        final RangerAppClassDesc currC_24 = uc_9.get();
        final Optional<RangerAppParamDesc> up_17 = currC_24.findVariable(part_26);
        if ( up_17.isPresent() ) {
          wr.out("this.", false);
        }
      }
      final Optional<RangerAppParamDesc> p_54 = node.paramDesc;
      wr.out(p_54.get().compiledName, false);
      return;
    }
    boolean b_was_static_6 = false;
    for ( int i_167 = 0; i_167 < node.ns.size(); i_167++) {
      String part_29 = node.ns.get(i_167);
      if ( i_167 > 0 ) {
        if ( (i_167 == 1) && b_was_static_6 ) {
          wr.out(".", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_167 == 0 ) {
        if ( ctx.hasClass(part_29) ) {
          b_was_static_6 = true;
        } else {
          wr.out("", false);
        }
        if ( (!part_29.equals("this")) && ctx.isMemberVariable(part_29) ) {
          final Optional<RangerAppClassDesc> uc_12 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_27 = uc_12.get();
          final Optional<RangerAppParamDesc> up_20 = currC_27.findVariable(part_29);
          if ( up_20.isPresent() ) {
            wr.out("this.", false);
          }
        }
      }
      wr.out(this.adjustType(part_29), false);
    }
  }
  
  public void writeVarInitDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_23 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_54 = nn_23.paramDesc;
      final boolean remove_unused = ctx.hasCompilerFlag("remove-unused-class-vars");
      if ( (p_54.get().ref_cnt == 0) && (remove_unused || (p_54.get().is_class_variable == false)) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("this." + p_54.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_17 = node.getThird();
        this.WalkNode(value_17, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_23.value_type == 6 ) {
          wr.out(" = []", false);
        }
        if ( nn_23.value_type == 7 ) {
          wr.out(" = {}", false);
        }
      }
      if ( (p_54.get().ref_cnt == 0) && (remove_unused || (p_54.get().is_class_variable == false)) ) {
        wr.out("   **/", true);
        return;
      }
      wr.out(";", false);
      if ( (p_54.get().ref_cnt == 0) && (p_54.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      wr.newline();
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_26 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_56 = nn_26.paramDesc;
      /** unused:  final boolean opt_js = ctx.hasCompilerFlag("optimize-js")   **/ ;
      if ( (p_56.get().ref_cnt == 0) && (p_56.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("var " + p_56.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_20 = node.getThird();
        this.WalkNode(value_20, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_26.value_type == 6 ) {
          wr.out(" = []", false);
        }
        if ( nn_26.value_type == 7 ) {
          wr.out(" = []", false);
        }
      }
      if ( (p_56.get().ref_cnt == 0) && (p_56.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_56.get().ref_cnt == 0) && (p_56.get().is_class_variable == false) ) {
        wr.out("   **/ ", true);
      } else {
        wr.out("", false);
        wr.newline();
      }
    }
  }
  
  public void writeClassVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_167 = 0; i_167 < fnDesc.params.size(); i_167++) {
      RangerAppParamDesc arg_30 = fnDesc.params.get(i_167);
      if ( i_167 > 0 ) {
        wr.out(",", false);
      }
      wr.out(arg_30.name + " ", false);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_16 = node.clDesc;
    if ( !cl_16.isPresent() ) {
      return;
    }
    final CodeWriter wr_11 = orig_wr;
    /** unused:  final CodeWriter importFork_6 = wr_11.fork()   **/ ;
    if ( wrote_header == false ) {
      wr_11.out("", true);
      wrote_header = true;
    }
    boolean b_extd = false;
    wr_11.out(("class " + cl_16.get().name) + " ", false);
    for ( int i_169 = 0; i_169 < cl_16.get().extends_classes.size(); i_169++) {
      String pName_9 = cl_16.get().extends_classes.get(i_169);
      if ( i_169 == 0 ) {
        wr_11.out(" extends ", false);
      }
      wr_11.out(pName_9, false);
      b_extd = true;
    }
    wr_11.out(" {", true);
    wr_11.indent(1);
    for ( int i_173 = 0; i_173 < cl_16.get().variables.size(); i_173++) {
      RangerAppParamDesc pvar_17 = cl_16.get().variables.get(i_173);
      this.writeClassVarDef(pvar_17.node.get(), ctx, wr_11);
    }
    wr_11.out("", true);
    wr_11.out("constructor(", false);
    if ( cl_16.get().has_constructor ) {
      final RangerAppFunctionDesc constr_18 = cl_16.get().constructor_fn.get();
      this.writeArgsDef(constr_18, ctx, wr_11);
    }
    wr_11.out(" ) {", true);
    wr_11.indent(1);
    if ( b_extd ) {
      wr_11.out("super()", true);
    }
    for ( int i_176 = 0; i_176 < cl_16.get().variables.size(); i_176++) {
      RangerAppParamDesc pvar_22 = cl_16.get().variables.get(i_176);
      this.writeVarInitDef(pvar_22.node.get(), ctx, wr_11);
    }
    if ( cl_16.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_23 = cl_16.get().constructor_fn;
      wr_11.newline();
      final RangerAppWriterContext subCtx_42 = constr_23.get().fnCtx.get();
      subCtx_42.is_function = true;
      this.WalkNode(constr_23.get().fnBody.get(), subCtx_42, wr_11);
    }
    wr_11.newline();
    wr_11.indent(-1);
    wr_11.out("}", true);
    for ( int i_179 = 0; i_179 < cl_16.get().defined_variants.size(); i_179++) {
      String fnVar_11 = cl_16.get().defined_variants.get(i_179);
      final Optional<RangerAppMethodVariants> mVs_11 = Optional.ofNullable(cl_16.get().method_variants.get(fnVar_11));
      for ( int i_186 = 0; i_186 < mVs_11.get().variants.size(); i_186++) {
        RangerAppFunctionDesc variant_23 = mVs_11.get().variants.get(i_186);
        wr_11.out("", true);
        wr_11.out(("" + variant_23.name) + "(", false);
        this.writeArgsDef(variant_23, ctx, wr_11);
        wr_11.out(") {", true);
        wr_11.indent(1);
        wr_11.newline();
        final RangerAppWriterContext subCtx_47 = variant_23.fnCtx.get();
        subCtx_47.is_function = true;
        this.WalkNode(variant_23.fnBody.get(), subCtx_47, wr_11);
        wr_11.newline();
        wr_11.indent(-1);
        wr_11.out("}", true);
      }
    }
    wr_11.indent(-1);
    wr_11.out("}", true);
    for ( int i_185 = 0; i_185 < cl_16.get().static_methods.size(); i_185++) {
      RangerAppFunctionDesc variant_28 = cl_16.get().static_methods.get(i_185);
      wr_11.out("", true);
      if ( variant_28.nameNode.get().hasFlag("main") ) {
        continue;
      } else {
        wr_11.out(((cl_16.get().name + ".") + variant_28.name) + " = function(", false);
        this.writeArgsDef(variant_28, ctx, wr_11);
        wr_11.out(") {", true);
      }
      wr_11.indent(1);
      wr_11.newline();
      final RangerAppWriterContext subCtx_50 = variant_28.fnCtx.get();
      subCtx_50.is_function = true;
      this.WalkNode(variant_28.fnBody.get(), subCtx_50, wr_11);
      wr_11.newline();
      wr_11.indent(-1);
      wr_11.out("}", true);
    }
    for ( int i_188 = 0; i_188 < cl_16.get().static_methods.size(); i_188++) {
      RangerAppFunctionDesc variant_31 = cl_16.get().static_methods.get(i_188);
      ctx.disableCurrentClass();
      wr_11.out("", true);
      if ( variant_31.nameNode.get().hasFlag("main") ) {
        wr_11.out("/* static JavaSript main routine */", false);
        wr_11.newline();
        this.WalkNode(variant_31.fnBody.get(), ctx, wr_11);
        wr_11.newline();
      }
    }
  }
}
