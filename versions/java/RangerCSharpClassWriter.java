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
    int v_type = node.value_type;
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
    }
    switch (v_type ) { 
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
        if ( i == 0 ) {
          if ( p.nameNode.get().hasFlag("optional") ) {
          }
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
      final CodeNode nn = node.children.get(1);
      final Optional<RangerAppParamDesc> p = nn.paramDesc;
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p.get().set_cnt > 0) || p.get().is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("const ", false);
      }
      this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
      wr.out(" ", false);
      wr.out(p.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value = node.getThird();
        this.WalkNode(value, ctx, wr);
        ctx.unsetInExpr();
      } else {
        if ( nn.value_type == 6 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
        }
        if ( nn.value_type == 7 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
        }
      }
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p.get().ref_cnt == 0) && (p.get().is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
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
      this.writeTypeDef(arg.nameNode.get(), ctx, wr);
      wr.out((" " + arg.name) + " ", false);
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl = node.clDesc;
    if ( !cl.isPresent() ) {
      return;
    }
    final CodeWriter wr = orig_wr.getFileWriter(".", (cl.get().name + ".cs"));
    final CodeWriter importFork = wr.fork();
    wr.out("", true);
    wr.out(("class " + cl.get().name) + " {", true);
    wr.indent(1);
    for ( int i = 0; i < cl.get().variables.size(); i++) {
      RangerAppParamDesc pvar = cl.get().variables.get(i);
      wr.out("public ", false);
      this.writeVarDef(pvar.node.get(), ctx, wr);
    }
    if ( cl.get().has_constructor ) {
      final RangerAppFunctionDesc constr = cl.get().constructor_fn.get();
      wr.out("", true);
      wr.out(cl.get().name + "(", false);
      this.writeArgsDef(constr, ctx, wr);
      wr.out(" ) {", true);
      wr.indent(1);
      wr.newline();
      final RangerAppWriterContext subCtx = constr.fnCtx.get();
      subCtx.is_function = true;
      this.WalkNode(constr.fnBody.get(), subCtx, wr);
      wr.newline();
      wr.indent(-1);
      wr.out("}", true);
    }
    for ( int i_1 = 0; i_1 < cl.get().static_methods.size(); i_1++) {
      RangerAppFunctionDesc variant = cl.get().static_methods.get(i_1);
      wr.out("", true);
      if ( variant.nameNode.get().hasFlag("main") && (!variant.nameNode.get().code.get().filename.equals(ctx.getRootFile())) ) {
        continue;
      }
      if ( variant.nameNode.get().hasFlag("main") ) {
        wr.out("static int Main( string [] args ) {", true);
      } else {
        wr.out("public static ", false);
        this.writeTypeDef(variant.nameNode.get(), ctx, wr);
        wr.out(" ", false);
        wr.out(variant.name + "(", false);
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
    for ( int i_2 = 0; i_2 < cl.get().defined_variants.size(); i_2++) {
      String fnVar = cl.get().defined_variants.get(i_2);
      final Optional<RangerAppMethodVariants> mVs = Optional.ofNullable(cl.get().method_variants.get(fnVar));
      for ( int i_3 = 0; i_3 < mVs.get().variants.size(); i_3++) {
        RangerAppFunctionDesc variant_1 = mVs.get().variants.get(i_3);
        wr.out("", true);
        wr.out("public ", false);
        this.writeTypeDef(variant_1.nameNode.get(), ctx, wr);
        wr.out(" ", false);
        wr.out(variant_1.name + "(", false);
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
    for ( int i_4 = 0; i_4 < import_list.size(); i_4++) {
      String codeStr = import_list.get(i_4);
      importFork.out(("using " + codeStr) + ";", true);
    }
  }
}
