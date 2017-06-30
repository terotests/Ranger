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
        final String rootObjName_14 = node.ns.get(0);
        final String enumName_14 = node.ns.get(1);
        final Optional<RangerAppEnum> e_20 = ctx.getEnum(rootObjName_14);
        if ( e_20.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e_20.get().values.get(enumName_14))).get()), false);
          return;
        }
      }
    }
    if ( (node.nsp.size()) > 0 ) {
      for ( int i_178 = 0; i_178 < node.nsp.size(); i_178++) {
        RangerAppParamDesc p_53 = node.nsp.get(i_178);
        if ( i_178 > 0 ) {
          wr.out(".", false);
        }
        if ( i_178 == 0 ) {
          if ( p_53.nameNode.get().hasFlag("optional") ) {
          }
          final String part_23 = node.ns.get(0);
          if ( (!part_23.equals("this")) && ctx.isMemberVariable(part_23) ) {
            final Optional<RangerAppClassDesc> uc_4 = ctx.getCurrentClass();
            final RangerAppClassDesc currC_19 = uc_4.get();
            final Optional<RangerAppParamDesc> up_12 = currC_19.findVariable(part_23);
            if ( up_12.isPresent() ) {
              wr.out("this.", false);
            }
          }
          if ( part_23.equals("this") ) {
            wr.out("this", false);
            continue;
          }
        }
        if ( (p_53.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_53.compiledName), false);
        } else {
          if ( (p_53.name.length()) > 0 ) {
            wr.out(this.adjustType(p_53.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_178))), false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final String part_28 = node.ns.get(0);
      if ( (!part_28.equals("this")) && ctx.isMemberVariable(part_28) ) {
        final Optional<RangerAppClassDesc> uc_9 = ctx.getCurrentClass();
        final RangerAppClassDesc currC_24 = uc_9.get();
        final Optional<RangerAppParamDesc> up_17 = currC_24.findVariable(part_28);
        if ( up_17.isPresent() ) {
          wr.out("this.", false);
        }
      }
      final Optional<RangerAppParamDesc> p_58 = node.paramDesc;
      wr.out(p_58.get().compiledName, false);
      return;
    }
    boolean b_was_static_6 = false;
    for ( int i_183 = 0; i_183 < node.ns.size(); i_183++) {
      String part_31 = node.ns.get(i_183);
      if ( i_183 > 0 ) {
        if ( (i_183 == 1) && b_was_static_6 ) {
          wr.out(".", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_183 == 0 ) {
        if ( ctx.hasClass(part_31) ) {
          b_was_static_6 = true;
        } else {
          wr.out("", false);
        }
        if ( (!part_31.equals("this")) && ctx.isMemberVariable(part_31) ) {
          final Optional<RangerAppClassDesc> uc_12 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_27 = uc_12.get();
          final Optional<RangerAppParamDesc> up_20 = currC_27.findVariable(part_31);
          if ( up_20.isPresent() ) {
            wr.out("this.", false);
          }
        }
      }
      wr.out(this.adjustType(part_31), false);
    }
  }
  
  public void writeVarInitDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_26 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_58 = nn_26.paramDesc;
      final boolean remove_unused = ctx.hasCompilerFlag("remove-unused-class-vars");
      if ( (p_58.get().ref_cnt == 0) && (remove_unused || (p_58.get().is_class_variable == false)) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("this." + p_58.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_18 = node.getThird();
        this.WalkNode(value_18, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_26.value_type == 6 ) {
          wr.out(" = []", false);
        }
        if ( nn_26.value_type == 7 ) {
          wr.out(" = {}", false);
        }
      }
      if ( (p_58.get().ref_cnt == 0) && (remove_unused || (p_58.get().is_class_variable == false)) ) {
        wr.out("   **/", true);
        return;
      }
      wr.out(";", false);
      if ( (p_58.get().ref_cnt == 0) && (p_58.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      wr.newline();
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_29 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_60 = nn_29.paramDesc;
      /** unused:  final boolean opt_js = ctx.hasCompilerFlag("optimize-js")   **/ ;
      if ( (p_60.get().ref_cnt == 0) && (p_60.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("var " + p_60.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_21 = node.getThird();
        this.WalkNode(value_21, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_29.value_type == 6 ) {
          wr.out(" = []", false);
        }
        if ( nn_29.value_type == 7 ) {
          wr.out(" = []", false);
        }
      }
      if ( (p_60.get().ref_cnt == 0) && (p_60.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_60.get().ref_cnt == 0) && (p_60.get().is_class_variable == false) ) {
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
    for ( int i_183 = 0; i_183 < fnDesc.params.size(); i_183++) {
      RangerAppParamDesc arg_33 = fnDesc.params.get(i_183);
      if ( i_183 > 0 ) {
        wr.out(",", false);
      }
      wr.out(arg_33.name + " ", false);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_19 = node.clDesc;
    if ( !cl_19.isPresent() ) {
      return;
    }
    final CodeWriter wr_12 = orig_wr;
    /** unused:  final CodeWriter importFork_6 = wr_12.fork()   **/ ;
    if ( wrote_header == false ) {
      wr_12.out("", true);
      wrote_header = true;
    }
    boolean b_extd = false;
    wr_12.out(("class " + cl_19.get().name) + " ", false);
    for ( int i_185 = 0; i_185 < cl_19.get().extends_classes.size(); i_185++) {
      String pName_10 = cl_19.get().extends_classes.get(i_185);
      if ( i_185 == 0 ) {
        wr_12.out(" extends ", false);
      }
      wr_12.out(pName_10, false);
      b_extd = true;
    }
    wr_12.out(" {", true);
    wr_12.indent(1);
    for ( int i_189 = 0; i_189 < cl_19.get().variables.size(); i_189++) {
      RangerAppParamDesc pvar_19 = cl_19.get().variables.get(i_189);
      this.writeClassVarDef(pvar_19.node.get(), ctx, wr_12);
    }
    wr_12.out("", true);
    wr_12.out("constructor(", false);
    if ( cl_19.get().has_constructor ) {
      final RangerAppFunctionDesc constr_22 = cl_19.get().constructor_fn.get();
      this.writeArgsDef(constr_22, ctx, wr_12);
    }
    wr_12.out(" ) {", true);
    wr_12.indent(1);
    if ( b_extd ) {
      wr_12.out("super()", true);
    }
    for ( int i_192 = 0; i_192 < cl_19.get().variables.size(); i_192++) {
      RangerAppParamDesc pvar_24 = cl_19.get().variables.get(i_192);
      this.writeVarInitDef(pvar_24.node.get(), ctx, wr_12);
    }
    if ( cl_19.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_27 = cl_19.get().constructor_fn;
      wr_12.newline();
      final RangerAppWriterContext subCtx_46 = constr_27.get().fnCtx.get();
      subCtx_46.is_function = true;
      this.WalkNode(constr_27.get().fnBody.get(), subCtx_46, wr_12);
    }
    wr_12.newline();
    wr_12.indent(-1);
    wr_12.out("}", true);
    for ( int i_195 = 0; i_195 < cl_19.get().defined_variants.size(); i_195++) {
      String fnVar_13 = cl_19.get().defined_variants.get(i_195);
      final Optional<RangerAppMethodVariants> mVs_13 = Optional.ofNullable(cl_19.get().method_variants.get(fnVar_13));
      for ( int i_202 = 0; i_202 < mVs_13.get().variants.size(); i_202++) {
        RangerAppFunctionDesc variant_28 = mVs_13.get().variants.get(i_202);
        wr_12.out("", true);
        wr_12.out(("" + variant_28.name) + "(", false);
        this.writeArgsDef(variant_28, ctx, wr_12);
        wr_12.out(") {", true);
        wr_12.indent(1);
        wr_12.newline();
        final RangerAppWriterContext subCtx_51 = variant_28.fnCtx.get();
        subCtx_51.is_function = true;
        this.WalkNode(variant_28.fnBody.get(), subCtx_51, wr_12);
        wr_12.newline();
        wr_12.indent(-1);
        wr_12.out("}", true);
      }
    }
    wr_12.indent(-1);
    wr_12.out("}", true);
    for ( int i_201 = 0; i_201 < cl_19.get().static_methods.size(); i_201++) {
      RangerAppFunctionDesc variant_33 = cl_19.get().static_methods.get(i_201);
      wr_12.out("", true);
      if ( variant_33.nameNode.get().hasFlag("main") ) {
        continue;
      } else {
        wr_12.out(((cl_19.get().name + ".") + variant_33.name) + " = function(", false);
        this.writeArgsDef(variant_33, ctx, wr_12);
        wr_12.out(") {", true);
      }
      wr_12.indent(1);
      wr_12.newline();
      final RangerAppWriterContext subCtx_54 = variant_33.fnCtx.get();
      subCtx_54.is_function = true;
      this.WalkNode(variant_33.fnBody.get(), subCtx_54, wr_12);
      wr_12.newline();
      wr_12.indent(-1);
      wr_12.out("}", true);
    }
    for ( int i_204 = 0; i_204 < cl_19.get().static_methods.size(); i_204++) {
      RangerAppFunctionDesc variant_36 = cl_19.get().static_methods.get(i_204);
      ctx.disableCurrentClass();
      wr_12.out("", true);
      if ( variant_36.nameNode.get().hasFlag("main") ) {
        wr_12.out("/* static JavaSript main routine */", false);
        wr_12.newline();
        this.WalkNode(variant_36.fnBody.get(), ctx, wr_12);
        wr_12.newline();
      }
    }
  }
}
