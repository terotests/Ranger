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
    int v_type_9 = node.value_type;
    String t_name_3 = node.type_name;
    String a_name_5 = node.array_type;
    String k_name_3 = node.key_type;
    if ( ((v_type_9 == 8) || (v_type_9 == 9)) || (v_type_9 == 0) ) {
      v_type_9 = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type_9 = node.eval_type;
      if ( (node.eval_type_name.length()) > 0 ) {
        t_name_3 = node.eval_type_name;
      }
      if ( (node.eval_array_type.length()) > 0 ) {
        a_name_5 = node.eval_array_type;
      }
      if ( (node.eval_key_type.length()) > 0 ) {
        k_name_3 = node.eval_key_type;
      }
    }
    if ( v_type_9 == 7 ) {
      wr.out(((("[" + k_name_3) + ":") + a_name_5) + "]", false);
      return;
    }
    if ( v_type_9 == 6 ) {
      wr.out(("[" + a_name_5) + "]", false);
      return;
    }
    wr.out(t_name_3, false);
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    wr.out(node.vref, false);
  }
  
  public void WriteVRefWithOpt( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    wr.out(node.vref, false);
    final ArrayList<String> flags = new ArrayList<String>(Arrays.asList("optional","weak","strong","temp","lives","returns","returnvalue")) ;
    boolean some_set = false;
    for ( int i_172 = 0; i_172 < flags.size(); i_172++) {
      String flag_2 = flags.get(i_172);
      if ( node.hasFlag(flag_2) ) {
        if ( false == some_set ) {
          wr.out("@(", false);
          some_set = true;
        } else {
          wr.out(" ", false);
        }
        wr.out(flag_2, false);
      }
    }
    if ( some_set ) {
      wr.out(")", false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_25 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_53 = nn_25.paramDesc;
      wr.out("def ", false);
      this.WriteVRefWithOpt(nn_25, ctx, wr);
      wr.out(":", false);
      this.writeTypeDef(p_53.get().nameNode.get(), ctx, wr);
      if ( (node.children.size()) > 2 ) {
        wr.out(" ", false);
        ctx.setInExpr();
        final CodeNode value_19 = node.getThird();
        this.WalkNode(value_19, ctx, wr);
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
      final CodeNode fc_36 = node.getFirst();
      this.WriteVRef(fc_36, ctx, wr);
      wr.out("(", false);
      final CodeNode givenArgs_11 = node.getSecond();
      ctx.setInExpr();
      for ( int i_175 = 0; i_175 < node.fnDesc.get().params.size(); i_175++) {
        RangerAppParamDesc arg_31 = node.fnDesc.get().params.get(i_175);
        if ( i_175 > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs_11.children.size()) <= i_175 ) {
          final Optional<CodeNode> defVal_5 = arg_31.nameNode.get().getFlag("default");
          if ( defVal_5.isPresent() ) {
            final CodeNode fc_47 = defVal_5.get().vref_annotation.get().getFirst();
            this.WalkNode(fc_47, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        final CodeNode n_17 = givenArgs_11.children.get(i_175);
        this.WalkNode(n_17, ctx, wr);
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
      final Optional<RangerAppClassDesc> cl_17 = node.clDesc;
      /** unused:  final CodeNode fc_41 = node.getSecond()   **/ ;
      wr.out("(new " + node.clDesc.get().name, false);
      wr.out("(", false);
      final Optional<RangerAppFunctionDesc> constr_20 = cl_17.get().constructor_fn;
      final CodeNode givenArgs_14 = node.getThird();
      if ( constr_20.isPresent() ) {
        for ( int i_177 = 0; i_177 < constr_20.get().params.size(); i_177++) {
          RangerAppParamDesc arg_34 = constr_20.get().params.get(i_177);
          final CodeNode n_20 = givenArgs_14.children.get(i_177);
          if ( i_177 > 0 ) {
            wr.out(" ", false);
          }
          if ( true || (arg_34.nameNode.isPresent()) ) {
            this.WalkNode(n_20, ctx, wr);
          }
        }
      }
      wr.out("))", false);
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_179 = 0; i_179 < fnDesc.params.size(); i_179++) {
      RangerAppParamDesc arg_36 = fnDesc.params.get(i_179);
      if ( i_179 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.WriteVRefWithOpt(arg_36.nameNode.get(), ctx, wr);
      wr.out(":", false);
      this.writeTypeDef(arg_36.nameNode.get(), ctx, wr);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_20 = node.clDesc;
    if ( !cl_20.isPresent() ) {
      return;
    }
    final CodeWriter wr_12 = orig_wr;
    final CodeWriter importFork_7 = wr_12.fork();
    wr_12.out("", true);
    wr_12.out("class " + cl_20.get().name, false);
    Optional<RangerAppClassDesc> parentClass_4 = Optional.empty();
    wr_12.out(" { ", true);
    wr_12.indent(1);
    if ( (cl_20.get().extends_classes.size()) > 0 ) {
      wr_12.out("Extends(", false);
      for ( int i_181 = 0; i_181 < cl_20.get().extends_classes.size(); i_181++) {
        String pName_10 = cl_20.get().extends_classes.get(i_181);
        wr_12.out(pName_10, false);
        parentClass_4 = Optional.of(ctx.findClass(pName_10));
      }
      wr_12.out(")", true);
    }
    wr_12.createTag("utilities");
    for ( int i_185 = 0; i_185 < cl_20.get().variables.size(); i_185++) {
      RangerAppParamDesc pvar_19 = cl_20.get().variables.get(i_185);
      this.writeVarDef(pvar_19.node.get(), ctx, wr_12);
    }
    if ( cl_20.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_23 = cl_20.get().constructor_fn;
      wr_12.out("", true);
      wr_12.out("Constructor (", false);
      this.writeArgsDef(constr_23.get(), ctx, wr_12);
      wr_12.out(" ) {", true);
      wr_12.indent(1);
      wr_12.newline();
      final RangerAppWriterContext subCtx_45 = constr_23.get().fnCtx.get();
      subCtx_45.is_function = true;
      this.WalkNode(constr_23.get().fnBody.get(), subCtx_45, wr_12);
      wr_12.newline();
      wr_12.indent(-1);
      wr_12.out("}", true);
    }
    for ( int i_188 = 0; i_188 < cl_20.get().static_methods.size(); i_188++) {
      RangerAppFunctionDesc variant_26 = cl_20.get().static_methods.get(i_188);
      wr_12.out("", true);
      if ( variant_26.nameNode.get().hasFlag("main") ) {
        wr_12.out("sfn m@(main):void () {", true);
      } else {
        wr_12.out("sfn ", false);
        this.WriteVRefWithOpt(variant_26.nameNode.get(), ctx, wr_12);
        wr_12.out(":", false);
        this.writeTypeDef(variant_26.nameNode.get(), ctx, wr_12);
        wr_12.out(" (", false);
        this.writeArgsDef(variant_26, ctx, wr_12);
        wr_12.out(") {", true);
      }
      wr_12.indent(1);
      wr_12.newline();
      final RangerAppWriterContext subCtx_50 = variant_26.fnCtx.get();
      subCtx_50.is_function = true;
      this.WalkNode(variant_26.fnBody.get(), subCtx_50, wr_12);
      wr_12.newline();
      wr_12.indent(-1);
      wr_12.out("}", true);
    }
    for ( int i_191 = 0; i_191 < cl_20.get().defined_variants.size(); i_191++) {
      String fnVar_12 = cl_20.get().defined_variants.get(i_191);
      final Optional<RangerAppMethodVariants> mVs_12 = Optional.ofNullable(cl_20.get().method_variants.get(fnVar_12));
      for ( int i_198 = 0; i_198 < mVs_12.get().variants.size(); i_198++) {
        RangerAppFunctionDesc variant_31 = mVs_12.get().variants.get(i_198);
        wr_12.out("", true);
        wr_12.out("fn ", false);
        this.WriteVRefWithOpt(variant_31.nameNode.get(), ctx, wr_12);
        wr_12.out(":", false);
        this.writeTypeDef(variant_31.nameNode.get(), ctx, wr_12);
        wr_12.out(" ", false);
        wr_12.out("(", false);
        this.writeArgsDef(variant_31, ctx, wr_12);
        wr_12.out(") {", true);
        wr_12.indent(1);
        wr_12.newline();
        final RangerAppWriterContext subCtx_53 = variant_31.fnCtx.get();
        subCtx_53.is_function = true;
        this.WalkNode(variant_31.fnBody.get(), subCtx_53, wr_12);
        wr_12.newline();
        wr_12.indent(-1);
        wr_12.out("}", true);
      }
    }
    wr_12.indent(-1);
    wr_12.out("}", true);
    final ArrayList<String> import_list_4 = wr_12.getImports();
    for ( int i_197 = 0; i_197 < import_list_4.size(); i_197++) {
      String codeStr_4 = import_list_4.get(i_197);
      importFork_7.out(("Import \"" + codeStr_4) + "\"", true);
    }
  }
}
