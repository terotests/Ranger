import java.util.*;
import java.util.Optional;
import java.io.*;

class RangerJava7ClassWriter extends RangerGenericClassWriter { 
  public HashMap<String,Integer> signatures = new HashMap<String,Integer>();
  public int signature_cnt = 0;
  public HashMap<String,Boolean> iface_created = new HashMap<String,Boolean>();
  
  public String getSignatureInterface( String s ) {
    final Optional<Integer> idx = Optional.ofNullable(signatures.get(s));
    if ( idx.isPresent() ) {
      return "LambdaSignature" + (idx.get());
    }
    signature_cnt = signature_cnt + 1;
    signatures.put(s, signature_cnt);
    return "LambdaSignature" + signature_cnt;
  }
  
  public String adjustType( String tn ) {
    if ( tn.equals("this") ) {
      return "this";
    }
    return tn;
  }
  
  public String getObjectTypeString( String type_string , RangerAppWriterContext ctx ) {
    switch (type_string ) { 
      case "int" : 
        return "Integer";
      case "string" : 
        return "String";
      case "charbuffer" : 
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
  
  public String getTypeString( String type_string ) {
    switch (type_string ) { 
      case "int" : 
        return "int";
      case "string" : 
        return "String";
      case "charbuffer" : 
        return "byte[]";
      case "char" : 
        return "byte";
      case "boolean" : 
        return "boolean";
      case "double" : 
        return "double";
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
    if ( node.hasFlag("optional") ) {
      wr.addImport("java.util.Optional");
      wr.out("Optional<", false);
      switch (v_type ) { 
        case 15 : 
          final String sig = this.buildLambdaSignature((node.expression_value.get()));
          final String iface_name = this.getSignatureInterface(sig);
          wr.out(iface_name, false);
          if ( (iface_created.containsKey(iface_name)) == false ) {
            final CodeNode fnNode = node.expression_value.get().children.get(0);
            final CodeNode args = node.expression_value.get().children.get(1);
            iface_created.put(iface_name, true);
            final CodeWriter utilWr = wr.getFileWriter(".", (iface_name + ".java"));
            utilWr.out(("public interface " + iface_name) + " { ", true);
            utilWr.indent(1);
            utilWr.out("public ", false);
            this.writeTypeDef(fnNode, ctx, utilWr);
            utilWr.out(" run(", false);
            for ( int i = 0; i < args.children.size(); i++) {
              CodeNode arg = args.children.get(i);
              if ( i > 0 ) {
                utilWr.out(", ", false);
              }
              this.writeTypeDef(arg, ctx, utilWr);
              utilWr.out(" ", false);
              utilWr.out(arg.vref, false);
            }
            utilWr.out(");", true);
            utilWr.indent(-1);
            utilWr.out("}", true);
          }
          break;
        case 11 : 
          wr.out("Integer", false);
          break;
        case 3 : 
          wr.out("Integer", false);
          break;
        case 2 : 
          wr.out("Double", false);
          break;
        case 4 : 
          wr.out("String", false);
          break;
        case 5 : 
          wr.out("Boolean", false);
          break;
        case 12 : 
          wr.out("byte", false);
          break;
        case 13 : 
          wr.out("byte[]", false);
          break;
        case 7 : 
          wr.out(((("HashMap<" + this.getObjectTypeString(k_name, ctx)) + ",") + this.getObjectTypeString(a_name, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        case 6 : 
          wr.out(("ArrayList<" + this.getObjectTypeString(a_name, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        default: 
          if ( t_name.equals("void") ) {
            wr.out("void", false);
          } else {
            wr.out(this.getObjectTypeString(t_name, ctx), false);
          }
          break;
      }
    } else {
      switch (v_type ) { 
        case 15 : 
          final String sig_1 = this.buildLambdaSignature((node.expression_value.get()));
          final String iface_name_1 = this.getSignatureInterface(sig_1);
          wr.out(iface_name_1, false);
          if ( (iface_created.containsKey(iface_name_1)) == false ) {
            final CodeNode fnNode_1 = node.expression_value.get().children.get(0);
            final CodeNode args_1 = node.expression_value.get().children.get(1);
            iface_created.put(iface_name_1, true);
            final CodeWriter utilWr_1 = wr.getFileWriter(".", (iface_name_1 + ".java"));
            utilWr_1.out(("public interface " + iface_name_1) + " { ", true);
            utilWr_1.indent(1);
            utilWr_1.out("public ", false);
            this.writeTypeDef(fnNode_1, ctx, utilWr_1);
            utilWr_1.out(" run(", false);
            for ( int i_1 = 0; i_1 < args_1.children.size(); i_1++) {
              CodeNode arg_1 = args_1.children.get(i_1);
              if ( i_1 > 0 ) {
                utilWr_1.out(", ", false);
              }
              this.writeTypeDef(arg_1, ctx, utilWr_1);
              utilWr_1.out(" ", false);
              utilWr_1.out(arg_1.vref, false);
            }
            utilWr_1.out(");", true);
            utilWr_1.indent(-1);
            utilWr_1.out("}", true);
          }
          break;
        case 11 : 
          wr.out("int", false);
          break;
        case 3 : 
          wr.out("int", false);
          break;
        case 2 : 
          wr.out("double", false);
          break;
        case 12 : 
          wr.out("byte", false);
          break;
        case 13 : 
          wr.out("byte[]", false);
          break;
        case 4 : 
          wr.out("String", false);
          break;
        case 5 : 
          wr.out("boolean", false);
          break;
        case 7 : 
          wr.out(((("HashMap<" + this.getObjectTypeString(k_name, ctx)) + ",") + this.getObjectTypeString(a_name, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        case 6 : 
          wr.out(("ArrayList<" + this.getObjectTypeString(a_name, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        default: 
          if ( t_name.equals("void") ) {
            wr.out("void", false);
          } else {
            wr.out(this.getTypeString(t_name), false);
          }
          break;
      }
    }
    if ( node.hasFlag("optional") ) {
      wr.out(">", false);
    }
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.vref.equals("this") ) {
      wr.out("this", false);
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
            wr.out("this", false);
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
            wr.out(".get()", false);
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
  
  public void disabledVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn = node.children.get(1);
      final Optional<RangerAppParamDesc> p = nn.paramDesc;
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      wr.out(p.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        boolean b_was_set = false;
        if ( nn.value_type == 6 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( (b_was_set == false) && nn.hasFlag("optional") ) {
          wr.out(" = Optional.empty()", false);
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
        wr.out("final ", false);
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
        boolean b_was_set = false;
        if ( nn.value_type == 6 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( (b_was_set == false) && nn.hasFlag("optional") ) {
          wr.out(" = Optional.empty()", false);
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
  
  public void CustomOperator( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fc = node.getFirst();
    final String cmd = fc.vref;
    if ( cmd.equals("return") ) {
      wr.newline();
      if ( (node.children.size()) > 1 ) {
        final CodeNode value = node.getSecond();
        if ( value.hasParamDesc ) {
          final CodeNode nn = value.paramDesc.get().nameNode.get();
          if ( ctx.isDefinedClass(nn.type_name) ) {
            /** unused:  final RangerAppClassDesc cl = ctx.findClass(nn.type_name)   **/ ;
            final RangerAppFunctionDesc activeFn = ctx.getCurrentMethod();
            final CodeNode fnNameNode = activeFn.nameNode.get();
            if ( fnNameNode.hasFlag("optional") ) {
              wr.out("return Optional.ofNullable((", false);
              this.WalkNode(value, ctx, wr);
              wr.out(".isPresent() ? (", false);
              wr.out(fnNameNode.type_name, false);
              wr.out(")", false);
              this.WalkNode(value, ctx, wr);
              wr.out(".get() : null ) );", true);
              return;
            }
          }
        }
        wr.out("return ", false);
        ctx.setInExpr();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
        wr.out(";", true);
      } else {
        wr.out("return;", true);
      }
    }
  }
  
  public String buildLambdaSignature( CodeNode node ) {
    final CodeNode exp = node;
    String exp_s = "";
    final CodeNode fc = exp.getFirst();
    final CodeNode args = exp.getSecond();
    exp_s = exp_s + fc.buildTypeSignature();
    exp_s = exp_s + "(";
    for ( int i = 0; i < args.children.size(); i++) {
      CodeNode arg = args.children.get(i);
      exp_s = exp_s + arg.buildTypeSignature();
      exp_s = exp_s + ",";
    }
    exp_s = exp_s + ")";
    return exp_s;
  }
  
  public void CreateLambdaCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fName = node.children.get(0);
    final CodeNode givenArgs = node.children.get(1);
    this.WriteVRef(fName, ctx, wr);
    final RangerAppParamDesc param = ctx.getVariableDef(fName.vref);
    final CodeNode args = param.nameNode.get().expression_value.get().children.get(1);
    wr.out(".run(", false);
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
    final CodeNode fnNode = node.children.get(0);
    final CodeNode args = node.children.get(1);
    final CodeNode body = node.children.get(2);
    final String sig = this.buildLambdaSignature(node);
    final String iface_name = this.getSignatureInterface(sig);
    if ( (iface_created.containsKey(iface_name)) == false ) {
      iface_created.put(iface_name, true);
      final CodeWriter utilWr = wr.getFileWriter(".", (iface_name + ".java"));
      utilWr.out(("public interface " + iface_name) + " { ", true);
      utilWr.indent(1);
      utilWr.out("public ", false);
      this.writeTypeDef(fnNode, ctx, utilWr);
      utilWr.out(" run(", false);
      for ( int i = 0; i < args.children.size(); i++) {
        CodeNode arg = args.children.get(i);
        if ( i > 0 ) {
          utilWr.out(", ", false);
        }
        this.writeTypeDef(arg, lambdaCtx, utilWr);
        utilWr.out(" ", false);
        utilWr.out(arg.vref, false);
      }
      utilWr.out(");", true);
      utilWr.indent(-1);
      utilWr.out("}", true);
    }
    wr.out(("new " + iface_name) + "() { ", true);
    wr.indent(1);
    wr.out("public ", false);
    this.writeTypeDef(fnNode, ctx, wr);
    wr.out(" run(", false);
    for ( int i_1 = 0; i_1 < args.children.size(); i_1++) {
      CodeNode arg_1 = args.children.get(i_1);
      if ( i_1 > 0 ) {
        wr.out(", ", false);
      }
      this.writeTypeDef(arg_1, lambdaCtx, wr);
      wr.out(" ", false);
      wr.out(arg_1.vref, false);
    }
    wr.out(") {", true);
    wr.indent(1);
    lambdaCtx.restartExpressionLevel();
    for ( int i_2 = 0; i_2 < body.children.size(); i_2++) {
      CodeNode item = body.children.get(i_2);
      this.WalkNode(item, lambdaCtx, wr);
    }
    wr.newline();
    for ( int i_3 = 0; i_3 < lambdaCtx.captured_variables.size(); i_3++) {
      String cname = lambdaCtx.captured_variables.get(i_3);
      wr.out("// captured var " + cname, true);
    }
    wr.indent(-1);
    wr.out("}", true);
    wr.indent(-1);
    wr.out("}", false);
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl = node.clDesc;
    if ( !cl.isPresent() ) {
      return;
    }
    HashMap<String,Boolean> declaredVariable = new HashMap<String,Boolean>();
    if ( (cl.get().extends_classes.size()) > 0 ) {
      for ( int i = 0; i < cl.get().extends_classes.size(); i++) {
        String pName = cl.get().extends_classes.get(i);
        final RangerAppClassDesc pC = ctx.findClass(pName);
        for ( int i_1 = 0; i_1 < pC.variables.size(); i_1++) {
          RangerAppParamDesc pvar = pC.variables.get(i_1);
          declaredVariable.put(pvar.name, true);
        }
      }
    }
    final CodeWriter wr = orig_wr.getFileWriter(".", (cl.get().name + ".java"));
    final CodeWriter importFork = wr.fork();
    for ( int i_2 = 0; i_2 < cl.get().capturedLocals.size(); i_2++) {
      RangerAppParamDesc dd = cl.get().capturedLocals.get(i_2);
      if ( dd.is_class_variable == false ) {
        wr.out("// local captured " + dd.name, true);
        System.out.println(String.valueOf( "java captured" ) );
        System.out.println(String.valueOf( dd.node.get().getLineAsString() ) );
        dd.node.get().disabled_node = true;
        cl.get().addVariable(dd);
        final Optional<RangerAppWriterContext> csubCtx = cl.get().ctx;
        csubCtx.get().defineVariable(dd.name, dd);
        dd.is_class_variable = true;
      }
    }
    wr.out("", true);
    wr.out("class " + cl.get().name, false);
    Optional<RangerAppClassDesc> parentClass = Optional.empty();
    if ( (cl.get().extends_classes.size()) > 0 ) {
      wr.out(" extends ", false);
      for ( int i_3 = 0; i_3 < cl.get().extends_classes.size(); i_3++) {
        String pName_1 = cl.get().extends_classes.get(i_3);
        wr.out(pName_1, false);
        parentClass = Optional.of(ctx.findClass(pName_1));
      }
    }
    wr.out(" { ", true);
    wr.indent(1);
    wr.createTag("utilities");
    for ( int i_4 = 0; i_4 < cl.get().variables.size(); i_4++) {
      RangerAppParamDesc pvar_1 = cl.get().variables.get(i_4);
      if ( declaredVariable.containsKey(pvar_1.name) ) {
        continue;
      }
      wr.out("public ", false);
      this.writeVarDef(pvar_1.node.get(), ctx, wr);
    }
    if ( cl.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr = cl.get().constructor_fn;
      wr.out("", true);
      wr.out(cl.get().name + "(", false);
      this.writeArgsDef(constr.get(), ctx, wr);
      wr.out(" ) {", true);
      wr.indent(1);
      wr.newline();
      final RangerAppWriterContext subCtx = constr.get().fnCtx.get();
      subCtx.is_function = true;
      this.WalkNode(constr.get().fnBody.get(), subCtx, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( int i_5 = 0; i_5 < cl.get().static_methods.size(); i_5++) {
      RangerAppFunctionDesc variant = cl.get().static_methods.get(i_5);
      wr.out("", true);
      if ( variant.nameNode.get().hasFlag("main") && (!variant.nameNode.get().code.get().filename.equals(ctx.getRootFile())) ) {
        continue;
      }
      if ( variant.nameNode.get().hasFlag("main") ) {
        wr.out("public static void main(String [] args ) {", true);
      } else {
        wr.out("public static ", false);
        this.writeTypeDef(variant.nameNode.get(), ctx, wr);
        wr.out(" ", false);
        wr.out(variant.compiledName + "(", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") {", true);
      }
      wr.indent(1);
      wr.newline();
      final RangerAppWriterContext subCtx_1 = variant.fnCtx.get();
      subCtx_1.is_function = true;
      this.WalkNode(variant.fnBody.get(), subCtx_1, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( int i_6 = 0; i_6 < cl.get().defined_variants.size(); i_6++) {
      String fnVar = cl.get().defined_variants.get(i_6);
      final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(cl.get().method_variants.get(fnVar));
      for ( int i_7 = 0; i_7 < mVs.get().variants.size(); i_7++) {
        RangerAppFunctionDesc variant_1 = mVs.get().variants.get(i_7);
        wr.out("", true);
        wr.out("public ", false);
        this.writeTypeDef(variant_1.nameNode.get(), ctx, wr);
        wr.out(" ", false);
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
    wr.indent(-1);
    wr.out("}", true);
    final ArrayList<String> import_list = wr.getImports();
    for ( int i_8 = 0; i_8 < import_list.size(); i_8++) {
      String codeStr = import_list.get(i_8);
      importFork.out(("import " + codeStr) + ";", true);
    }
  }
}
