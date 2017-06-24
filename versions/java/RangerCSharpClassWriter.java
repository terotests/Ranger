import java.util.Optional;
import java.util.*;

class RangerCSharpClassWriter extends RangerGenericClassWriter { 
  
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
  
  public String getTypeString( String type_string ) {
    switch (type_string ) { 
      case "int" : 
        return "int";
      case "string" : 
        return "String";
      case "chararray" : 
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
    int v_type_4 = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type_4 = node.eval_type;
    }
    switch (v_type_4 ) { 
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
        wr.out(((("Dictionary<" + this.getObjectTypeString(node.key_type, ctx)) + ",") + this.getObjectTypeString(node.array_type, ctx)) + ">", false);
        wr.addImport("System.Collections");
        break;
      case 6 : 
        wr.out(("List<" + this.getObjectTypeString(node.array_type, ctx)) + ">", false);
        wr.addImport("System.Collections");
        break;
      default: 
        if ( node.type_name.equals("void") ) {
          wr.out("void", false);
        } else {
          wr.out(this.getTypeString(node.type_name), false);
        }
        break;
    }
    if ( node.hasFlag("optional") ) {
      wr.out("?", false);
    }
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
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
    if ( (node.nsp.size()) > 0 ) {
      for ( int i_103 = 0; i_103 < node.nsp.size(); i_103++) {
        RangerAppParamDesc p_27 = node.nsp.get(i_103);
        if ( i_103 > 0 ) {
          wr.out(".", false);
        }
        if ( i_103 == 0 ) {
          if ( p_27.nameNode.get().hasFlag("optional") ) {
          }
        }
        if ( (p_27.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_27.compiledName), false);
        } else {
          if ( (p_27.name.length()) > 0 ) {
            wr.out(this.adjustType(p_27.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_103))), false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p_32 = node.paramDesc;
      wr.out(p_32.get().compiledName, false);
      return;
    }
    for ( int i_108 = 0; i_108 < node.ns.size(); i_108++) {
      String part_7 = node.ns.get(i_108);
      if ( i_108 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_7), false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_14 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_32 = nn_14.paramDesc;
      if ( (p_32.get().ref_cnt == 0) && (p_32.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p_32.get().set_cnt > 0) || p_32.get().is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("const ", false);
      }
      this.writeTypeDef(p_32.get().nameNode.get(), ctx, wr);
      wr.out(" ", false);
      wr.out(p_32.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_7 = node.getThird();
        this.WalkNode(value_7, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_14.value_type == 6 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p_32.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
        }
        if ( nn_14.value_type == 7 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p_32.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
        }
      }
      if ( (p_32.get().ref_cnt == 0) && (p_32.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_32.get().ref_cnt == 0) && (p_32.get().is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_108 = 0; i_108 < fnDesc.params.size(); i_108++) {
      RangerAppParamDesc arg_21 = fnDesc.params.get(i_108);
      if ( i_108 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.writeTypeDef(arg_21.nameNode.get(), ctx, wr);
      wr.out((" " + arg_21.name) + " ", false);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_10 = node.clDesc;
    if ( !cl_10.isPresent() ) {
      return;
    }
    final CodeWriter wr_7 = orig_wr.getFileWriter(".", (cl_10.get().name + ".cs"));
    final CodeWriter importFork_3 = wr_7.fork();
    wr_7.out("", true);
    wr_7.out(("class " + cl_10.get().name) + " {", true);
    wr_7.indent(1);
    for ( int i_110 = 0; i_110 < cl_10.get().variables.size(); i_110++) {
      RangerAppParamDesc pvar_7 = cl_10.get().variables.get(i_110);
      wr_7.out("public ", false);
      this.writeVarDef(pvar_7.node.get(), ctx, wr_7);
    }
    if ( cl_10.get().has_constructor ) {
      final RangerAppFunctionDesc constr_8 = cl_10.get().constructor_fn.get();
      wr_7.out("", true);
      wr_7.out(cl_10.get().name + "(", false);
      this.writeArgsDef(constr_8, ctx, wr_7);
      wr_7.out(" ) {", true);
      wr_7.indent(1);
      wr_7.newline();
      final RangerAppWriterContext subCtx_26 = constr_8.fnCtx.get();
      subCtx_26.is_function = true;
      this.WalkNode(constr_8.fnBody.get(), subCtx_26, wr_7);
      wr_7.newline();
      wr_7.indent(-1);
      wr_7.out("}", true);
    }
    for ( int i_114 = 0; i_114 < cl_10.get().static_methods.size(); i_114++) {
      RangerAppFunctionDesc variant_10 = cl_10.get().static_methods.get(i_114);
      wr_7.out("", true);
      if ( variant_10.nameNode.get().hasFlag("main") ) {
        wr_7.out("static int Main( string [] args ) {", true);
      } else {
        wr_7.out("public static ", false);
        this.writeTypeDef(variant_10.nameNode.get(), ctx, wr_7);
        wr_7.out(" ", false);
        wr_7.out(variant_10.name + "(", false);
        this.writeArgsDef(variant_10, ctx, wr_7);
        wr_7.out(") {", true);
      }
      wr_7.indent(1);
      wr_7.newline();
      final RangerAppWriterContext subCtx_31 = variant_10.fnCtx.get();
      subCtx_31.is_function = true;
      this.WalkNode(variant_10.fnBody.get(), subCtx_31, wr_7);
      wr_7.newline();
      wr_7.indent(-1);
      wr_7.out("}", true);
    }
    for ( int i_117 = 0; i_117 < cl_10.get().defined_variants.size(); i_117++) {
      String fnVar_5 = cl_10.get().defined_variants.get(i_117);
      final Optional<RangerAppMethodVariants> mVs_5 = Optional.ofNullable(cl_10.get().method_variants.get(fnVar_5));
      for ( int i_124 = 0; i_124 < mVs_5.get().variants.size(); i_124++) {
        RangerAppFunctionDesc variant_15 = mVs_5.get().variants.get(i_124);
        wr_7.out("", true);
        wr_7.out("public ", false);
        this.writeTypeDef(variant_15.nameNode.get(), ctx, wr_7);
        wr_7.out(" ", false);
        wr_7.out(variant_15.name + "(", false);
        this.writeArgsDef(variant_15, ctx, wr_7);
        wr_7.out(") {", true);
        wr_7.indent(1);
        wr_7.newline();
        final RangerAppWriterContext subCtx_34 = variant_15.fnCtx.get();
        subCtx_34.is_function = true;
        this.WalkNode(variant_15.fnBody.get(), subCtx_34, wr_7);
        wr_7.newline();
        wr_7.indent(-1);
        wr_7.out("}", true);
      }
    }
    wr_7.indent(-1);
    wr_7.out("}", true);
    final ArrayList<String> import_list_2 = wr_7.getImports();
    for ( int i_123 = 0; i_123 < import_list_2.size(); i_123++) {
      String codeStr_2 = import_list_2.get(i_123);
      importFork_3.out(("using " + codeStr_2) + ";", true);
    }
  }
}
