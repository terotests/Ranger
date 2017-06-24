import java.util.Optional;
import java.util.*;

class RangerScalaClassWriter extends RangerGenericClassWriter { 
  
  public String getObjectTypeString( String type_string , RangerAppWriterContext ctx ) {
    switch (type_string ) { 
      case "int" : 
        return "Int";
      case "string" : 
        return "String";
      case "boolean" : 
        return "Boolean";
      case "double" : 
        return "Double";
      case "chararray" : 
        return "Array[Byte]";
      case "char" : 
        return "byte";
    }
    return type_string;
  }
  
  public String getTypeString( String type_string ) {
    switch (type_string ) { 
      case "int" : 
        return "Int";
      case "string" : 
        return "String";
      case "boolean" : 
        return "Boolean";
      case "double" : 
        return "Double";
      case "chararray" : 
        return "Array[Byte]";
      case "char" : 
        return "byte";
    }
    return type_string;
  }
  
  public void writeTypeDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasFlag("optional") ) {
      wr.out("Option[", false);
    }
    int v_type_5 = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type_5 = node.eval_type;
    }
    switch (v_type_5 ) { 
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
      case 5 : 
        wr.out("Boolean", false);
        break;
      case 12 : 
        wr.out("Byte", false);
        break;
      case 13 : 
        wr.out("Array[Byte]", false);
        break;
      case 7 : 
        wr.addImport("scala.collection.mutable");
        wr.out(((("collection.mutable.HashMap[" + this.getObjectTypeString(node.key_type, ctx)) + ", ") + this.getObjectTypeString(node.array_type, ctx)) + "]", false);
        break;
      case 6 : 
        wr.addImport("scala.collection.mutable");
        wr.out(("collection.mutable.ArrayBuffer[" + this.getObjectTypeString(node.array_type, ctx)) + "]", false);
        break;
      default: 
        if ( node.type_name.equals("void") ) {
          wr.out("Unit", false);
          return;
        }
        wr.out(this.getTypeString(node.type_name), false);
        break;
    }
    if ( node.hasFlag("optional") ) {
      wr.out("]", false);
    }
  }
  
  public void writeTypeDefNoOption( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    int v_type_8 = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type_8 = node.eval_type;
    }
    switch (v_type_8 ) { 
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
      case 5 : 
        wr.out("Boolean", false);
        break;
      case 12 : 
        wr.out("Byte", false);
        break;
      case 13 : 
        wr.out("Array[Byte]", false);
        break;
      case 7 : 
        wr.addImport("scala.collection.mutable");
        wr.out(((("collection.mutable.HashMap[" + this.getObjectTypeString(node.key_type, ctx)) + ", ") + this.getObjectTypeString(node.array_type, ctx)) + "]", false);
        break;
      case 6 : 
        wr.addImport("scala.collection.mutable");
        wr.out(("collection.mutable.ArrayBuffer[" + this.getObjectTypeString(node.array_type, ctx)) + "]", false);
        break;
      default: 
        if ( node.type_name.equals("void") ) {
          wr.out("Unit", false);
          return;
        }
        wr.out(this.getTypeString(node.type_name), false);
        break;
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
      for ( int i_111 = 0; i_111 < node.nsp.size(); i_111++) {
        RangerAppParamDesc p_30 = node.nsp.get(i_111);
        if ( i_111 > 0 ) {
          wr.out(".", false);
        }
        if ( (p_30.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_30.compiledName), false);
        } else {
          if ( (p_30.name.length()) > 0 ) {
            wr.out(this.adjustType(p_30.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_111))), false);
          }
        }
        if ( i_111 == 0 ) {
          if ( p_30.nameNode.get().hasFlag("optional") ) {
            wr.out(".get", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p_35 = node.paramDesc;
      wr.out(p_35.get().compiledName, false);
      return;
    }
    for ( int i_116 = 0; i_116 < node.ns.size(); i_116++) {
      String part_8 = node.ns.get(i_116);
      if ( i_116 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_8), false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p_35 = node.paramDesc;
      /** unused:  final CodeNode nn_15 = node.children.get(1)   **/ ;
      if ( (p_35.get().ref_cnt == 0) && (p_35.get().is_class_variable == false) ) {
        wr.out("/** unused ", false);
      }
      if ( (p_35.get().set_cnt > 0) || p_35.get().is_class_variable ) {
        wr.out(("var " + p_35.get().compiledName) + " : ", false);
      } else {
        wr.out(("val " + p_35.get().compiledName) + " : ", false);
      }
      this.writeTypeDef(p_35.get().nameNode.get(), ctx, wr);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_8 = node.getThird();
        this.WalkNode(value_8, ctx, wr);
        ctx.unsetInExpr();
      } else {
        boolean b_inited = false;
        if ( p_35.get().nameNode.get().value_type == 6 ) {
          b_inited = true;
          wr.out("= new collection.mutable.ArrayBuffer()", false);
        }
        if ( p_35.get().nameNode.get().value_type == 7 ) {
          b_inited = true;
          wr.out("= new collection.mutable.HashMap()", false);
        }
        if ( p_35.get().nameNode.get().hasFlag("optional") ) {
          wr.out(" = Option.empty[", false);
          this.writeTypeDefNoOption(p_35.get().nameNode.get(), ctx, wr);
          wr.out("]", false);
        } else {
          if ( b_inited == false ) {
            wr.out(" = _", false);
          }
        }
      }
      if ( (p_35.get().ref_cnt == 0) && (p_35.get().is_class_variable == false) ) {
        wr.out("**/ ", true);
      } else {
        wr.newline();
      }
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_116 = 0; i_116 < fnDesc.params.size(); i_116++) {
      RangerAppParamDesc arg_22 = fnDesc.params.get(i_116);
      if ( i_116 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      wr.out(arg_22.name + " : ", false);
      this.writeTypeDef(arg_22.nameNode.get(), ctx, wr);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_11 = node.clDesc;
    if ( !cl_11.isPresent() ) {
      return;
    }
    final CodeWriter wr_8 = orig_wr.getFileWriter(".", (cl_11.get().name + ".scala"));
    final CodeWriter importFork_4 = wr_8.fork();
    wr_8.out("", true);
    wr_8.out(("class " + cl_11.get().name) + " ", false);
    if ( cl_11.get().has_constructor ) {
      wr_8.out("(", false);
      final RangerAppFunctionDesc constr_9 = cl_11.get().constructor_fn.get();
      for ( int i_118 = 0; i_118 < constr_9.params.size(); i_118++) {
        RangerAppParamDesc arg_25 = constr_9.params.get(i_118);
        if ( i_118 > 0 ) {
          wr_8.out(", ", false);
        }
        wr_8.out(arg_25.name + " : ", false);
        this.writeTypeDef(arg_25.nameNode.get(), ctx, wr_8);
      }
      wr_8.out(")", false);
    }
    wr_8.out(" {", true);
    wr_8.indent(1);
    for ( int i_122 = 0; i_122 < cl_11.get().variables.size(); i_122++) {
      RangerAppParamDesc pvar_8 = cl_11.get().variables.get(i_122);
      this.writeVarDef(pvar_8.node.get(), ctx, wr_8);
    }
    if ( cl_11.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_14 = cl_11.get().constructor_fn;
      wr_8.newline();
      final RangerAppWriterContext subCtx_29 = constr_14.get().fnCtx.get();
      subCtx_29.is_function = true;
      this.WalkNode(constr_14.get().fnBody.get(), subCtx_29, wr_8);
      wr_8.newline();
    }
    for ( int i_125 = 0; i_125 < cl_11.get().defined_variants.size(); i_125++) {
      String fnVar_6 = cl_11.get().defined_variants.get(i_125);
      final Optional<RangerAppMethodVariants> mVs_6 = Optional.ofNullable(cl_11.get().method_variants.get(fnVar_6));
      for ( int i_132 = 0; i_132 < mVs_6.get().variants.size(); i_132++) {
        RangerAppFunctionDesc variant_12 = mVs_6.get().variants.get(i_132);
        wr_8.out("", true);
        wr_8.out("def ", false);
        wr_8.out(" ", false);
        wr_8.out(variant_12.name + "(", false);
        this.writeArgsDef(variant_12, ctx, wr_8);
        wr_8.out(") : ", false);
        this.writeTypeDef(variant_12.nameNode.get(), ctx, wr_8);
        wr_8.out(" = {", true);
        wr_8.indent(1);
        wr_8.newline();
        final RangerAppWriterContext subCtx_34 = variant_12.fnCtx.get();
        subCtx_34.is_function = true;
        this.WalkNode(variant_12.fnBody.get(), subCtx_34, wr_8);
        wr_8.newline();
        wr_8.indent(-1);
        wr_8.out("}", true);
      }
    }
    wr_8.indent(-1);
    wr_8.out("}", true);
    boolean b_had_app = false;
    Optional<RangerAppFunctionDesc> app_obj = Optional.empty();
    if ( (cl_11.get().static_methods.size()) > 0 ) {
      wr_8.out("", true);
      wr_8.out("// companion object for static methods of " + cl_11.get().name, true);
      wr_8.out(("object " + cl_11.get().name) + " {", true);
      wr_8.indent(1);
    }
    for ( int i_131 = 0; i_131 < cl_11.get().static_methods.size(); i_131++) {
      RangerAppFunctionDesc variant_17 = cl_11.get().static_methods.get(i_131);
      if ( variant_17.nameNode.get().hasFlag("main") ) {
        b_had_app = true;
        app_obj = Optional.of(variant_17);
        continue;
      }
      wr_8.out("", true);
      wr_8.out("def ", false);
      wr_8.out(" ", false);
      wr_8.out(variant_17.name + "(", false);
      this.writeArgsDef(variant_17, ctx, wr_8);
      wr_8.out(") : ", false);
      this.writeTypeDef(variant_17.nameNode.get(), ctx, wr_8);
      wr_8.out(" = {", true);
      wr_8.indent(1);
      wr_8.newline();
      final RangerAppWriterContext subCtx_37 = variant_17.fnCtx.get();
      subCtx_37.is_function = true;
      this.WalkNode(variant_17.fnBody.get(), subCtx_37, wr_8);
      wr_8.newline();
      wr_8.indent(-1);
      wr_8.out("}", true);
    }
    if ( (cl_11.get().static_methods.size()) > 0 ) {
      wr_8.newline();
      wr_8.indent(-1);
      wr_8.out("}", true);
    }
    if ( b_had_app ) {
      final Optional<RangerAppFunctionDesc> variant_20 = app_obj;
      wr_8.out("", true);
      wr_8.out("// application main function for " + cl_11.get().name, true);
      wr_8.out(("object App" + cl_11.get().name) + " extends App {", true);
      wr_8.indent(1);
      wr_8.indent(1);
      wr_8.newline();
      final RangerAppWriterContext subCtx_40 = variant_20.get().fnCtx.get();
      subCtx_40.is_function = true;
      this.WalkNode(variant_20.get().fnBody.get(), subCtx_40, wr_8);
      wr_8.newline();
      wr_8.indent(-1);
      wr_8.out("}", true);
    }
    final ArrayList<String> import_list_3 = wr_8.getImports();
    for ( int i_134 = 0; i_134 < import_list_3.size(); i_134++) {
      String codeStr_3 = import_list_3.get(i_134);
      importFork_4.out(("import " + codeStr_3) + ";", true);
    }
  }
}
