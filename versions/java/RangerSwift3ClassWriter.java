import java.util.Optional;

class RangerSwift3ClassWriter extends RangerGenericClassWriter { 
  
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
    int v_type_2 = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type_2 = node.eval_type;
    }
    switch (v_type_2 ) { 
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
        wr.out(((("[" + this.getObjectTypeString(node.key_type, ctx)) + ":") + this.getObjectTypeString(node.array_type, ctx)) + "]", false);
        break;
      case 6 : 
        wr.out(("[" + this.getObjectTypeString(node.array_type, ctx)) + "]", false);
        break;
      default: 
        if ( node.type_name.equals("void") ) {
          wr.out("Void", false);
          return;
        }
        wr.out(this.getTypeString(node.type_name), false);
        break;
    }
    if ( node.hasFlag("optional") ) {
      wr.out("?", false);
    }
  }
  
  public void WriteEnum( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.eval_type == 11 ) {
      final String rootObjName_5 = node.ns.get(0);
      final Optional<RangerAppEnum> e_11 = ctx.getEnum(rootObjName_5);
      if ( e_11.isPresent() ) {
        final String enumName_5 = node.ns.get(1);
        wr.out("" + ((Optional.ofNullable(e_11.get().values.get(enumName_5))).get()), false);
      } else {
        if ( node.hasParamDesc ) {
          final Optional<RangerAppParamDesc> pp_5 = node.paramDesc;
          final Optional<CodeNode> nn_11 = pp_5.get().nameNode;
          wr.out(nn_11.get().vref, false);
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
        final String rootObjName_8 = node.ns.get(0);
        final String enumName_8 = node.ns.get(1);
        final Optional<RangerAppEnum> e_14 = ctx.getEnum(rootObjName_8);
        if ( e_14.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e_14.get().values.get(enumName_8))).get()), false);
          return;
        }
      }
    }
    final int max_len_2 = node.ns.size();
    if ( (node.nsp.size()) > 0 ) {
      for ( int i_82 = 0; i_82 < node.nsp.size(); i_82++) {
        RangerAppParamDesc p_20 = node.nsp.get(i_82);
        if ( i_82 == 0 ) {
          final String part_4 = node.ns.get(0);
          if ( part_4.equals("this") ) {
            wr.out("self", false);
            continue;
          }
        }
        if ( i_82 > 0 ) {
          wr.out(".", false);
        }
        if ( (p_20.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_20.compiledName), false);
        } else {
          if ( (p_20.name.length()) > 0 ) {
            wr.out(this.adjustType(p_20.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_82))), false);
          }
        }
        if ( i_82 < (max_len_2 - 1) ) {
          if ( p_20.nameNode.get().hasFlag("optional") ) {
            wr.out("!", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p_25 = node.paramDesc;
      wr.out(p_25.get().compiledName, false);
      return;
    }
    for ( int i_87 = 0; i_87 < node.ns.size(); i_87++) {
      String part_9 = node.ns.get(i_87);
      if ( i_87 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_9), false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_14 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_25 = nn_14.paramDesc;
      if ( (p_25.get().ref_cnt == 0) && (p_25.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p_25.get().set_cnt > 0) || p_25.get().is_class_variable ) {
        wr.out(("var " + p_25.get().compiledName) + " : ", false);
      } else {
        wr.out(("let " + p_25.get().compiledName) + " : ", false);
      }
      this.writeTypeDef(p_25.get().nameNode.get(), ctx, wr);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_5 = node.getThird();
        this.WalkNode(value_5, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_14.value_type == 6 ) {
          wr.out(" = ", false);
          this.writeTypeDef(p_25.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
        }
        if ( nn_14.value_type == 7 ) {
          wr.out(" = ", false);
          this.writeTypeDef(p_25.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
        }
      }
      if ( (p_25.get().ref_cnt == 0) && (p_25.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_25.get().ref_cnt == 0) && (p_25.get().is_class_variable == false) ) {
        wr.out("   **/ ", true);
      } else {
        wr.newline();
      }
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_87 = 0; i_87 < fnDesc.params.size(); i_87++) {
      RangerAppParamDesc arg_15 = fnDesc.params.get(i_87);
      if ( i_87 > 0 ) {
        wr.out(", ", false);
      }
      wr.out(arg_15.name + " : ", false);
      this.writeTypeDef(arg_15.nameNode.get(), ctx, wr);
    }
  }
  
  public void writeFnCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasFnCall ) {
      final CodeNode fc_24 = node.getFirst();
      final Optional<CodeNode> fnName = node.fnDesc.get().nameNode;
      if ( ctx.expressionLevel() == 0 ) {
        if ( !fnName.get().type_name.equals("void") ) {
          wr.out("_ = ", false);
        }
      }
      this.WriteVRef(fc_24, ctx, wr);
      wr.out("(", false);
      ctx.setInExpr();
      final CodeNode givenArgs_4 = node.getSecond();
      for ( int i_89 = 0; i_89 < node.fnDesc.get().params.size(); i_89++) {
        RangerAppParamDesc arg_18 = node.fnDesc.get().params.get(i_89);
        if ( i_89 > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs_4.children.size()) <= i_89 ) {
          final Optional<CodeNode> defVal_2 = arg_18.nameNode.get().getFlag("default");
          if ( defVal_2.isPresent() ) {
            final CodeNode fc_35 = defVal_2.get().vref_annotation.get().getFirst();
            this.WalkNode(fc_35, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        final CodeNode n_10 = givenArgs_4.children.get(i_89);
        wr.out(arg_18.name + " : ", false);
        this.WalkNode(n_10, ctx, wr);
      }
      ctx.unsetInExpr();
      wr.out(")", false);
      if ( ctx.expressionLevel() == 0 ) {
        wr.newline();
      }
    }
  }
  
  public void writeNewCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasNewOper ) {
      final Optional<RangerAppClassDesc> cl_6 = node.clDesc;
      /** unused:  final CodeNode fc_29 = node.getSecond()   **/ ;
      wr.out(node.clDesc.get().name, false);
      wr.out("(", false);
      final Optional<RangerAppFunctionDesc> constr_3 = cl_6.get().constructor_fn;
      final CodeNode givenArgs_7 = node.getThird();
      if ( constr_3.isPresent() ) {
        for ( int i_91 = 0; i_91 < constr_3.get().params.size(); i_91++) {
          RangerAppParamDesc arg_20 = constr_3.get().params.get(i_91);
          final CodeNode n_13 = givenArgs_7.children.get(i_91);
          if ( i_91 > 0 ) {
            wr.out(", ", false);
          }
          wr.out(arg_20.name + " : ", false);
          this.WalkNode(n_13, ctx, wr);
        }
      }
      wr.out(")", false);
    }
  }
  
  public boolean haveSameSig( RangerAppFunctionDesc fn1 , RangerAppFunctionDesc fn2 , RangerAppWriterContext ctx ) {
    if ( !fn1.name.equals(fn2.name) ) {
      return false;
    }
    final RangerArgMatch match_3 = new RangerArgMatch();
    final CodeNode n1_2 = fn1.nameNode.get();
    final CodeNode n2_2 = fn1.nameNode.get();
    if ( match_3.doesDefsMatch(n1_2, n2_2, ctx) == false ) {
      return false;
    }
    if ( (fn1.params.size()) != (fn2.params.size()) ) {
      return false;
    }
    for ( int i_93 = 0; i_93 < fn1.params.size(); i_93++) {
      RangerAppParamDesc p_27 = fn1.params.get(i_93);
      final RangerAppParamDesc p2_2 = fn2.params.get(i_93);
      if ( match_3.doesDefsMatch((p_27.nameNode.get()), (p2_2.nameNode.get()), ctx) == false ) {
        return false;
      }
    }
    return true;
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final Optional<RangerAppClassDesc> cl_9 = node.clDesc;
    if ( !cl_9.isPresent() ) {
      return;
    }
    wr.out("class " + cl_9.get().name, false);
    Optional<RangerAppClassDesc> parentClass_2 = Optional.empty();
    if ( (cl_9.get().extends_classes.size()) > 0 ) {
      wr.out(" : ", false);
      for ( int i_95 = 0; i_95 < cl_9.get().extends_classes.size(); i_95++) {
        String pName_3 = cl_9.get().extends_classes.get(i_95);
        wr.out(pName_3, false);
        parentClass_2 = Optional.of(ctx.findClass(pName_3));
      }
    }
    wr.out(" { ", true);
    wr.indent(1);
    for ( int i_99 = 0; i_99 < cl_9.get().variables.size(); i_99++) {
      RangerAppParamDesc pvar_5 = cl_9.get().variables.get(i_99);
      this.writeVarDef(pvar_5.node.get(), ctx, wr);
    }
    if ( cl_9.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_6 = cl_9.get().constructor_fn;
      boolean b_must_override = false;
      if ( parentClass_2.isPresent()) {
        if ( (constr_6.get().params.size()) == 0 ) {
          b_must_override = true;
        } else {
          if ( parentClass_2.get().has_constructor ) {
            final RangerAppFunctionDesc p_constr = parentClass_2.get().constructor_fn.get();
            if ( this.haveSameSig((constr_6.get()), p_constr, ctx) ) {
              b_must_override = true;
            }
          }
        }
      }
      if ( b_must_override ) {
        wr.out("override ", false);
      }
      wr.out("init(", false);
      this.writeArgsDef(constr_6.get(), ctx, wr);
      wr.out(" ) {", true);
      wr.indent(1);
      if ( parentClass_2.isPresent()) {
        wr.out("super.init()", true);
      }
      wr.newline();
      final RangerAppWriterContext subCtx_18 = constr_6.get().fnCtx.get();
      subCtx_18.is_function = true;
      this.WalkNode(constr_6.get().fnBody.get(), subCtx_18, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( int i_102 = 0; i_102 < cl_9.get().static_methods.size(); i_102++) {
      RangerAppFunctionDesc variant_4 = cl_9.get().static_methods.get(i_102);
      if ( variant_4.nameNode.get().hasFlag("main") ) {
        continue;
      }
      wr.out(("static func " + variant_4.name) + "(", false);
      this.writeArgsDef(variant_4, ctx, wr);
      wr.out(") -> ", false);
      this.writeTypeDef(variant_4.nameNode.get(), ctx, wr);
      wr.out(" {", true);
      wr.indent(1);
      wr.newline();
      final RangerAppWriterContext subCtx_23 = variant_4.fnCtx.get();
      subCtx_23.is_function = true;
      this.WalkNode(variant_4.fnBody.get(), subCtx_23, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( int i_105 = 0; i_105 < cl_9.get().defined_variants.size(); i_105++) {
      String fnVar_3 = cl_9.get().defined_variants.get(i_105);
      final Optional<RangerAppMethodVariants> mVs_3 = Optional.ofNullable(cl_9.get().method_variants.get(fnVar_3));
      for ( int i_112 = 0; i_112 < mVs_3.get().variants.size(); i_112++) {
        RangerAppFunctionDesc variant_9 = mVs_3.get().variants.get(i_112);
        wr.out(("func " + variant_9.name) + "(", false);
        this.writeArgsDef(variant_9, ctx, wr);
        wr.out(") -> ", false);
        this.writeTypeDef(variant_9.nameNode.get(), ctx, wr);
        wr.out(" {", true);
        wr.indent(1);
        wr.newline();
        final RangerAppWriterContext subCtx_26 = variant_9.fnCtx.get();
        subCtx_26.is_function = true;
        this.WalkNode(variant_9.fnBody.get(), subCtx_26, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    for ( int i_111 = 0; i_111 < cl_9.get().static_methods.size(); i_111++) {
      RangerAppFunctionDesc variant_12 = cl_9.get().static_methods.get(i_111);
      final boolean b_3 = variant_12.nameNode.get().hasFlag("main");
      if ( b_3 ) {
        wr.newline();
        final RangerAppWriterContext subCtx_29 = variant_12.fnCtx.get();
        subCtx_29.is_function = true;
        this.WalkNode(variant_12.fnBody.get(), subCtx_29, wr);
        wr.newline();
      }
    }
  }
}
