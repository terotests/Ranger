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
        final String rootObjName = node.ns.get(0);
        final String enumName = node.ns.get(1);
        final Optional<RangerAppEnum> e = ctx.getEnum(rootObjName);
        if ( e.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e.get().values.get(enumName))).get()), false);
          return;
        }
      }
    }
    if ( (node.nsp.size()) > 0 ) {
      for ( int i = 0; i < node.nsp.size(); i++) {
        RangerAppParamDesc p = node.nsp.get(i);
        if ( i > 0 ) {
          wr.out(".", false);
        }
        if ( i == 0 ) {
          final String part = node.ns.get(0);
          if ( (!part.equals("this")) && ctx.isMemberVariable(part) ) {
            final Optional<RangerAppClassDesc> uc = ctx.getCurrentClass();
            final RangerAppClassDesc currC = uc.get();
            final Optional<RangerAppParamDesc> up = currC.findVariable(part);
            if ( up.isPresent() ) {
              wr.out("this.", false);
            }
          }
          if ( part.equals("this") ) {
            wr.out("this", false);
            continue;
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
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final String part_1 = node.ns.get(0);
      if ( (!part_1.equals("this")) && ctx.isMemberVariable(part_1) ) {
        final Optional<RangerAppClassDesc> uc_1 = ctx.getCurrentClass();
        final RangerAppClassDesc currC_1 = uc_1.get();
        final Optional<RangerAppParamDesc> up_1 = currC_1.findVariable(part_1);
        if ( up_1.isPresent() ) {
          wr.out("this.", false);
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
          wr.out(".", false);
        } else {
          wr.out(".", false);
        }
      }
      if ( i_1 == 0 ) {
        if ( ctx.hasClass(part_2) ) {
          b_was_static = true;
        } else {
          wr.out("", false);
        }
        if ( (!part_2.equals("this")) && ctx.isMemberVariable(part_2) ) {
          final Optional<RangerAppClassDesc> uc_2 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_2 = uc_2.get();
          final Optional<RangerAppParamDesc> up_2 = currC_2.findVariable(part_2);
          if ( up_2.isPresent() ) {
            wr.out("this.", false);
          }
        }
      }
      wr.out(this.adjustType(part_2), false);
    }
  }
  
  public void writeVarInitDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn = node.children.get(1);
      final Optional<RangerAppParamDesc> p = nn.paramDesc;
      final boolean remove_unused = ctx.hasCompilerFlag("remove-unused-class-vars");
      if ( (p.get().ref_cnt == 0) && (remove_unused || (p.get().is_class_variable == false)) ) {
        return;
      }
      boolean was_set = false;
      if ( (node.children.size()) > 2 ) {
        wr.out(("this." + p.get().compiledName) + " = ", false);
        ctx.setInExpr();
        final CodeNode value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
        was_set = true;
      } else {
        if ( nn.value_type == 6 ) {
          wr.out("this." + p.get().compiledName, false);
          wr.out(" = []", false);
          was_set = true;
        }
        if ( nn.value_type == 7 ) {
          wr.out("this." + p.get().compiledName, false);
          wr.out(" = {}", false);
          was_set = true;
        }
      }
      if ( was_set ) {
        wr.out(";", false);
        if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == true) ) {
          wr.out("     /** note: unused */", false);
        }
        wr.newline();
      }
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn = node.children.get(1);
      final Optional<RangerAppParamDesc> p = nn.paramDesc;
      /** unused:  final boolean opt_js = ctx.hasCompilerFlag("optimize-js")   **/ ;
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      boolean has_value = false;
      if ( (node.children.size()) > 2 ) {
        has_value = true;
      }
      if ( ((p.get().set_cnt > 0) || p.get().is_class_variable) || (has_value == false) ) {
        wr.out("let " + p.get().compiledName, false);
      } else {
        wr.out("const " + p.get().compiledName, false);
      }
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = []", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = {}", false);
        }
      }
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("   **/ ", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  public void writeClassVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i = 0; i < fnDesc.params.size(); i++) {
      RangerAppParamDesc arg = fnDesc.params.get(i);
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg.name, false);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl = node.clDesc;
    if ( cl.get().is_interface ) {
      orig_wr.out("// interface : " + cl.get().name, true);
      return;
    }
    if ( !cl.isPresent() ) {
      return;
    }
    final CodeWriter wr = orig_wr;
    /** unused:  final CodeWriter importFork = wr.fork()   **/ ;
    if ( wrote_header == false ) {
      wr.out("", true);
      wrote_header = true;
    }
    boolean b_extd = false;
    wr.out(("class " + cl.get().name) + " ", false);
    for ( int i = 0; i < cl.get().extends_classes.size(); i++) {
      String pName = cl.get().extends_classes.get(i);
      if ( i == 0 ) {
        wr.out(" extends ", false);
      }
      wr.out(pName, false);
      b_extd = true;
    }
    wr.out(" {", true);
    wr.indent(1);
    for ( int i_1 = 0; i_1 < cl.get().variables.size(); i_1++) {
      RangerAppParamDesc pvar = cl.get().variables.get(i_1);
      this.writeClassVarDef(pvar.node.get(), ctx, wr);
    }
    wr.out("constructor(", false);
    if ( cl.get().has_constructor ) {
      final RangerAppFunctionDesc constr = cl.get().constructor_fn.get();
      this.writeArgsDef(constr, ctx, wr);
    }
    wr.out(") {", true);
    wr.indent(1);
    if ( b_extd ) {
      wr.out("super()", true);
    }
    for ( int i_2 = 0; i_2 < cl.get().variables.size(); i_2++) {
      RangerAppParamDesc pvar_1 = cl.get().variables.get(i_2);
      this.writeVarInitDef(pvar_1.node.get(), ctx, wr);
    }
    if ( cl.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_1 = cl.get().constructor_fn;
      wr.newline();
      final RangerAppWriterContext subCtx = constr_1.get().fnCtx.get();
      subCtx.is_function = true;
      this.WalkNode(constr_1.get().fnBody.get(), subCtx, wr);
    }
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
    for ( int i_3 = 0; i_3 < cl.get().defined_variants.size(); i_3++) {
      String fnVar = cl.get().defined_variants.get(i_3);
      final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(cl.get().method_variants.get(fnVar));
      for ( int i_4 = 0; i_4 < mVs.get().variants.size(); i_4++) {
        RangerAppFunctionDesc variant = mVs.get().variants.get(i_4);
        wr.out(("" + variant.compiledName) + " (", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        wr.newline();
        final RangerAppWriterContext subCtx_1 = variant.fnCtx.get();
        subCtx_1.is_function = true;
        this.WalkNode(variant.fnBody.get(), subCtx_1, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    for ( int i_5 = 0; i_5 < cl.get().static_methods.size(); i_5++) {
      RangerAppFunctionDesc variant_1 = cl.get().static_methods.get(i_5);
      if ( variant_1.nameNode.get().hasFlag("main") ) {
        continue;
      } else {
        wr.out(((cl.get().name + ".") + variant_1.compiledName) + " = function(", false);
        this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") {", true);
      }
      wr.indent(1);
      wr.newline();
      final RangerAppWriterContext subCtx_2 = variant_1.fnCtx.get();
      subCtx_2.is_function = true;
      this.WalkNode(variant_1.fnBody.get(), subCtx_2, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( int i_6 = 0; i_6 < cl.get().static_methods.size(); i_6++) {
      RangerAppFunctionDesc variant_2 = cl.get().static_methods.get(i_6);
      ctx.disableCurrentClass();
      if ( variant_2.nameNode.get().hasFlag("main") && (variant_2.nameNode.get().code.get().filename.equals(ctx.getRootFile())) ) {
        wr.out("/* static JavaSript main routine */", false);
        wr.newline();
        wr.out("function __js_main() {", true);
        wr.indent(1);
        this.WalkNode(variant_2.fnBody.get(), ctx, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
        wr.out("__js_main();", true);
      }
    }
  }
}
