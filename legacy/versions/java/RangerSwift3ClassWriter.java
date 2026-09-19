import java.util.Optional;
import java.util.*;

class RangerSwift3ClassWriter extends RangerGenericClassWriter { 
  public boolean header_created = false;
  
  public String adjustType( String tn ) {
    if ( tn.equals("this") ) {
      return "self";
    }
    return tn;
  }
  
  public String getObjectTypeString( String type_string , RangerAppWriterContext ctx ) {
    switch (type_string ) { 
      case "int" : 
        return "Int";
      case "string" : 
        return "String";
      case "charbuffer" : 
        return "[UInt8]";
      case "char" : 
        return "UInt8";
      case "boolean" : 
        return "Bool";
      case "double" : 
        return "Double";
    }
    return type_string;
  }
  
  public String getTypeString( String type_string ) {
    switch (type_string ) { 
      case "int" : 
        return "Int";
      case "string" : 
        return "String";
      case "charbuffer" : 
        return "[UInt8]";
      case "char" : 
        return "UInt8";
      case "boolean" : 
        return "Bool";
      case "double" : 
        return "Double";
    }
    return type_string;
  }
  
  public void writeTypeDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    int v_type = node.value_type;
    String t_name = node.type_name;
    String a_name = node.array_type;
    String k_name = node.key_type;
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.length()) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.length()) > 0 ) {
        a_name = node.eval_array_type;
      }
      if ( (node.eval_key_type.length()) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    switch (v_type ) { 
      case 15 : 
        final CodeNode rv = node.expression_value.get().children.get(0);
        final CodeNode sec = node.expression_value.get().children.get(1);
        /** unused:  final CodeNode fc = sec.getFirst()   **/ ;
        wr.out("(", false);
        for ( int i = 0; i < sec.children.size(); i++) {
          CodeNode arg = sec.children.get(i);
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          wr.out(" _ : ", false);
          this.writeTypeDef(arg, ctx, wr);
        }
        wr.out(") -> ", false);
        this.writeTypeDef(rv, ctx, wr);
        break;
      case 11 : 
        wr.out("Int", false);
        break;
      case 3 : 
        wr.out("Int", false);
        break;
      case 2 : 
        wr.out("Double", false);
        break;
      case 4 : 
        wr.out("String", false);
        break;
      case 12 : 
        wr.out("UInt8", false);
        break;
      case 13 : 
        wr.out("[UInt8]", false);
        break;
      case 5 : 
        wr.out("Bool", false);
        break;
      case 7 : 
        wr.out(((("[" + this.getObjectTypeString(k_name, ctx)) + ":") + this.getObjectTypeString(a_name, ctx)) + "]", false);
        break;
      case 6 : 
        wr.out(("[" + this.getObjectTypeString(a_name, ctx)) + "]", false);
        break;
      default: 
        if ( t_name.equals("void") ) {
          wr.out("Void", false);
          return;
        }
        wr.out(this.getTypeString(t_name), false);
        break;
    }
    if ( node.hasFlag("optional") ) {
      wr.out("?", false);
    }
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
          wr.out(nn.get().vref, false);
        }
      }
    }
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.vref.equals("this") ) {
      wr.out("self", false);
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
    final int max_len = node.ns.size();
    if ( (node.nsp.size()) > 0 ) {
      for ( int i = 0; i < node.nsp.size(); i++) {
        RangerAppParamDesc p = node.nsp.get(i);
        if ( i == 0 ) {
          final String part = node.ns.get(0);
          if ( part.equals("this") ) {
            wr.out("self", false);
            continue;
          }
        }
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
        if ( i < (max_len - 1) ) {
          if ( p.nameNode.get().hasFlag("optional") ) {
            wr.out("!", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p_1 = node.paramDesc;
      wr.out(p_1.get().compiledName, false);
      return;
    }
    for ( int i_1 = 0; i_1 < node.ns.size(); i_1++) {
      String part_1 = node.ns.get(i_1);
      if ( i_1 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_1), false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn = node.children.get(1);
      final Optional<RangerAppParamDesc> p = nn.paramDesc;
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p.get().set_cnt > 0) || p.get().is_class_variable ) {
        wr.out(("var " + p.get().compiledName) + " : ", false);
      } else {
        wr.out(("let " + p.get().compiledName) + " : ", false);
      }
      this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = ", false);
          this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = ", false);
          this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
        }
      }
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("   **/ ", true);
      } else {
        wr.newline();
      }
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i = 0; i < fnDesc.params.size(); i++) {
      RangerAppParamDesc arg = fnDesc.params.get(i);
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg.name + " : ", false);
      this.writeTypeDef(arg.nameNode.get(), ctx, wr);
    }
  }
  
  public void writeFnCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasFnCall ) {
      final CodeNode fc = node.getFirst();
      final Optional<CodeNode> fnName = node.fnDesc.get().nameNode;
      if ( ctx.expressionLevel() == 0 ) {
        if ( !fnName.get().type_name.equals("void") ) {
          wr.out("_ = ", false);
        }
      }
      this.WriteVRef(fc, ctx, wr);
      wr.out("(", false);
      ctx.setInExpr();
      final CodeNode givenArgs = node.getSecond();
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
        wr.out(arg.name + " : ", false);
        this.WalkNode(n, ctx, wr);
      }
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.newline();
      }
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
    wr.out(")", false);
    if ( ctx.expressionLevel() == 0 ) {
      wr.out("", true);
    }
  }
  
  public void CreateLambda( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final RangerAppWriterContext lambdaCtx = node.lambda_ctx.get();
    final CodeNode fnNode = node.children.get(0);
    final CodeNode args = node.children.get(1);
    final CodeNode body = node.children.get(2);
    wr.out("{ (", false);
    for ( int i = 0; i < args.children.size(); i++) {
      CodeNode arg = args.children.get(i);
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg.vref, false);
    }
    wr.out(") ->  ", false);
    this.writeTypeDef(fnNode, lambdaCtx, wr);
    wr.out(" in ", true);
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
    wr.out("}", false);
  }
  
  public void writeNewCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasNewOper ) {
      final Optional<RangerAppClassDesc> cl = node.clDesc;
      /** unused:  final CodeNode fc = node.getSecond()   **/ ;
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
          wr.out(arg.name + " : ", false);
          this.WalkNode(n, ctx, wr);
        }
      }
      wr.out(")", false);
    }
  }
  
  public boolean haveSameSig( RangerAppFunctionDesc fn1 , RangerAppFunctionDesc fn2 , RangerAppWriterContext ctx ) {
    if ( !fn1.name.equals(fn2.name) ) {
      return false;
    }
    final RangerArgMatch match = new RangerArgMatch();
    final CodeNode n1 = fn1.nameNode.get();
    final CodeNode n2 = fn1.nameNode.get();
    if ( match.doesDefsMatch(n1, n2, ctx) == false ) {
      return false;
    }
    if ( (fn1.params.size()) != (fn2.params.size()) ) {
      return false;
    }
    for ( int i = 0; i < fn1.params.size(); i++) {
      RangerAppParamDesc p = fn1.params.get(i);
      final RangerAppParamDesc p2 = fn2.params.get(i);
      if ( match.doesDefsMatch((p.nameNode.get()), (p2.nameNode.get()), ctx) == false ) {
        return false;
      }
    }
    return true;
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final Optional<RangerAppClassDesc> cl = node.clDesc;
    if ( !cl.isPresent() ) {
      return;
    }
    HashMap<String,Boolean> declaredVariable = new HashMap<String,Boolean>();
    HashMap<String,Boolean> declaredFunction = new HashMap<String,Boolean>();
    if ( (cl.get().extends_classes.size()) > 0 ) {
      for ( int i = 0; i < cl.get().extends_classes.size(); i++) {
        String pName = cl.get().extends_classes.get(i);
        final RangerAppClassDesc pC = ctx.findClass(pName);
        for ( int i_1 = 0; i_1 < pC.variables.size(); i_1++) {
          RangerAppParamDesc pvar = pC.variables.get(i_1);
          declaredVariable.put(pvar.name, true);
        }
        for ( int i_2 = 0; i_2 < pC.defined_variants.size(); i_2++) {
          String fnVar = pC.defined_variants.get(i_2);
          final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(pC.method_variants.get(fnVar));
          for ( int i_3 = 0; i_3 < mVs.get().variants.size(); i_3++) {
            RangerAppFunctionDesc variant = mVs.get().variants.get(i_3);
            declaredFunction.put(variant.compiledName, true);
          }
        }
      }
    }
    if ( header_created == false ) {
      wr.createTag("utilities");
      header_created = true;
    }
    wr.out(((("func ==(l: " + cl.get().name) + ", r: ") + cl.get().name) + ") -> Bool {", true);
    wr.indent(1);
    wr.out("return l == r", true);
    wr.indent(-1);
    wr.out("}", true);
    wr.out("class " + cl.get().name, false);
    Optional<RangerAppClassDesc> parentClass = Optional.empty();
    if ( (cl.get().extends_classes.size()) > 0 ) {
      wr.out(" : ", false);
      for ( int i_4 = 0; i_4 < cl.get().extends_classes.size(); i_4++) {
        String pName_1 = cl.get().extends_classes.get(i_4);
        wr.out(pName_1, false);
        parentClass = Optional.of(ctx.findClass(pName_1));
      }
    } else {
      wr.out(" : Equatable ", false);
    }
    wr.out(" { ", true);
    wr.indent(1);
    for ( int i_5 = 0; i_5 < cl.get().variables.size(); i_5++) {
      RangerAppParamDesc pvar_1 = cl.get().variables.get(i_5);
      if ( declaredVariable.containsKey(pvar_1.name) ) {
        wr.out("// WAS DECLARED : " + pvar_1.name, true);
        continue;
      }
      this.writeVarDef(pvar_1.node.get(), ctx, wr);
    }
    if ( cl.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr = cl.get().constructor_fn;
      boolean b_must_override = false;
      if ( parentClass.isPresent()) {
        if ( (constr.get().params.size()) == 0 ) {
          b_must_override = true;
        } else {
          if ( parentClass.get().has_constructor ) {
            final RangerAppFunctionDesc p_constr = parentClass.get().constructor_fn.get();
            if ( this.haveSameSig((constr.get()), p_constr, ctx) ) {
              b_must_override = true;
            }
          }
        }
      }
      if ( b_must_override ) {
        wr.out("override ", false);
      }
      wr.out("init(", false);
      this.writeArgsDef(constr.get(), ctx, wr);
      wr.out(" ) {", true);
      wr.indent(1);
      if ( parentClass.isPresent()) {
        wr.out("super.init()", true);
      }
      wr.newline();
      final RangerAppWriterContext subCtx = constr.get().fnCtx.get();
      subCtx.is_function = true;
      this.WalkNode(constr.get().fnBody.get(), subCtx, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( int i_6 = 0; i_6 < cl.get().static_methods.size(); i_6++) {
      RangerAppFunctionDesc variant_1 = cl.get().static_methods.get(i_6);
      if ( variant_1.nameNode.get().hasFlag("main") ) {
        continue;
      }
      wr.out(("static func " + variant_1.compiledName) + "(", false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") -> ", false);
      this.writeTypeDef(variant_1.nameNode.get(), ctx, wr);
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      final RangerAppWriterContext subCtx_1 = variant_1.fnCtx.get();
      subCtx_1.is_function = true;
      this.WalkNode(variant_1.fnBody.get(), subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( int i_7 = 0; i_7 < cl.get().defined_variants.size(); i_7++) {
      String fnVar_1 = cl.get().defined_variants.get(i_7);
      final Optional<RangerAppMethodVariants> mVs_1 = Optional.ofNullable(cl.get().method_variants.get(fnVar_1));
      for ( int i_8 = 0; i_8 < mVs_1.get().variants.size(); i_8++) {
        RangerAppFunctionDesc variant_2 = mVs_1.get().variants.get(i_8);
        if ( declaredFunction.containsKey(variant_2.name) ) {
          wr.out("override ", false);
        }
        wr.out(("func " + variant_2.compiledName) + "(", false);
        this.writeArgsDef(variant_2, ctx, wr);
        wr.out(") -> ", false);
        this.writeTypeDef(variant_2.nameNode.get(), ctx, wr);
        wr.out(" {", true);
        wr.indent(1);
        wr.newline();
        final RangerAppWriterContext subCtx_2 = variant_2.fnCtx.get();
        subCtx_2.is_function = true;
        this.WalkNode(variant_2.fnBody.get(), subCtx_2, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    for ( int i_9 = 0; i_9 < cl.get().static_methods.size(); i_9++) {
      RangerAppFunctionDesc variant_3 = cl.get().static_methods.get(i_9);
      if ( variant_3.nameNode.get().hasFlag("main") && (variant_3.nameNode.get().code.get().filename.equals(ctx.getRootFile())) ) {
        wr.newline();
        wr.out("func __main__swift() {", true);
        wr.indent(1);
        final RangerAppWriterContext subCtx_3 = variant_3.fnCtx.get();
        subCtx_3.is_function = true;
        this.WalkNode(variant_3.fnBody.get(), subCtx_3, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
        wr.out("// call the main function", true);
        wr.out("__main__swift()", true);
      }
    }
  }
}
