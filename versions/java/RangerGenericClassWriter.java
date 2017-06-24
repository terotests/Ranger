import java.util.Optional;

class RangerGenericClassWriter { 
  public Optional<LiveCompiler> compiler = Optional.empty();
  
  public String EncodeString( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    /** unused:  final String encoded_str_2 = ""   **/ ;
    final int str_length_2 = node.string_value.length();
    String encoded_str_8 = "";
    int ii_11 = 0;
    while (ii_11 < str_length_2) {final int cc_4 = (int)node.string_value.charAt(ii_11);
      switch (cc_4 ) { 
        case 8 : 
          encoded_str_8 = (encoded_str_8 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(98))));
          break;
        case 9 : 
          encoded_str_8 = (encoded_str_8 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(116))));
          break;
        case 10 : 
          encoded_str_8 = (encoded_str_8 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(110))));
          break;
        case 12 : 
          encoded_str_8 = (encoded_str_8 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(102))));
          break;
        case 13 : 
          encoded_str_8 = (encoded_str_8 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(114))));
          break;
        case 34 : 
          encoded_str_8 = (encoded_str_8 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(34))));
          break;
        case 92 : 
          encoded_str_8 = (encoded_str_8 + ((new String( Character.toChars(92))))) + ((new String( Character.toChars(92))));
          break;
        default: 
          encoded_str_8 = encoded_str_8 + ((new String( Character.toChars(cc_4))));
          break;
      }
      ii_11 = ii_11 + 1;
    }
    return encoded_str_8;
  }
  
  public void CustomOperator( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void WriteSetterVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void writeArrayTypeDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
  }
  
  public void WriteEnum( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.eval_type == 11 ) {
      final String rootObjName_2 = node.ns.get(0);
      final Optional<RangerAppEnum> e_8 = ctx.getEnum(rootObjName_2);
      if ( e_8.isPresent() ) {
        final String enumName_2 = node.ns.get(1);
        wr.out("" + ((Optional.ofNullable(e_8.get().values.get(enumName_2))).get()), false);
      } else {
        if ( node.hasParamDesc ) {
          final Optional<RangerAppParamDesc> pp_4 = node.paramDesc;
          final Optional<CodeNode> nn_8 = pp_4.get().nameNode;
          this.WriteVRef(nn_8.get(), ctx, wr);
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
        final String s_18 = this.EncodeString(node, ctx, wr);
        wr.out(("\"" + s_18) + "\"", false);
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
    for ( int i_61 = 0; i_61 < ctx.localVarNames.size(); i_61++) {
      String n_7 = ctx.localVarNames.get(i_61);
      final Optional<RangerAppParamDesc> p_14 = Optional.ofNullable(ctx.localVariables.get(n_7));
      if ( p_14.get().ref_cnt == 0 ) {
        continue;
      }
      if ( p_14.get().isAllocatedType() ) {
        if ( 1 == p_14.get().getStrength() ) {
          if ( p_14.get().nameNode.get().eval_type == 7 ) {
          }
          if ( p_14.get().nameNode.get().eval_type == 6 ) {
          }
          if ( (p_14.get().nameNode.get().eval_type != 6) && (p_14.get().nameNode.get().eval_type != 7) ) {
          }
        }
        if ( 0 == p_14.get().getStrength() ) {
          if ( p_14.get().nameNode.get().eval_type == 7 ) {
          }
          if ( p_14.get().nameNode.get().eval_type == 6 ) {
          }
          if ( (p_14.get().nameNode.get().eval_type != 6) && (p_14.get().nameNode.get().eval_type != 7) ) {
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
        final String rootObjName_5 = node.ns.get(0);
        final String enumName_5 = node.ns.get(1);
        final Optional<RangerAppEnum> e_11 = ctx.getEnum(rootObjName_5);
        if ( e_11.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e_11.get().values.get(enumName_5))).get()), false);
          return;
        }
      }
    }
    if ( (node.nsp.size()) > 0 ) {
      for ( int i_64 = 0; i_64 < node.nsp.size(); i_64++) {
        RangerAppParamDesc p_17 = node.nsp.get(i_64);
        if ( i_64 > 0 ) {
          wr.out(".", false);
        }
        if ( (p_17.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_17.compiledName), false);
        } else {
          if ( (p_17.name.length()) > 0 ) {
            wr.out(this.adjustType(p_17.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_64))), false);
          }
        }
      }
      return;
    }
    for ( int i_68 = 0; i_68 < node.ns.size(); i_68++) {
      String part = node.ns.get(i_68);
      if ( i_68 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part), false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p_19 = node.paramDesc;
      if ( p_19.get().set_cnt > 0 ) {
        wr.out("var " + p_19.get().name, false);
      } else {
        wr.out("const " + p_19.get().name, false);
      }
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_2 = node.getThird();
        this.WalkNode(value_2, ctx, wr);
        ctx.unsetInExpr();
        wr.out(";", true);
      } else {
        wr.out(";", true);
      }
    }
  }
  
  public void writeFnCall( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasFnCall ) {
      final CodeNode fc_20 = node.getFirst();
      this.WriteVRef(fc_20, ctx, wr);
      wr.out("(", false);
      final CodeNode givenArgs_2 = node.getSecond();
      ctx.setInExpr();
      for ( int i_68 = 0; i_68 < node.fnDesc.get().params.size(); i_68++) {
        RangerAppParamDesc arg_12 = node.fnDesc.get().params.get(i_68);
        if ( i_68 > 0 ) {
          wr.out(", ", false);
        }
        if ( (givenArgs_2.children.size()) <= i_68 ) {
          final Optional<CodeNode> defVal = arg_12.nameNode.get().getFlag("default");
          if ( defVal.isPresent() ) {
            final CodeNode fc_31 = defVal.get().vref_annotation.get().getFirst();
            this.WalkNode(fc_31, ctx, wr);
          } else {
            ctx.addError(node, "Default argument was missing");
          }
          continue;
        }
        final CodeNode n_10 = givenArgs_2.children.get(i_68);
        this.WalkNode(n_10, ctx, wr);
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
      final Optional<RangerAppClassDesc> cl_2 = node.clDesc;
      /** unused:  final CodeNode fc_25 = node.getSecond()   **/ ;
      wr.out("new " + node.clDesc.get().name, false);
      wr.out("(", false);
      final Optional<RangerAppFunctionDesc> constr = cl_2.get().constructor_fn;
      final CodeNode givenArgs_5 = node.getThird();
      if ( constr.isPresent() ) {
        for ( int i_70 = 0; i_70 < constr.get().params.size(); i_70++) {
          RangerAppParamDesc arg_15 = constr.get().params.get(i_70);
          final CodeNode n_12 = givenArgs_5.children.get(i_70);
          if ( i_70 > 0 ) {
            wr.out(", ", false);
          }
          if ( true || (arg_15.nameNode.isPresent()) ) {
            this.WalkNode(n_12, ctx, wr);
          }
        }
      }
      wr.out(")", false);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final Optional<RangerAppClassDesc> cl_5 = node.clDesc;
    if ( !cl_5.isPresent() ) {
      return;
    }
    wr.out(("class " + cl_5.get().name) + " { ", true);
    wr.indent(1);
    for ( int i_72 = 0; i_72 < cl_5.get().variables.size(); i_72++) {
      RangerAppParamDesc pvar = cl_5.get().variables.get(i_72);
      wr.out(((("/* var " + pvar.name) + " => ") + pvar.nameNode.get().parent.get().getCode()) + " */ ", true);
    }
    for ( int i_76 = 0; i_76 < cl_5.get().static_methods.size(); i_76++) {
      RangerAppFunctionDesc pvar_6 = cl_5.get().static_methods.get(i_76);
      wr.out(("/* static " + pvar_6.name) + " */ ", true);
    }
    for ( int i_79 = 0; i_79 < cl_5.get().defined_variants.size(); i_79++) {
      String fnVar = cl_5.get().defined_variants.get(i_79);
      final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(cl_5.get().method_variants.get(fnVar));
      for ( int i_86 = 0; i_86 < mVs.get().variants.size(); i_86++) {
        RangerAppFunctionDesc variant = mVs.get().variants.get(i_86);
        wr.out(("function " + variant.name) + "() {", true);
        wr.indent(1);
        wr.newline();
        final RangerAppWriterContext subCtx_14 = ctx.fork();
        this.WalkNode(variant.fnBody.get(), subCtx_14, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
  }
}
