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
    int v_type_5 = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type_5 = node.eval_type;
    }
    switch (v_type_5 ) { 
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
        final String rootObjName_9 = node.ns.get(0);
        final String enumName_9 = node.ns.get(1);
        final Optional<RangerAppEnum> e_15 = ctx.getEnum(rootObjName_9);
        if ( e_15.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e_15.get().values.get(enumName_9))).get()), false);
          return;
        }
      }
    }
    if ( (node.nsp.size()) > 0 ) {
      for ( int i_119 = 0; i_119 < node.nsp.size(); i_119++) {
        RangerAppParamDesc p_31 = node.nsp.get(i_119);
        if ( i_119 > 0 ) {
          wr.out(".", false);
        }
        if ( i_119 == 0 ) {
          if ( p_31.nameNode.get().hasFlag("optional") ) {
          }
        }
        if ( (p_31.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_31.compiledName), false);
        } else {
          if ( (p_31.name.length()) > 0 ) {
            wr.out(this.adjustType(p_31.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_119))), false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p_36 = node.paramDesc;
      wr.out(p_36.get().compiledName, false);
      return;
    }
    for ( int i_124 = 0; i_124 < node.ns.size(); i_124++) {
      String part_9 = node.ns.get(i_124);
      if ( i_124 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_9), false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_17 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_36 = nn_17.paramDesc;
      if ( (p_36.get().ref_cnt == 0) && (p_36.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p_36.get().set_cnt > 0) || p_36.get().is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("const ", false);
      }
      this.writeTypeDef(p_36.get().nameNode.get(), ctx, wr);
      wr.out(" ", false);
      wr.out(p_36.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_8 = node.getThird();
        this.WalkNode(value_8, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn_17.value_type == 6 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p_36.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
        }
        if ( nn_17.value_type == 7 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p_36.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
        }
      }
      if ( (p_36.get().ref_cnt == 0) && (p_36.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_36.get().ref_cnt == 0) && (p_36.get().is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_124 = 0; i_124 < fnDesc.params.size(); i_124++) {
      RangerAppParamDesc arg_24 = fnDesc.params.get(i_124);
      if ( i_124 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.writeTypeDef(arg_24.nameNode.get(), ctx, wr);
      wr.out((" " + arg_24.name) + " ", false);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_13 = node.clDesc;
    if ( !cl_13.isPresent() ) {
      return;
    }
    final CodeWriter wr_8 = orig_wr.getFileWriter(".", (cl_13.get().name + ".cs"));
    final CodeWriter importFork_3 = wr_8.fork();
    wr_8.out("", true);
    wr_8.out(("class " + cl_13.get().name) + " {", true);
    wr_8.indent(1);
    for ( int i_126 = 0; i_126 < cl_13.get().variables.size(); i_126++) {
      RangerAppParamDesc pvar_9 = cl_13.get().variables.get(i_126);
      wr_8.out("public ", false);
      this.writeVarDef(pvar_9.node.get(), ctx, wr_8);
    }
    if ( cl_13.get().has_constructor ) {
      final RangerAppFunctionDesc constr_12 = cl_13.get().constructor_fn.get();
      wr_8.out("", true);
      wr_8.out(cl_13.get().name + "(", false);
      this.writeArgsDef(constr_12, ctx, wr_8);
      wr_8.out(" ) {", true);
      wr_8.indent(1);
      wr_8.newline();
      final RangerAppWriterContext subCtx_30 = constr_12.fnCtx.get();
      subCtx_30.is_function = true;
      this.WalkNode(constr_12.fnBody.get(), subCtx_30, wr_8);
      wr_8.newline();
      wr_8.indent(-1);
      wr_8.out("}", true);
    }
    for ( int i_130 = 0; i_130 < cl_13.get().static_methods.size(); i_130++) {
      RangerAppFunctionDesc variant_15 = cl_13.get().static_methods.get(i_130);
      wr_8.out("", true);
      if ( variant_15.nameNode.get().hasFlag("main") ) {
        wr_8.out("static int Main( string [] args ) {", true);
      } else {
        wr_8.out("public static ", false);
        this.writeTypeDef(variant_15.nameNode.get(), ctx, wr_8);
        wr_8.out(" ", false);
        wr_8.out(variant_15.name + "(", false);
        this.writeArgsDef(variant_15, ctx, wr_8);
        wr_8.out(") {", true);
      }
      wr_8.indent(1);
      wr_8.newline();
      final RangerAppWriterContext subCtx_35 = variant_15.fnCtx.get();
      subCtx_35.is_function = true;
      this.WalkNode(variant_15.fnBody.get(), subCtx_35, wr_8);
      wr_8.newline();
      wr_8.indent(-1);
      wr_8.out("}", true);
    }
    for ( int i_133 = 0; i_133 < cl_13.get().defined_variants.size(); i_133++) {
      String fnVar_7 = cl_13.get().defined_variants.get(i_133);
      final Optional<RangerAppMethodVariants> mVs_7 = Optional.ofNullable(cl_13.get().method_variants.get(fnVar_7));
      for ( int i_140 = 0; i_140 < mVs_7.get().variants.size(); i_140++) {
        RangerAppFunctionDesc variant_20 = mVs_7.get().variants.get(i_140);
        wr_8.out("", true);
        wr_8.out("public ", false);
        this.writeTypeDef(variant_20.nameNode.get(), ctx, wr_8);
        wr_8.out(" ", false);
        wr_8.out(variant_20.name + "(", false);
        this.writeArgsDef(variant_20, ctx, wr_8);
        wr_8.out(") {", true);
        wr_8.indent(1);
        wr_8.newline();
        final RangerAppWriterContext subCtx_38 = variant_20.fnCtx.get();
        subCtx_38.is_function = true;
        this.WalkNode(variant_20.fnBody.get(), subCtx_38, wr_8);
        wr_8.newline();
        wr_8.indent(-1);
        wr_8.out("}", true);
      }
    }
    wr_8.indent(-1);
    wr_8.out("}", true);
    final ArrayList<String> import_list_2 = wr_8.getImports();
    for ( int i_139 = 0; i_139 < import_list_2.size(); i_139++) {
      String codeStr_2 = import_list_2.get(i_139);
      importFork_3.out(("using " + codeStr_2) + ";", true);
    }
  }
}
