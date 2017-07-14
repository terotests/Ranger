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
        final String s = this.EncodeString(node, ctx, wr);
        wr.out(("std::string(" + (("\"" + s) + "\"")) + ")", false);
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
    if ( ctx.isEnumDefined(type_string) ) {
      return "int";
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
    if ( ctx.isEnumDefined(type_string) ) {
      return "int";
    }
    return type_string;
  }
  
  public void writePtr( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.type_name.equals("void") ) {
      return;
    }
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
        wr.out("std::function<", false);
        this.writeTypeDef(rv, ctx, wr);
        wr.out("(", false);
        for ( int i = 0; i < sec.children.size(); i++) {
          CodeNode arg = sec.children.get(i);
          if ( i > 0 ) {
            wr.out(", ", false);
          }
          this.writeTypeDef(arg, ctx, wr);
        }
        wr.out(")>", false);
        break;
      case 11 : 
        wr.out("int", false);
        break;
      case 3 : 
        if ( node.hasFlag("optional") ) {
          wr.out(" r_optional_primitive<int> ", false);
        } else {
          wr.out("int", false);
        }
        break;
      case 12 : 
        wr.out("char", false);
        break;
      case 13 : 
        wr.out("const char*", false);
        break;
      case 2 : 
        if ( node.hasFlag("optional") ) {
          wr.out(" r_optional_primitive<double> ", false);
        } else {
          wr.out("double", false);
        }
        break;
      case 4 : 
        wr.addImport("<string>");
        wr.out("std::string", false);
        break;
      case 5 : 
        wr.out("bool", false);
        break;
      case 7 : 
        wr.out(((("std::map<" + this.getObjectTypeString(k_name, ctx)) + ",") + this.getObjectTypeString(a_name, ctx)) + ">", false);
        wr.addImport("<map>");
        break;
      case 6 : 
        wr.out(("std::vector<" + this.getObjectTypeString(a_name, ctx)) + ">", false);
        wr.addImport("<vector>");
        break;
      default: 
        if ( node.type_name.equals("void") ) {
          wr.out("void", false);
          return;
        }
        if ( ctx.isDefinedClass(t_name) ) {
          final RangerAppClassDesc cc = ctx.findClass(t_name);
          wr.out("std::shared_ptr<", false);
          wr.out(cc.name, false);
          wr.out(">", false);
          return;
        }
        if ( node.hasFlag("optional") ) {
          wr.out("std::shared_ptr<std::vector<", false);
          wr.out(this.getTypeString2(t_name, ctx), false);
          wr.out(">", false);
          return;
        }
        wr.out(this.getTypeString2(t_name, ctx), false);
        break;
    }
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.vref.equals("this") ) {
      wr.out("shared_from_this()", false);
      return;
    }
    if ( node.eval_type == 11 ) {
      final String rootObjName = node.ns.get(0);
      if ( (node.ns.size()) > 1 ) {
        final String enumName = node.ns.get(1);
        final Optional<RangerAppEnum> e = ctx.getEnum(rootObjName);
        if ( e.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e.get().values.get(enumName))).get()), false);
          return;
        }
      }
    }
    boolean had_static = false;
    if ( (node.nsp.size()) > 0 ) {
      for ( int i = 0; i < node.nsp.size(); i++) {
        RangerAppParamDesc p = node.nsp.get(i);
        if ( i > 0 ) {
          if ( had_static ) {
            wr.out("::", false);
          } else {
            wr.out("->", false);
          }
        }
        if ( i == 0 ) {
          final String part = node.ns.get(0);
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
        if ( p.isClass() ) {
          had_static = true;
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
        if ( had_static ) {
          wr.out("::", false);
        } else {
          wr.out("->", false);
        }
      }
      if ( ctx.hasClass(part_1) ) {
        had_static = true;
      } else {
        had_static = false;
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
        wr.out("", false);
      } else {
        wr.out("", false);
      }
      this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
      wr.out(" ", false);
      wr.out(p.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
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
      if ( (p.get().set_cnt > 0) || p.get().is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("", false);
      }
      wr.out(p.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
      }
      wr.out(";", false);
      wr.newline();
    }
  }
  
  public void CustomOperator( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fc = node.getFirst();
    final String cmd = fc.vref;
    if ( cmd.equals("return") ) {
      if ( ctx.isInMain() ) {
        wr.out("return 0;", true);
      } else {
        wr.out("return;", true);
      }
      return;
    }
    if ( cmd.equals("switch") ) {
      final CodeNode condition = node.getSecond();
      final CodeNode case_nodes = node.getThird();
      wr.newline();
      final RangerAppParamDesc p = new RangerAppParamDesc();
      p.name = "caseMatched";
      p.value_type = 5;
      ctx.defineVariable(p.name, p);
      wr.out(("bool " + p.compiledName) + " = false;", true);
      for ( int i = 0; i < case_nodes.children.size(); i++) {
        CodeNode ch = case_nodes.children.get(i);
        final CodeNode blockName = ch.getFirst();
        if ( blockName.vref.equals("default") ) {
          final CodeNode defBlock = ch.getSecond();
          wr.out("if( ! ", false);
          wr.out(p.compiledName, false);
          wr.out(") {", true);
          wr.indent(1);
          this.WalkNode(defBlock, ctx, wr);
          wr.indent(-1);
          wr.out("}", true);
        } else {
          final CodeNode caseValue = ch.getSecond();
          final CodeNode caseBlock = ch.getThird();
          wr.out("if( ", false);
          this.WalkNode(condition, ctx, wr);
          wr.out(" == ", false);
          this.WalkNode(caseValue, ctx, wr);
          wr.out(") {", true);
          wr.indent(1);
          wr.out(p.compiledName + " = true;", true);
          this.WalkNode(caseBlock, ctx, wr);
          wr.indent(-1);
          wr.out("}", true);
        }
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
      wr.out(";", true);
    }
  }
  
  public void CreateLambda( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final RangerAppWriterContext lambdaCtx = node.lambda_ctx.get();
    /** unused:  final CodeNode fnNode = node.children.get(0)   **/ ;
    final CodeNode args = node.children.get(1);
    final CodeNode body = node.children.get(2);
    wr.out("[this", false);
    wr.out("](", false);
    for ( int i = 0; i < args.children.size(); i++) {
      CodeNode arg = args.children.get(i);
      if ( i > 0 ) {
        wr.out(", ", false);
      }
      this.writeTypeDef(arg, ctx, wr);
      wr.out(" ", false);
      wr.out(arg.vref, false);
    }
    wr.out(") mutable { ", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( int i_1 = 0; i_1 < body.children.size(); i_1++) {
      CodeNode item = body.children.get(i_1);
      this.WalkNode(item, lambdaCtx, wr);
    }
    wr.newline();
    wr.indent(-1);
    wr.out("}", false);
  }
  
  public void writeCppHeaderVar( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr , boolean do_initialize ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn = node.children.get(1);
      final Optional<RangerAppParamDesc> p = nn.paramDesc;
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p.get().set_cnt > 0) || p.get().is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("", false);
      }
      this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
      wr.out(" ", false);
      wr.out(p.get().compiledName, false);
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
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i = 0; i < fnDesc.params.size(); i++) {
      RangerAppParamDesc arg = fnDesc.params.get(i);
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.writeTypeDef(arg.nameNode.get(), ctx, wr);
      wr.out((" " + arg.name) + " ", false);
    }
  }
  
  public void writeFnCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasFnCall ) {
      final CodeNode fc = node.getFirst();
      this.WriteVRef(fc, ctx, wr);
      wr.out("(", false);
      ctx.setInExpr();
      final CodeNode givenArgs = node.getSecond();
      for ( int i = 0; i < node.fnDesc.get().params.size(); i++) {
        RangerAppParamDesc arg = node.fnDesc.get().params.get(i);
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        if ( i >= (givenArgs.children.size()) ) {
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
      wr.out(" std::make_shared<", false);
      wr.out(node.clDesc.get().name, false);
      wr.out(">(", false);
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
  
  public void writeClassHeader( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final Optional<RangerAppClassDesc> cl = node.clDesc;
    if ( !cl.isPresent() ) {
      return;
    }
    wr.out("class " + cl.get().name, false);
    Optional<RangerAppClassDesc> parentClass = Optional.empty();
    if ( (cl.get().extends_classes.size()) > 0 ) {
      wr.out(" : ", false);
      for ( int i = 0; i < cl.get().extends_classes.size(); i++) {
        String pName = cl.get().extends_classes.get(i);
        wr.out("public ", false);
        wr.out(pName, false);
        parentClass = Optional.of(ctx.findClass(pName));
      }
    } else {
      wr.out((" : public std::enable_shared_from_this<" + cl.get().name) + "> ", false);
    }
    wr.out(" { ", true);
    wr.indent(1);
    wr.out("public :", true);
    wr.indent(1);
    for ( int i_1 = 0; i_1 < cl.get().variables.size(); i_1++) {
      RangerAppParamDesc pvar = cl.get().variables.get(i_1);
      this.writeCppHeaderVar(pvar.node.get(), ctx, wr, false);
    }
    wr.out("/* class constructor */ ", true);
    wr.out(cl.get().name + "(", false);
    if ( cl.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr = cl.get().constructor_fn;
      this.writeArgsDef(constr.get(), ctx, wr);
    }
    wr.out(" );", true);
    for ( int i_2 = 0; i_2 < cl.get().static_methods.size(); i_2++) {
      RangerAppFunctionDesc variant = cl.get().static_methods.get(i_2);
      if ( i_2 == 0 ) {
        wr.out("/* static methods */ ", true);
      }
      wr.out("static ", false);
      this.writeTypeDef(variant.nameNode.get(), ctx, wr);
      wr.out((" " + variant.compiledName) + "(", false);
      this.writeArgsDef(variant, ctx, wr);
      wr.out(");", true);
    }
    for ( int i_3 = 0; i_3 < cl.get().defined_variants.size(); i_3++) {
      String fnVar = cl.get().defined_variants.get(i_3);
      if ( i_3 == 0 ) {
        wr.out("/* instance methods */ ", true);
      }
      final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(cl.get().method_variants.get(fnVar));
      for ( int i_4 = 0; i_4 < mVs.get().variants.size(); i_4++) {
        RangerAppFunctionDesc variant_1 = mVs.get().variants.get(i_4);
        if ( cl.get().is_inherited ) {
          wr.out("virtual ", false);
        }
        this.writeTypeDef(variant_1.nameNode.get(), ctx, wr);
        wr.out((" " + variant_1.compiledName) + "(", false);
        this.writeArgsDef(variant_1, ctx, wr);
        wr.out(");", true);
      }
    }
    wr.indent(-1);
    wr.indent(-1);
    wr.out("};", true);
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl = node.clDesc;
    final CodeWriter wr = orig_wr;
    if ( !cl.isPresent() ) {
      return;
    }
    if ( header_created == false ) {
      wr.createTag("c++Imports");
      wr.out("", true);
      wr.out("// define classes here to avoid compiler errors", true);
      wr.createTag("c++ClassDefs");
      wr.out("", true);
      wr.createTag("utilities");
      wr.out("", true);
      wr.out("// header definitions", true);
      wr.createTag("c++Header");
      wr.out("", true);
      header_created = true;
    }
    final CodeWriter classWriter = orig_wr.getTag("c++ClassDefs");
    final CodeWriter headerWriter = orig_wr.getTag("c++Header");
    /** unused:  final String projectName = "project"   **/ ;
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
    classWriter.out(("class " + cl.get().name) + ";", true);
    this.writeClassHeader(node, ctx, headerWriter);
    wr.out("", true);
    wr.out(((cl.get().name + "::") + cl.get().name) + "(", false);
    if ( cl.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr = cl.get().constructor_fn;
      this.writeArgsDef(constr.get(), ctx, wr);
    }
    wr.out(" ) ", false);
    if ( (cl.get().extends_classes.size()) > 0 ) {
      for ( int i_1 = 0; i_1 < cl.get().extends_classes.size(); i_1++) {
        String pName = cl.get().extends_classes.get(i_1);
        final RangerAppClassDesc pcc = ctx.findClass(pName);
        if ( pcc.has_constructor ) {
          wr.out((" : " + pcc.name) + "(", false);
          final Optional<RangerAppFunctionDesc> constr_1 = cl.get().constructor_fn;
          for ( int i_2 = 0; i_2 < constr_1.get().params.size(); i_2++) {
            RangerAppParamDesc arg = constr_1.get().params.get(i_2);
            if ( i_2 > 0 ) {
              wr.out(",", false);
            }
            wr.out(" ", false);
            wr.out((" " + arg.name) + " ", false);
          }
          wr.out(")", false);
        }
      }
    }
    wr.out("{", true);
    wr.indent(1);
    for ( int i_3 = 0; i_3 < cl.get().variables.size(); i_3++) {
      RangerAppParamDesc pvar = cl.get().variables.get(i_3);
      final CodeNode nn = pvar.node.get();
      if ( pvar.is_captured ) {
        continue;
      }
      if ( (nn.children.size()) > 2 ) {
        final CodeNode valueNode = nn.children.get(2);
        wr.out(("this->" + pvar.compiledName) + " = ", false);
        this.WalkNode(valueNode, ctx, wr);
        wr.out(";", true);
      }
    }
    if ( cl.get().has_constructor ) {
      final RangerAppFunctionDesc constr_2 = cl.get().constructor_fn.get();
      wr.newline();
      final RangerAppWriterContext subCtx = constr_2.fnCtx.get();
      subCtx.is_function = true;
      this.WalkNode(constr_2.fnBody.get(), subCtx, wr);
      wr.newline();
    }
    wr.indent(-1);
    wr.out("}", true);
    for ( int i_4 = 0; i_4 < cl.get().static_methods.size(); i_4++) {
      RangerAppFunctionDesc variant = cl.get().static_methods.get(i_4);
      if ( variant.nameNode.get().hasFlag("main") ) {
        continue;
      }
      wr.out("", true);
      this.writeTypeDef(variant.nameNode.get(), ctx, wr);
      wr.out(" ", false);
      wr.out((" " + cl.get().name) + "::", false);
      wr.out(variant.compiledName + "(", false);
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
    for ( int i_5 = 0; i_5 < cl.get().defined_variants.size(); i_5++) {
      String fnVar = cl.get().defined_variants.get(i_5);
      final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(cl.get().method_variants.get(fnVar));
      for ( int i_6 = 0; i_6 < mVs.get().variants.size(); i_6++) {
        RangerAppFunctionDesc variant_1 = mVs.get().variants.get(i_6);
        wr.out("", true);
        this.writeTypeDef(variant_1.nameNode.get(), ctx, wr);
        wr.out(" ", false);
        wr.out((" " + cl.get().name) + "::", false);
        wr.out(variant_1.compiledName + "(", false);
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
    for ( int i_7 = 0; i_7 < cl.get().static_methods.size(); i_7++) {
      RangerAppFunctionDesc variant_2 = cl.get().static_methods.get(i_7);
      if ( variant_2.nameNode.get().hasFlag("main") && (variant_2.nameNode.get().code.get().filename.equals(ctx.getRootFile())) ) {
        wr.out("", true);
        wr.out("int main(int argc, char* argv[]) {", true);
        wr.indent(1);
        wr.newline();
        final RangerAppWriterContext subCtx_3 = variant_2.fnCtx.get();
        subCtx_3.in_main = true;
        subCtx_3.is_function = true;
        this.WalkNode(variant_2.fnBody.get(), subCtx_3, wr);
        wr.newline();
        wr.out("return 0;", true);
        wr.indent(-1);
        wr.out("}", true);
      }
    }
  }
}
