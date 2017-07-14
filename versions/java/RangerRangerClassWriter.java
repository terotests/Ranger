import java.util.*;
import java.util.Optional;

class RangerRangerClassWriter extends RangerGenericClassWriter { 
  
  public String adjustType( String tn ) {
    if ( tn.equals("this") ) {
      return "this";
    }
    return tn;
  }
  
  public String getObjectTypeString( String type_string , RangerAppWriterContext ctx ) {
    return type_string;
  }
  
  public String getTypeString( String type_string ) {
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
    if ( v_type == 7 ) {
      wr.out(((("[" + k_name) + ":") + a_name) + "]", false);
      return;
    }
    if ( v_type == 6 ) {
      wr.out(("[" + a_name) + "]", false);
      return;
    }
    wr.out(t_name, false);
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    wr.out(node.vref, false);
  }
  
  public void WriteVRefWithOpt( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    wr.out(node.vref, false);
    final ArrayList<String> flags = new ArrayList<String>(Arrays.asList("optional","weak","strong","temp","lives","returns","returnvalue")) ;
    boolean some_set = false;
    for ( int i = 0; i < flags.size(); i++) {
      String flag = flags.get(i);
      if ( node.hasFlag(flag) ) {
        if ( false == some_set ) {
          wr.out("@(", false);
          some_set = true;
        } else {
          wr.out(" ", false);
        }
        wr.out(flag, false);
      }
    }
    if ( some_set ) {
      wr.out(")", false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn = node.children.get(1);
      final Optional<RangerAppParamDesc> p = nn.paramDesc;
      wr.out("def ", false);
      this.WriteVRefWithOpt(nn, ctx, wr);
      wr.out(":", false);
      this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
      if ( (node.children.size()) > 2 ) {
        wr.out(" ", false);
        ctx.setInExpr();
        final CodeNode value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      }
      wr.newline();
    }
  }
  
  public void writeFnCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasFnCall ) {
      if ( ctx.expressionLevel() > 0 ) {
        wr.out("(", false);
      }
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
      if ( ctx.expressionLevel() > 0 ) {
        wr.out(")", false);
      }
      if ( ctx.expressionLevel() == 0 ) {
        wr.newline();
      }
    }
  }
  
  public void writeNewCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasNewOper ) {
      final Optional<RangerAppClassDesc> cl = node.clDesc;
      /** unused:  final CodeNode fc = node.getSecond()   **/ ;
      wr.out("(new " + node.clDesc.get().name, false);
      wr.out("(", false);
      final Optional<RangerAppFunctionDesc> constr = cl.get().constructor_fn;
      final CodeNode givenArgs = node.getThird();
      if ( constr.isPresent() ) {
        for ( int i = 0; i < constr.get().params.size(); i++) {
          RangerAppParamDesc arg = constr.get().params.get(i);
          final CodeNode n = givenArgs.children.get(i);
          if ( i > 0 ) {
            wr.out(" ", false);
          }
          if ( true || (arg.nameNode.isPresent()) ) {
            this.WalkNode(n, ctx, wr);
          }
        }
      }
      wr.out("))", false);
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i = 0; i < fnDesc.params.size(); i++) {
      RangerAppParamDesc arg = fnDesc.params.get(i);
      if ( i > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.WriteVRefWithOpt(arg.nameNode.get(), ctx, wr);
      wr.out(":", false);
      this.writeTypeDef(arg.nameNode.get(), ctx, wr);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl = node.clDesc;
    if ( !cl.isPresent() ) {
      return;
    }
    final CodeWriter wr = orig_wr;
    final CodeWriter importFork = wr.fork();
    wr.out("", true);
    wr.out("class " + cl.get().name, false);
    Optional<RangerAppClassDesc> parentClass = Optional.empty();
    wr.out(" { ", true);
    wr.indent(1);
    if ( (cl.get().extends_classes.size()) > 0 ) {
      wr.out("Extends(", false);
      for ( int i = 0; i < cl.get().extends_classes.size(); i++) {
        String pName = cl.get().extends_classes.get(i);
        wr.out(pName, false);
        parentClass = Optional.of(ctx.findClass(pName));
      }
      wr.out(")", true);
    }
    wr.createTag("utilities");
    for ( int i_1 = 0; i_1 < cl.get().variables.size(); i_1++) {
      RangerAppParamDesc pvar = cl.get().variables.get(i_1);
      this.writeVarDef(pvar.node.get(), ctx, wr);
    }
    if ( cl.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr = cl.get().constructor_fn;
      wr.out("", true);
      wr.out("Constructor (", false);
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
    for ( int i_2 = 0; i_2 < cl.get().static_methods.size(); i_2++) {
      RangerAppFunctionDesc variant = cl.get().static_methods.get(i_2);
      wr.out("", true);
      if ( variant.nameNode.get().hasFlag("main") ) {
        wr.out("sfn m@(main):void () {", true);
      } else {
        wr.out("sfn ", false);
        this.WriteVRefWithOpt(variant.nameNode.get(), ctx, wr);
        wr.out(":", false);
        this.writeTypeDef(variant.nameNode.get(), ctx, wr);
        wr.out(" (", false);
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
    for ( int i_3 = 0; i_3 < cl.get().defined_variants.size(); i_3++) {
      String fnVar = cl.get().defined_variants.get(i_3);
      final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(cl.get().method_variants.get(fnVar));
      for ( int i_4 = 0; i_4 < mVs.get().variants.size(); i_4++) {
        RangerAppFunctionDesc variant_1 = mVs.get().variants.get(i_4);
        wr.out("", true);
        wr.out("fn ", false);
        this.WriteVRefWithOpt(variant_1.nameNode.get(), ctx, wr);
        wr.out(":", false);
        this.writeTypeDef(variant_1.nameNode.get(), ctx, wr);
        wr.out(" ", false);
        wr.out("(", false);
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
    for ( int i_5 = 0; i_5 < import_list.size(); i_5++) {
      String codeStr = import_list.get(i_5);
      importFork.out(("Import \"" + codeStr) + "\"", true);
    }
  }
}
