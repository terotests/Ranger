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
    int v_type = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
    }
    switch (v_type ) { 
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
    int v_type = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
    }
    switch (v_type ) { 
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
        final String rootObjName = node.ns.get(0);
        final String enumName = node.ns.get(1);
        final Optional<RangerAppEnum> e = ctx.getEnum(rootObjName);
        if ( e.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e.get().values.get(enumName))).get()), false);
          return;
        }
      }
    }
    if ( (node.nsp.size()) > 0 ) {
      for ( int i = 0; i < node.nsp.size(); i++) {
        RangerAppParamDesc p = node.nsp.get(i);
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
        if ( i == 0 ) {
          if ( p.nameNode.get().hasFlag("optional") ) {
            wr.out(".get", false);
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
      String part = node.ns.get(i_1);
      if ( i_1 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part), false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p = node.paramDesc;
      /** unused:  final CodeNode nn = node.children.get(1)   **/ ;
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("/** unused ", false);
      }
      if ( (p.get().set_cnt > 0) || p.get().is_class_variable ) {
        wr.out(("var " + p.get().compiledName) + " : ", false);
      } else {
        wr.out(("val " + p.get().compiledName) + " : ", false);
      }
      this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        boolean b_inited = false;
        if ( p.get().nameNode.get().value_type == 6 ) {
          b_inited = true;
          wr.out("= new collection.mutable.ArrayBuffer()", false);
        }
        if ( p.get().nameNode.get().value_type == 7 ) {
          b_inited = true;
          wr.out("= new collection.mutable.HashMap()", false);
        }
        if ( p.get().nameNode.get().hasFlag("optional") ) {
          wr.out(" = Option.empty[", false);
          this.writeTypeDefNoOption(p.get().nameNode.get(), ctx, wr);
          wr.out("]", false);
        } else {
          if ( b_inited == false ) {
            wr.out(" = _", false);
          }
        }
      }
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("**/ ", true);
      } else {
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
      wr.out(arg.name + " : ", false);
      this.writeTypeDef(arg.nameNode.get(), ctx, wr);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl = node.clDesc;
    if ( !cl.isPresent() ) {
      return;
    }
    final CodeWriter wr = orig_wr.getFileWriter(".", (cl.get().name + ".scala"));
    final CodeWriter importFork = wr.fork();
    wr.out("", true);
    wr.out(("class " + cl.get().name) + " ", false);
    if ( cl.get().has_constructor ) {
      wr.out("(", false);
      final RangerAppFunctionDesc constr = cl.get().constructor_fn.get();
      for ( int i = 0; i < constr.params.size(); i++) {
        RangerAppParamDesc arg = constr.params.get(i);
        if ( i > 0 ) {
          wr.out(", ", false);
        }
        wr.out(arg.name + " : ", false);
        this.writeTypeDef(arg.nameNode.get(), ctx, wr);
      }
      wr.out(")", false);
    }
    wr.out(" {", true);
    wr.indent(1);
    for ( int i_1 = 0; i_1 < cl.get().variables.size(); i_1++) {
      RangerAppParamDesc pvar = cl.get().variables.get(i_1);
      this.writeVarDef(pvar.node.get(), ctx, wr);
    }
    if ( cl.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_1 = cl.get().constructor_fn;
      wr.newline();
      final RangerAppWriterContext subCtx = constr_1.get().fnCtx.get();
      subCtx.is_function = true;
      this.WalkNode(constr_1.get().fnBody.get(), subCtx, wr);
      wr.newline();
    }
    for ( int i_2 = 0; i_2 < cl.get().defined_variants.size(); i_2++) {
      String fnVar = cl.get().defined_variants.get(i_2);
      final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(cl.get().method_variants.get(fnVar));
      for ( int i_3 = 0; i_3 < mVs.get().variants.size(); i_3++) {
        RangerAppFunctionDesc variant = mVs.get().variants.get(i_3);
        wr.out("", true);
        wr.out("def ", false);
        wr.out(" ", false);
        wr.out(variant.name + "(", false);
        this.writeArgsDef(variant, ctx, wr);
        wr.out(") : ", false);
        this.writeTypeDef(variant.nameNode.get(), ctx, wr);
        wr.out(" = {", true);
        wr.indent(1);
        wr.newline();
        final RangerAppWriterContext subCtx_1 = variant.fnCtx.get();
        subCtx_1.is_function = true;
        this.WalkNode(variant.fnBody.get(), subCtx_1, wr);
        wr.newline();
        wr.indent(-1);
        wr.out("}", true);
      }
    }
    wr.indent(-1);
    wr.out("}", true);
    boolean b_had_app = false;
    Optional<RangerAppFunctionDesc> app_obj = Optional.empty();
    if ( (cl.get().static_methods.size()) > 0 ) {
      wr.out("", true);
      wr.out("// companion object for static methods of " + cl.get().name, true);
      wr.out(("object " + cl.get().name) + " {", true);
      wr.indent(1);
    }
    for ( int i_4 = 0; i_4 < cl.get().static_methods.size(); i_4++) {
      RangerAppFunctionDesc variant_1 = cl.get().static_methods.get(i_4);
      if ( variant_1.nameNode.get().hasFlag("main") ) {
        b_had_app = true;
        app_obj = Optional.of(variant_1);
        continue;
      }
      wr.out("", true);
      wr.out("def ", false);
      wr.out(" ", false);
      wr.out(variant_1.name + "(", false);
      this.writeArgsDef(variant_1, ctx, wr);
      wr.out(") : ", false);
      this.writeTypeDef(variant_1.nameNode.get(), ctx, wr);
      wr.out(" = {", true);
      wr.indent(1);
      wr.newline();
      final RangerAppWriterContext subCtx_2 = variant_1.fnCtx.get();
      subCtx_2.is_function = true;
      this.WalkNode(variant_1.fnBody.get(), subCtx_2, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    if ( (cl.get().static_methods.size()) > 0 ) {
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    if ( b_had_app ) {
      final Optional<RangerAppFunctionDesc> variant_2 = app_obj;
      wr.out("", true);
      wr.out("// application main function for " + cl.get().name, true);
      wr.out(("object App" + cl.get().name) + " extends App {", true);
      wr.indent(1);
      wr.indent(1);
      wr.newline();
      final RangerAppWriterContext subCtx_3 = variant_2.get().fnCtx.get();
      subCtx_3.is_function = true;
      this.WalkNode(variant_2.get().fnBody.get(), subCtx_3, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    final ArrayList<String> import_list = wr.getImports();
    for ( int i_5 = 0; i_5 < import_list.size(); i_5++) {
      String codeStr = import_list.get(i_5);
      importFork.out(("import " + codeStr) + ";", true);
    }
  }
}
