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
    int v_type_6 = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type_6 = node.eval_type;
    }
    switch (v_type_6 ) { 
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
    int v_type_9 = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type_9 = node.eval_type;
    }
    switch (v_type_9 ) { 
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
        final String rootObjName_10 = node.ns.get(0);
        final String enumName_10 = node.ns.get(1);
        final Optional<RangerAppEnum> e_16 = ctx.getEnum(rootObjName_10);
        if ( e_16.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e_16.get().values.get(enumName_10))).get()), false);
          return;
        }
      }
    }
    if ( (node.nsp.size()) > 0 ) {
      for ( int i_127 = 0; i_127 < node.nsp.size(); i_127++) {
        RangerAppParamDesc p_34 = node.nsp.get(i_127);
        if ( i_127 > 0 ) {
          wr.out(".", false);
        }
        if ( (p_34.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_34.compiledName), false);
        } else {
          if ( (p_34.name.length()) > 0 ) {
            wr.out(this.adjustType(p_34.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_127))), false);
          }
        }
        if ( i_127 == 0 ) {
          if ( p_34.nameNode.get().hasFlag("optional") ) {
            wr.out(".get", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p_39 = node.paramDesc;
      wr.out(p_39.get().compiledName, false);
      return;
    }
    for ( int i_132 = 0; i_132 < node.ns.size(); i_132++) {
      String part_10 = node.ns.get(i_132);
      if ( i_132 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_10), false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p_39 = node.paramDesc;
      /** unused:  final CodeNode nn_18 = node.children.get(1)   **/ ;
      if ( (p_39.get().ref_cnt == 0) && (p_39.get().is_class_variable == false) ) {
        wr.out("/** unused ", false);
      }
      if ( (p_39.get().set_cnt > 0) || p_39.get().is_class_variable ) {
        wr.out(("var " + p_39.get().compiledName) + " : ", false);
      } else {
        wr.out(("val " + p_39.get().compiledName) + " : ", false);
      }
      this.writeTypeDef(p_39.get().nameNode.get(), ctx, wr);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_9 = node.getThird();
        this.WalkNode(value_9, ctx, wr);
        ctx.unsetInExpr();
      } else {
        boolean b_inited = false;
        if ( p_39.get().nameNode.get().value_type == 6 ) {
          b_inited = true;
          wr.out("= new collection.mutable.ArrayBuffer()", false);
        }
        if ( p_39.get().nameNode.get().value_type == 7 ) {
          b_inited = true;
          wr.out("= new collection.mutable.HashMap()", false);
        }
        if ( p_39.get().nameNode.get().hasFlag("optional") ) {
          wr.out(" = Option.empty[", false);
          this.writeTypeDefNoOption(p_39.get().nameNode.get(), ctx, wr);
          wr.out("]", false);
        } else {
          if ( b_inited == false ) {
            wr.out(" = _", false);
          }
        }
      }
      if ( (p_39.get().ref_cnt == 0) && (p_39.get().is_class_variable == false) ) {
        wr.out("**/ ", true);
      } else {
        wr.newline();
      }
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_132 = 0; i_132 < fnDesc.params.size(); i_132++) {
      RangerAppParamDesc arg_25 = fnDesc.params.get(i_132);
      if ( i_132 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      wr.out(arg_25.name + " : ", false);
      this.writeTypeDef(arg_25.nameNode.get(), ctx, wr);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_14 = node.clDesc;
    if ( !cl_14.isPresent() ) {
      return;
    }
    final CodeWriter wr_9 = orig_wr.getFileWriter(".", (cl_14.get().name + ".scala"));
    final CodeWriter importFork_4 = wr_9.fork();
    wr_9.out("", true);
    wr_9.out(("class " + cl_14.get().name) + " ", false);
    if ( cl_14.get().has_constructor ) {
      wr_9.out("(", false);
      final RangerAppFunctionDesc constr_13 = cl_14.get().constructor_fn.get();
      for ( int i_134 = 0; i_134 < constr_13.params.size(); i_134++) {
        RangerAppParamDesc arg_28 = constr_13.params.get(i_134);
        if ( i_134 > 0 ) {
          wr_9.out(", ", false);
        }
        wr_9.out(arg_28.name + " : ", false);
        this.writeTypeDef(arg_28.nameNode.get(), ctx, wr_9);
      }
      wr_9.out(")", false);
    }
    wr_9.out(" {", true);
    wr_9.indent(1);
    for ( int i_138 = 0; i_138 < cl_14.get().variables.size(); i_138++) {
      RangerAppParamDesc pvar_10 = cl_14.get().variables.get(i_138);
      this.writeVarDef(pvar_10.node.get(), ctx, wr_9);
    }
    if ( cl_14.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_18 = cl_14.get().constructor_fn;
      wr_9.newline();
      final RangerAppWriterContext subCtx_33 = constr_18.get().fnCtx.get();
      subCtx_33.is_function = true;
      this.WalkNode(constr_18.get().fnBody.get(), subCtx_33, wr_9);
      wr_9.newline();
    }
    for ( int i_141 = 0; i_141 < cl_14.get().defined_variants.size(); i_141++) {
      String fnVar_8 = cl_14.get().defined_variants.get(i_141);
      final Optional<RangerAppMethodVariants> mVs_8 = Optional.ofNullable(cl_14.get().method_variants.get(fnVar_8));
      for ( int i_148 = 0; i_148 < mVs_8.get().variants.size(); i_148++) {
        RangerAppFunctionDesc variant_17 = mVs_8.get().variants.get(i_148);
        wr_9.out("", true);
        wr_9.out("def ", false);
        wr_9.out(" ", false);
        wr_9.out(variant_17.name + "(", false);
        this.writeArgsDef(variant_17, ctx, wr_9);
        wr_9.out(") : ", false);
        this.writeTypeDef(variant_17.nameNode.get(), ctx, wr_9);
        wr_9.out(" = {", true);
        wr_9.indent(1);
        wr_9.newline();
        final RangerAppWriterContext subCtx_38 = variant_17.fnCtx.get();
        subCtx_38.is_function = true;
        this.WalkNode(variant_17.fnBody.get(), subCtx_38, wr_9);
        wr_9.newline();
        wr_9.indent(-1);
        wr_9.out("}", true);
      }
    }
    wr_9.indent(-1);
    wr_9.out("}", true);
    boolean b_had_app = false;
    Optional<RangerAppFunctionDesc> app_obj = Optional.empty();
    if ( (cl_14.get().static_methods.size()) > 0 ) {
      wr_9.out("", true);
      wr_9.out("// companion object for static methods of " + cl_14.get().name, true);
      wr_9.out(("object " + cl_14.get().name) + " {", true);
      wr_9.indent(1);
    }
    for ( int i_147 = 0; i_147 < cl_14.get().static_methods.size(); i_147++) {
      RangerAppFunctionDesc variant_22 = cl_14.get().static_methods.get(i_147);
      if ( variant_22.nameNode.get().hasFlag("main") ) {
        b_had_app = true;
        app_obj = Optional.of(variant_22);
        continue;
      }
      wr_9.out("", true);
      wr_9.out("def ", false);
      wr_9.out(" ", false);
      wr_9.out(variant_22.name + "(", false);
      this.writeArgsDef(variant_22, ctx, wr_9);
      wr_9.out(") : ", false);
      this.writeTypeDef(variant_22.nameNode.get(), ctx, wr_9);
      wr_9.out(" = {", true);
      wr_9.indent(1);
      wr_9.newline();
      final RangerAppWriterContext subCtx_41 = variant_22.fnCtx.get();
      subCtx_41.is_function = true;
      this.WalkNode(variant_22.fnBody.get(), subCtx_41, wr_9);
      wr_9.newline();
      wr_9.indent(-1);
      wr_9.out("}", true);
    }
    if ( (cl_14.get().static_methods.size()) > 0 ) {
      wr_9.newline();
      wr_9.indent(-1);
      wr_9.out("}", true);
    }
    if ( b_had_app ) {
      final Optional<RangerAppFunctionDesc> variant_25 = app_obj;
      wr_9.out("", true);
      wr_9.out("// application main function for " + cl_14.get().name, true);
      wr_9.out(("object App" + cl_14.get().name) + " extends App {", true);
      wr_9.indent(1);
      wr_9.indent(1);
      wr_9.newline();
      final RangerAppWriterContext subCtx_44 = variant_25.get().fnCtx.get();
      subCtx_44.is_function = true;
      this.WalkNode(variant_25.get().fnBody.get(), subCtx_44, wr_9);
      wr_9.newline();
      wr_9.indent(-1);
      wr_9.out("}", true);
    }
    final ArrayList<String> import_list_3 = wr_9.getImports();
    for ( int i_150 = 0; i_150 < import_list_3.size(); i_150++) {
      String codeStr_3 = import_list_3.get(i_150);
      importFork_4.out(("import " + codeStr_3) + ";", true);
    }
  }
}
