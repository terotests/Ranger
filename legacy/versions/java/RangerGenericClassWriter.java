import java.util.Optional;

class RangerGenericClassWriter { 
  public Optional<LiveCompiler> compiler = Optional.empty();
  
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
  
  public void CustomOperator( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void WriteSetterVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void writeArrayTypeDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void WriteEnum( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.eval_type == 11 ) {
      final String rootObjName = node.ns.get(0);
      final Optional<RangerAppEnum> e = ctx.getEnum(rootObjName);
      if ( e.isPresent() ) {
        final String enumName = node.ns.get(1);
        wr.out("" + ((Optional.ofNullable(e.get().values.get(enumName))).get()), false);
      } else {
        if ( node.hasParamDesc ) {
          final Optional<RangerAppParamDesc> pp = node.paramDesc;
          final Optional<CodeNode> nn = pp.get().nameNode;
          this.WriteVRef(nn.get(), ctx, wr);
        }
      }
    }
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
  
  public String getTypeString( String type_string ) {
    return type_string;
  }
  
  public void import_lib( String lib_name , RangerAppWriterContext ctx , CodeWriter wr ) {
    wr.addImport(lib_name);
  }
  
  public String getObjectTypeString( String type_string , RangerAppWriterContext ctx ) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
      case "string" : 
        return "String";
      case "chararray" : 
        return "byte[]";
      case "char" : 
        return "byte";
      case "boolean" : 
        return "Boolean";
      case "double" : 
        return "Double";
    }
    return type_string;
  }
  
  public void release_local_vars( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i = 0; i < ctx.localVarNames.size(); i++) {
      String n = ctx.localVarNames.get(i);
      final Optional<RangerAppParamDesc> p = Optional.ofNullable(ctx.localVariables.get(n));
      if ( p.get().ref_cnt == 0 ) {
        continue;
      }
      if ( p.get().isAllocatedType() ) {
        if ( 1 == p.get().getStrength() ) {
          if ( p.get().nameNode.get().eval_type == 7 ) {
          }
          if ( p.get().nameNode.get().eval_type == 6 ) {
          }
          if ( (p.get().nameNode.get().eval_type != 6) && (p.get().nameNode.get().eval_type != 7) ) {
          }
        }
        if ( 0 == p.get().getStrength() ) {
          if ( p.get().nameNode.get().eval_type == 7 ) {
          }
          if ( p.get().nameNode.get().eval_type == 6 ) {
          }
          if ( (p.get().nameNode.get().eval_type != 6) && (p.get().nameNode.get().eval_type != 7) ) {
          }
        }
      }
    }
    if ( ctx.is_function ) {
      return;
    }
    if ( ctx.parent.isPresent() ) {
      this.release_local_vars(node, ctx.parent.get(), wr);
    }
  }
  
  public void WalkNode( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    this.compiler.get().WalkNode(node, ctx, wr);
  }
  
  public void writeTypeDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    wr.out(node.type_name, false);
  }
  
  public void writeRawTypeDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    this.writeTypeDef(node, ctx, wr);
  }
  
  public String adjustType( String tn ) {
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
    for ( int i_1 = 0; i_1 < node.ns.size(); i_1++) {
      String part = node.ns.get(i_1);
      if ( i_1 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part), false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p = node.paramDesc;
      if ( p.get().set_cnt > 0 ) {
        wr.out("var " + p.get().name, false);
      } else {
        wr.out("const " + p.get().name, false);
      }
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
        wr.out(";", true);
      } else {
        wr.out(";", true);
      }
    }
  }
  
  public void CreateLambdaCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fName = node.children.get(0);
    final CodeNode args = node.children.get(1);
    this.WriteVRef(fName, ctx, wr);
    wr.out("(", false);
    for ( int i = 0; i < args.children.size(); i++) {
      CodeNode arg = args.children.get(i);
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      this.WalkNode(arg, ctx, wr);
    }
    wr.out(")", false);
    if ( ctx.expressionLevel() == 0 ) {
      wr.out(";", true);
    }
  }
  
  public void CreateLambda( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final RangerAppWriterContext lambdaCtx = node.lambda_ctx.get();
    final CodeNode args = node.children.get(1);
    final CodeNode body = node.children.get(2);
    wr.out("(", false);
    for ( int i = 0; i < args.children.size(); i++) {
      CodeNode arg = args.children.get(i);
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      this.WalkNode(arg, lambdaCtx, wr);
    }
    wr.out(")", false);
    wr.out(" => { ", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( int i_1 = 0; i_1 < body.children.size(); i_1++) {
      CodeNode item = body.children.get(i_1);
      this.WalkNode(item, lambdaCtx, wr);
    }
    wr.newline();
    wr.indent(-1);
    wr.out("}", true);
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
      wr.out("new " + node.clDesc.get().name, false);
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
  
  public void writeInterface( RangerAppClassDesc cl , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void disabledVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final Optional<RangerAppClassDesc> cl = node.clDesc;
    if ( !cl.isPresent() ) {
      return;
    }
    wr.out(("class " + cl.get().name) + " { ", true);
    wr.indent(1);
    for ( int i = 0; i < cl.get().variables.size(); i++) {
      RangerAppParamDesc pvar = cl.get().variables.get(i);
      wr.out(((("/* var " + pvar.name) + " => ") + pvar.nameNode.get().parent.get().getCode()) + " */ ", true);
    }
    for ( int i_1 = 0; i_1 < cl.get().static_methods.size(); i_1++) {
      RangerAppFunctionDesc pvar_1 = cl.get().static_methods.get(i_1);
      wr.out(("/* static " + pvar_1.name) + " */ ", true);
    }
    for ( int i_2 = 0; i_2 < cl.get().defined_variants.size(); i_2++) {
      String fnVar = cl.get().defined_variants.get(i_2);
      final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(cl.get().method_variants.get(fnVar));
      for ( int i_3 = 0; i_3 < mVs.get().variants.size(); i_3++) {
        RangerAppFunctionDesc variant = mVs.get().variants.get(i_3);
        wr.out(("function " + variant.name) + "() {", true);
        wr.indent(1);
        wr.newline();
        final RangerAppWriterContext subCtx = ctx.fork();
        this.WalkNode(variant.fnBody.get(), subCtx, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
  }
}
