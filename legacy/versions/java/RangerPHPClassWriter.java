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
    /** unused:  final String encoded_str = ""   **/ ;
    final int str_length = node.string_value.length();
    String encoded_str_2 = "";
    int ii = 0;
    while (ii < str_length) {
      final int cc = (int)node.string_value.charAt(ii);
      switch (cc ) { 
        case 8 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(98))));
          break;
        case 9 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(116))));
          break;
        case 10 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(110))));
          break;
        case 12 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(102))));
          break;
        case 13 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(114))));
          break;
        case 34 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(34))));
          break;
        case 36 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(34))));
          break;
        case 92 : 
          encoded_str_2 = (encoded_str_2 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(92))));
          break;
        default: 
          encoded_str_2 = encoded_str_2 + ((new String( Character.toChars(cc))));
          break;
      }
      ii = ii + 1;
    }
    return encoded_str_2;
  }
  
  public void WriteScalarValue( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    switch (node.value_type ) { 
      case 2 : 
        wr.out("" + node.double_value, false);
        break;
      case 4 : 
        final String s = this.EncodeString(node, ctx, wr);
        wr.out(("\"" + s) + "\"", false);
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
        if ( i == 0 ) {
          final String part = node.ns.get(0);
          if ( part.equals("this") ) {
            wr.out("$this", false);
            continue;
          }
        }
        if ( i > 0 ) {
          wr.out("->", false);
        }
        if ( i == 0 ) {
          wr.out("$", false);
          if ( p.nameNode.get().hasFlag("optional") ) {
          }
          final String part_1 = node.ns.get(0);
          if ( (!part_1.equals("this")) && ctx.hasCurrentClass() ) {
            final Optional<RangerAppClassDesc> uc = ctx.getCurrentClass();
            final RangerAppClassDesc currC = uc.get();
            final Optional<RangerAppParamDesc> up = currC.findVariable(part_1);
            if ( up.isPresent() ) {
              if ( false == ctx.isInStatic() ) {
                wr.out(thisName + "->", false);
              }
            }
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
      wr.out("$", false);
      final String part_2 = node.ns.get(0);
      if ( (!part_2.equals("this")) && ctx.hasCurrentClass() ) {
        final Optional<RangerAppClassDesc> uc_1 = ctx.getCurrentClass();
        final RangerAppClassDesc currC_1 = uc_1.get();
        final Optional<RangerAppParamDesc> up_1 = currC_1.findVariable(part_2);
        if ( up_1.isPresent() ) {
          if ( false == ctx.isInStatic() ) {
            wr.out(thisName + "->", false);
          }
        }
      }
      final Optional<RangerAppParamDesc> p_1 = node.paramDesc;
      wr.out(p_1.get().compiledName, false);
      return;
    }
    boolean b_was_static = false;
    for ( int i_1 = 0; i_1 < node.ns.size(); i_1++) {
      String part_3 = node.ns.get(i_1);
      if ( i_1 > 0 ) {
        if ( (i_1 == 1) && b_was_static ) {
          wr.out("::", false);
        } else {
          wr.out("->", false);
        }
      }
      if ( i_1 == 0 ) {
        if ( ctx.hasClass(part_3) ) {
          b_was_static = true;
        } else {
          wr.out("$", false);
        }
        if ( (!part_3.equals("this")) && ctx.hasCurrentClass() ) {
          final Optional<RangerAppClassDesc> uc_2 = ctx.getCurrentClass();
          final RangerAppClassDesc currC_2 = uc_2.get();
          final Optional<RangerAppParamDesc> up_2 = currC_2.findVariable(part_3);
          if ( up_2.isPresent() ) {
            if ( false == ctx.isInStatic() ) {
              wr.out(thisName + "->", false);
            }
          }
        }
      }
      wr.out(this.adjustType(part_3), false);
    }
  }
  
  public void writeVarInitDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn = node.children.get(1);
      final Optional<RangerAppParamDesc> p = nn.paramDesc;
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("$this->" + p.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = array()", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = array()", false);
        }
      }
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("   **/", true);
        return;
      }
      wr.out(";", false);
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      wr.newline();
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn = node.children.get(1);
      final Optional<RangerAppParamDesc> p = nn.paramDesc;
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out("$" + p.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = array()", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = array()", false);
        }
      }
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  public void disabledVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn = node.children.get(1);
      final Optional<RangerAppParamDesc> p = nn.paramDesc;
      wr.out("$this->" + p.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = array()", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = array()", false);
        }
      }
      wr.out(";", false);
      wr.newline();
    }
  }
  
  public void CreateLambdaCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fName = node.children.get(0);
    final CodeNode givenArgs = node.children.get(1);
    this.WriteVRef(fName, ctx, wr);
    final RangerAppParamDesc param = ctx.getVariableDef(fName.vref);
    final CodeNode args = param.nameNode.get().expression_value.get().children.get(1);
    wr.out("(", false);
    for ( int i = 0; i < args.children.size(); i++) {
      CodeNode arg = args.children.get(i);
      final CodeNode n = givenArgs.children.get(i);
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      if ( arg.value_type != 0 ) {
        this.WalkNode(n, ctx, wr);
      }
    }
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(");", true);
    } else {
      wr.out(")", false);
    }
  }
  
  public void CreateLambda( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final RangerAppWriterContext lambdaCtx = node.lambda_ctx.get();
    /** unused:  final CodeNode fnNode = node.children.get(0)   **/ ;
    final CodeNode args = node.children.get(1);
    final CodeNode body = node.children.get(2);
    wr.out("function (", false);
    for ( int i = 0; i < args.children.size(); i++) {
      CodeNode arg = args.children.get(i);
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      this.WalkNode(arg, lambdaCtx, wr);
    }
    wr.out(") ", false);
    final boolean had_capture = false;
    if ( had_capture ) {
      wr.out(")", false);
    }
    wr.out(" {", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( int i_1 = 0; i_1 < body.children.size(); i_1++) {
      CodeNode item = body.children.get(i_1);
      this.WalkNode(item, lambdaCtx, wr);
    }
    wr.newline();
    for ( int i_2 = 0; i_2 < lambdaCtx.captured_variables.size(); i_2++) {
      String cname = lambdaCtx.captured_variables.get(i_2);
      wr.out("// captured var " + cname, true);
    }
    wr.indent(-1);
    wr.out("}", true);
  }
  
  public void writeClassVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn = node.children.get(1);
      final Optional<RangerAppParamDesc> p = nn.paramDesc;
      wr.out(("var $" + p.get().compiledName) + ";", true);
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i = 0; i < fnDesc.params.size(); i++) {
      RangerAppParamDesc arg = fnDesc.params.get(i);
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out((" $" + arg.name) + " ", false);
    }
  }
  
  public void writeFnCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasFnCall ) {
      final CodeNode fc = node.getFirst();
      this.WriteVRef(fc, ctx, wr);
      wr.out("(", false);
      final CodeNode givenArgs = node.getSecond();
      ctx.setInExpr();
      for ( int i = 0; i < node.fnDesc.get().params.size(); i++) {
        RangerAppParamDesc arg = node.fnDesc.get().params.get(i);
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs.children.size()) <= i ) {
          final Optional<CodeNode> defVal = arg.nameNode.get().getFlag("default");
          if ( defVal.isPresent() ) {
            final CodeNode fc_1 = defVal.get().vref_annotation.get().getFirst();
            this.WalkNode(fc_1, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        final CodeNode n = givenArgs.children.get(i);
        this.WalkNode(n, ctx, wr);
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
      final Optional<RangerAppClassDesc> cl = node.clDesc;
      /** unused:  final CodeNode fc = node.getSecond()   **/ ;
      wr.out(" new ", false);
      wr.out(node.clDesc.get().name, false);
      wr.out("(", false);
      final Optional<RangerAppFunctionDesc> constr = cl.get().constructor_fn;
      final CodeNode givenArgs = node.getThird();
      if ( constr.isPresent() ) {
        for ( int i = 0; i < constr.get().params.size(); i++) {
          RangerAppParamDesc arg = constr.get().params.get(i);
          final CodeNode n = givenArgs.children.get(i);
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (arg.nameNode.isPresent()) ) {
            this.WalkNode(n, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl = node.clDesc;
    if ( !cl.isPresent() ) {
      return;
    }
    final CodeWriter wr = orig_wr;
    /** unused:  final CodeWriter importFork = wr.fork()   **/ ;
    for ( int i = 0; i < cl.get().capturedLocals.size(); i++) {
      RangerAppParamDesc dd = cl.get().capturedLocals.get(i);
      if ( dd.is_class_variable == false ) {
        wr.out("// local captured " + dd.name, true);
        dd.node.get().disabled_node = true;
        cl.get().addVariable(dd);
        final Optional<RangerAppWriterContext> csubCtx = cl.get().ctx;
        csubCtx.get().defineVariable(dd.name, dd);
        dd.is_class_variable = true;
      }
    }
    if ( wrote_header == false ) {
      wr.out("<? ", true);
      wr.out("", true);
      wrote_header = true;
    }
    wr.out("class " + cl.get().name, false);
    Optional<RangerAppClassDesc> parentClass = Optional.empty();
    if ( (cl.get().extends_classes.size()) > 0 ) {
      wr.out(" extends ", false);
      for ( int i_1 = 0; i_1 < cl.get().extends_classes.size(); i_1++) {
        String pName = cl.get().extends_classes.get(i_1);
        wr.out(pName, false);
        parentClass = Optional.of(ctx.findClass(pName));
      }
    }
    wr.out(" { ", true);
    wr.indent(1);
    for ( int i_2 = 0; i_2 < cl.get().variables.size(); i_2++) {
      RangerAppParamDesc pvar = cl.get().variables.get(i_2);
      this.writeClassVarDef(pvar.node.get(), ctx, wr);
    }
    wr.out("", true);
    wr.out("function __construct(", false);
    if ( cl.get().has_constructor ) {
      final RangerAppFunctionDesc constr = cl.get().constructor_fn.get();
      this.writeArgsDef(constr, ctx, wr);
    }
    wr.out(" ) {", true);
    wr.indent(1);
    if ( parentClass.isPresent()) {
      wr.out("parent::__construct();", true);
    }
    for ( int i_3 = 0; i_3 < cl.get().variables.size(); i_3++) {
      RangerAppParamDesc pvar_1 = cl.get().variables.get(i_3);
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
    for ( int i_4 = 0; i_4 < cl.get().static_methods.size(); i_4++) {
      RangerAppFunctionDesc variant = cl.get().static_methods.get(i_4);
      wr.out("", true);
      if ( variant.nameNode.get().hasFlag("main") ) {
        continue;
      } else {
        wr.out("public static function ", false);
        wr.out(variant.compiledName + "(", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") {", true);
      }
      wr.indent(1);
      wr.newline();
      final RangerAppWriterContext subCtx_1 = variant.fnCtx.get();
      subCtx_1.is_function = true;
      subCtx_1.in_static_method = true;
      this.WalkNode(variant.fnBody.get(), subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( int i_5 = 0; i_5 < cl.get().defined_variants.size(); i_5++) {
      String fnVar = cl.get().defined_variants.get(i_5);
      final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(cl.get().method_variants.get(fnVar));
      for ( int i_6 = 0; i_6 < mVs.get().variants.size(); i_6++) {
        RangerAppFunctionDesc variant_1 = mVs.get().variants.get(i_6);
        wr.out("", true);
        wr.out(("function " + variant_1.compiledName) + "(", false);
        this.writeArgsDef(variant_1, ctx, wr);
        wr.out(") {", true);
        wr.indent(1);
        wr.newline();
        final RangerAppWriterContext subCtx_2 = variant_1.fnCtx.get();
        subCtx_2.is_function = true;
        this.WalkNode(variant_1.fnBody.get(), subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    for ( int i_7 = 0; i_7 < cl.get().static_methods.size(); i_7++) {
      RangerAppFunctionDesc variant_2 = cl.get().static_methods.get(i_7);
      ctx.disableCurrentClass();
      ctx.in_static_method = true;
      wr.out("", true);
      if ( variant_2.nameNode.get().hasFlag("main") && (variant_2.nameNode.get().code.get().filename.equals(ctx.getRootFile())) ) {
        wr.out("/* static PHP main routine */", false);
        wr.newline();
        this.WalkNode(variant_2.fnBody.get(), ctx, wr);
        wr.newline();
      }
    }
  }
}
