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
    int v_type_10 = node.value_type;
    String t_name_4 = node.type_name;
    String a_name_6 = node.array_type;
    String k_name_4 = node.key_type;
    if ( ((v_type_10 == 8) || (v_type_10 == 9)) || (v_type_10 == 0) ) {
      v_type_10 = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type_10 = node.eval_type;
      if ( (node.eval_type_name.length()) > 0 ) {
        t_name_4 = node.eval_type_name;
      }
      if ( (node.eval_array_type.length()) > 0 ) {
        a_name_6 = node.eval_array_type;
      }
      if ( (node.eval_key_type.length()) > 0 ) {
        k_name_4 = node.eval_key_type;
      }
    }
    if ( v_type_10 == 7 ) {
      wr.out(((("[" + k_name_4) + ":") + a_name_6) + "]", false);
      return;
    }
    if ( v_type_10 == 6 ) {
      wr.out(("[" + a_name_6) + "]", false);
      return;
    }
    wr.out(t_name_4, false);
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    wr.out(node.vref, false);
  }
  
  public void WriteVRefWithOpt( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    wr.out(node.vref, false);
    final ArrayList<String> flags = new ArrayList<String>(Arrays.asList("optional","weak","strong","temp","lives","returns","returnvalue")) ;
    boolean some_set = false;
    for ( int i_188 = 0; i_188 < flags.size(); i_188++) {
      String flag_2 = flags.get(i_188);
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
      final CodeNode nn_28 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_57 = nn_28.paramDesc;
      wr.out("def ", false);
      this.WriteVRefWithOpt(nn_28, ctx, wr);
      wr.out(":", false);
      this.writeTypeDef(p_57.get().nameNode.get(), ctx, wr);
      if ( (node.children.size()) > 2 ) {
        wr.out(" ", false);
        ctx.setInExpr();
        final CodeNode value_20 = node.getThird();
        this.WalkNode(value_20, ctx, wr);
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
      final CodeNode fc_39 = node.getFirst();
      this.WriteVRef(fc_39, ctx, wr);
      wr.out("(", false);
      final CodeNode givenArgs_13 = node.getSecond();
      ctx.setInExpr();
      for ( int i_191 = 0; i_191 < node.fnDesc.get().params.size(); i_191++) {
        RangerAppParamDesc arg_34 = node.fnDesc.get().params.get(i_191);
        if ( i_191 > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs_13.children.size()) <= i_191 ) {
          final Optional<CodeNode> defVal_6 = arg_34.nameNode.get().getFlag("default");
          if ( defVal_6.isPresent() ) {
            final CodeNode fc_50 = defVal_6.get().vref_annotation.get().getFirst();
            this.WalkNode(fc_50, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        final CodeNode n_19 = givenArgs_13.children.get(i_191);
        this.WalkNode(n_19, ctx, wr);
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
      final Optional<RangerAppClassDesc> cl_20 = node.clDesc;
      /** unused:  final CodeNode fc_44 = node.getSecond()   **/ ;
      wr.out("(new " + node.clDesc.get().name, false);
      wr.out("(", false);
      final Optional<RangerAppFunctionDesc> constr_24 = cl_20.get().constructor_fn;
      final CodeNode givenArgs_16 = node.getThird();
      if ( constr_24.isPresent() ) {
        for ( int i_193 = 0; i_193 < constr_24.get().params.size(); i_193++) {
          RangerAppParamDesc arg_37 = constr_24.get().params.get(i_193);
          final CodeNode n_22 = givenArgs_16.children.get(i_193);
          if ( i_193 > 0 ) {
            wr.out(" ", false);
          }
          if ( true || (arg_37.nameNode.isPresent()) ) {
            this.WalkNode(n_22, ctx, wr);
          }
        }
      }
      wr.out("))", false);
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_195 = 0; i_195 < fnDesc.params.size(); i_195++) {
      RangerAppParamDesc arg_39 = fnDesc.params.get(i_195);
      if ( i_195 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.WriteVRefWithOpt(arg_39.nameNode.get(), ctx, wr);
      wr.out(":", false);
      this.writeTypeDef(arg_39.nameNode.get(), ctx, wr);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_23 = node.clDesc;
    if ( !cl_23.isPresent() ) {
      return;
    }
    final CodeWriter wr_13 = orig_wr;
    final CodeWriter importFork_7 = wr_13.fork();
    wr_13.out("", true);
    wr_13.out("class " + cl_23.get().name, false);
    Optional<RangerAppClassDesc> parentClass_5 = Optional.empty();
    wr_13.out(" { ", true);
    wr_13.indent(1);
    if ( (cl_23.get().extends_classes.size()) > 0 ) {
      wr_13.out("Extends(", false);
      for ( int i_197 = 0; i_197 < cl_23.get().extends_classes.size(); i_197++) {
        String pName_11 = cl_23.get().extends_classes.get(i_197);
        wr_13.out(pName_11, false);
        parentClass_5 = Optional.of(ctx.findClass(pName_11));
      }
      wr_13.out(")", true);
    }
    wr_13.createTag("utilities");
    for ( int i_201 = 0; i_201 < cl_23.get().variables.size(); i_201++) {
      RangerAppParamDesc pvar_21 = cl_23.get().variables.get(i_201);
      this.writeVarDef(pvar_21.node.get(), ctx, wr_13);
    }
    if ( cl_23.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_27 = cl_23.get().constructor_fn;
      wr_13.out("", true);
      wr_13.out("Constructor (", false);
      this.writeArgsDef(constr_27.get(), ctx, wr_13);
      wr_13.out(" ) {", true);
      wr_13.indent(1);
      wr_13.newline();
      final RangerAppWriterContext subCtx_49 = constr_27.get().fnCtx.get();
      subCtx_49.is_function = true;
      this.WalkNode(constr_27.get().fnBody.get(), subCtx_49, wr_13);
      wr_13.newline();
      wr_13.indent(-1);
      wr_13.out("}", true);
    }
    for ( int i_204 = 0; i_204 < cl_23.get().static_methods.size(); i_204++) {
      RangerAppFunctionDesc variant_31 = cl_23.get().static_methods.get(i_204);
      wr_13.out("", true);
      if ( variant_31.nameNode.get().hasFlag("main") ) {
        wr_13.out("sfn m@(main):void () {", true);
      } else {
        wr_13.out("sfn ", false);
        this.WriteVRefWithOpt(variant_31.nameNode.get(), ctx, wr_13);
        wr_13.out(":", false);
        this.writeTypeDef(variant_31.nameNode.get(), ctx, wr_13);
        wr_13.out(" (", false);
        this.writeArgsDef(variant_31, ctx, wr_13);
        wr_13.out(") {", true);
      }
      wr_13.indent(1);
      wr_13.newline();
      final RangerAppWriterContext subCtx_54 = variant_31.fnCtx.get();
      subCtx_54.is_function = true;
      this.WalkNode(variant_31.fnBody.get(), subCtx_54, wr_13);
      wr_13.newline();
      wr_13.indent(-1);
      wr_13.out("}", true);
    }
    for ( int i_207 = 0; i_207 < cl_23.get().defined_variants.size(); i_207++) {
      String fnVar_14 = cl_23.get().defined_variants.get(i_207);
      final Optional<RangerAppMethodVariants> mVs_14 = Optional.ofNullable(cl_23.get().method_variants.get(fnVar_14));
      for ( int i_214 = 0; i_214 < mVs_14.get().variants.size(); i_214++) {
        RangerAppFunctionDesc variant_36 = mVs_14.get().variants.get(i_214);
        wr_13.out("", true);
        wr_13.out("fn ", false);
        this.WriteVRefWithOpt(variant_36.nameNode.get(), ctx, wr_13);
        wr_13.out(":", false);
        this.writeTypeDef(variant_36.nameNode.get(), ctx, wr_13);
        wr_13.out(" ", false);
        wr_13.out("(", false);
        this.writeArgsDef(variant_36, ctx, wr_13);
        wr_13.out(") {", true);
        wr_13.indent(1);
        wr_13.newline();
        final RangerAppWriterContext subCtx_57 = variant_36.fnCtx.get();
        subCtx_57.is_function = true;
        this.WalkNode(variant_36.fnBody.get(), subCtx_57, wr_13);
        wr_13.newline();
        wr_13.indent(-1);
        wr_13.out("}", true);
      }
    }
    wr_13.indent(-1);
    wr_13.out("}", true);
    final ArrayList<String> import_list_4 = wr_13.getImports();
    for ( int i_213 = 0; i_213 < import_list_4.size(); i_213++) {
      String codeStr_4 = import_list_4.get(i_213);
      importFork_7.out(("Import \"" + codeStr_4) + "\"", true);
    }
  }
}
