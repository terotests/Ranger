import java.util.Optional;
import java.util.*;

class RangerJava7ClassWriter extends RangerGenericClassWriter { 
  
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
      case "charbuffer" : 
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
      case "charbuffer" : 
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
    String t_name = node.type_name;
    String a_name_2 = node.array_type;
    String k_name = node.key_type;
    if ( ((v_type == 8) || (v_type == 9)) || (v_type == 0) ) {
      v_type = node.typeNameAsType(ctx);
    }
    if ( node.eval_type != 0 ) {
      v_type = node.eval_type;
      if ( (node.eval_type_name.length()) > 0 ) {
        t_name = node.eval_type_name;
      }
      if ( (node.eval_array_type.length()) > 0 ) {
        a_name_2 = node.eval_array_type;
      }
      if ( (node.eval_key_type.length()) > 0 ) {
        k_name = node.eval_key_type;
      }
    }
    if ( node.hasFlag("optional") ) {
      wr.addImport("java.util.Optional");
      wr.out("Optional<", false);
      switch (v_type ) { 
        case 11 : 
          wr.out("Integer", false);
          break;
        case 3 : 
          wr.out("Integer", false);
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
          wr.out("byte", false);
          break;
        case 13 : 
          wr.out("byte[]", false);
          break;
        case 7 : 
          wr.out(((("HashMap<" + this.getObjectTypeString(k_name, ctx)) + ",") + this.getObjectTypeString(a_name_2, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        case 6 : 
          wr.out(("ArrayList<" + this.getObjectTypeString(a_name_2, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        default: 
          if ( t_name.equals("void") ) {
            wr.out("void", false);
          } else {
            wr.out(this.getObjectTypeString(t_name, ctx), false);
          }
          break;
      }
    } else {
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
          wr.out(((("HashMap<" + this.getObjectTypeString(k_name, ctx)) + ",") + this.getObjectTypeString(a_name_2, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        case 6 : 
          wr.out(("ArrayList<" + this.getObjectTypeString(a_name_2, ctx)) + ">", false);
          wr.addImport("java.util.*");
          break;
        default: 
          if ( t_name.equals("void") ) {
            wr.out("void", false);
          } else {
            wr.out(this.getTypeString(t_name), false);
          }
          break;
      }
    }
    if ( node.hasFlag("optional") ) {
      wr.out(">", false);
    }
  }
  
  public void WriteVRef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.vref.equals("this") ) {
      wr.out("this", false);
      return;
    }
    if ( node.eval_type == 11 ) {
      if ( (node.ns.size()) > 1 ) {
        final String rootObjName_4 = node.ns.get(0);
        final String enumName_4 = node.ns.get(1);
        final Optional<RangerAppEnum> e_10 = ctx.getEnum(rootObjName_4);
        if ( e_10.isPresent() ) {
          wr.out("" + ((Optional.ofNullable(e_10.get().values.get(enumName_4))).get()), false);
          return;
        }
      }
    }
    final int max_len = node.ns.size();
    if ( (node.nsp.size()) > 0 ) {
      for ( int i_71 = 0; i_71 < node.nsp.size(); i_71++) {
        RangerAppParamDesc p_17 = node.nsp.get(i_71);
        if ( i_71 == 0 ) {
          final String part_2 = node.ns.get(0);
          if ( part_2.equals("this") ) {
            wr.out("this", false);
            continue;
          }
        }
        if ( i_71 > 0 ) {
          wr.out(".", false);
        }
        if ( (p_17.compiledName.length()) > 0 ) {
          wr.out(this.adjustType(p_17.compiledName), false);
        } else {
          if ( (p_17.name.length()) > 0 ) {
            wr.out(this.adjustType(p_17.name), false);
          } else {
            wr.out(this.adjustType((node.ns.get(i_71))), false);
          }
        }
        if ( i_71 < (max_len - 1) ) {
          if ( p_17.nameNode.get().hasFlag("optional") ) {
            wr.out(".get()", false);
          }
        }
      }
      return;
    }
    if ( node.hasParamDesc ) {
      final Optional<RangerAppParamDesc> p_22 = node.paramDesc;
      wr.out(p_22.get().compiledName, false);
      return;
    }
    for ( int i_76 = 0; i_76 < node.ns.size(); i_76++) {
      String part_7 = node.ns.get(i_76);
      if ( i_76 > 0 ) {
        wr.out(".", false);
      }
      wr.out(this.adjustType(part_7), false);
    }
  }
  
  public void writeVarDef( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    if ( node.hasParamDesc ) {
      final CodeNode nn_9 = node.children.get(1);
      final Optional<RangerAppParamDesc> p_22 = nn_9.paramDesc;
      if ( (p_22.get().ref_cnt == 0) && (p_22.get().is_class_variable == false) ) {
        wr.out("/** unused:  ", false);
      }
      if ( (p_22.get().set_cnt > 0) || p_22.get().is_class_variable ) {
        wr.out("", false);
      } else {
        wr.out("final ", false);
      }
      this.writeTypeDef(p_22.get().nameNode.get(), ctx, wr);
      wr.out(" ", false);
      wr.out(p_22.get().compiledName, false);
      if ( (node.children.size()) > 2 ) {
        wr.out(" = ", false);
        ctx.setInExpr();
        final CodeNode value_3 = node.getThird();
        this.WalkNode(value_3, ctx, wr);
        ctx.unsetInExpr();
      } else {
        boolean b_was_set = false;
        if ( nn_9.value_type == 6 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p_22.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( nn_9.value_type == 7 ) {
          wr.out(" = new ", false);
          this.writeTypeDef(p_22.get().nameNode.get(), ctx, wr);
          wr.out("()", false);
          b_was_set = true;
        }
        if ( (b_was_set == false) && nn_9.hasFlag("optional") ) {
          wr.out(" = Optional.empty()", false);
        }
      }
      if ( (p_22.get().ref_cnt == 0) && (p_22.get().is_class_variable == true) ) {
        wr.out("     /** note: unused */", false);
      }
      if ( (p_22.get().ref_cnt == 0) && (p_22.get().is_class_variable == false) ) {
        wr.out("   **/ ;", true);
      } else {
        wr.out(";", false);
        wr.newline();
      }
    }
  }
  
  public void writeArgsDef( RangerAppFunctionDesc fnDesc , RangerAppWriterContext ctx , CodeWriter wr ) {
    for ( int i_76 = 0; i_76 < fnDesc.params.size(); i_76++) {
      RangerAppParamDesc arg_14 = fnDesc.params.get(i_76);
      if ( i_76 > 0 ) {
        wr.out(",", false);
      }
      wr.out(" ", false);
      this.writeTypeDef(arg_14.nameNode.get(), ctx, wr);
      wr.out((" " + arg_14.name) + " ", false);
    }
  }
  
  public void CustomOperator( CodeNode node , RangerAppWriterContext ctx , CodeWriter wr ) {
    final CodeNode fc_23 = node.getFirst();
    final String cmd_2 = fc_23.vref;
    if ( cmd_2.equals("return") ) {
      wr.newline();
      if ( (node.children.size()) > 1 ) {
        final CodeNode value_6 = node.getSecond();
        if ( value_6.hasParamDesc ) {
          final CodeNode nn_12 = value_6.paramDesc.get().nameNode.get();
          if ( ctx.isDefinedClass(nn_12.type_name) ) {
            /** unused:  final RangerAppClassDesc cl_4 = ctx.findClass(nn_12.type_name)   **/ ;
            final RangerAppFunctionDesc activeFn_4 = ctx.getCurrentMethod();
            final CodeNode fnNameNode = activeFn_4.nameNode.get();
            if ( fnNameNode.hasFlag("optional") ) {
              wr.out("return Optional.ofNullable((", false);
              this.WalkNode(value_6, ctx, wr);
              wr.out(".isPresent() ? (", false);
              wr.out(fnNameNode.type_name, false);
              wr.out(")", false);
              this.WalkNode(value_6, ctx, wr);
              wr.out(".get() : null ) );", true);
              return;
            }
          }
        }
        wr.out("return ", false);
        ctx.setInExpr();
        this.WalkNode(value_6, ctx, wr);
        ctx.unsetInExpr();
        wr.out(";", true);
      } else {
        wr.out("return;", true);
      }
    }
  }
  
  public void writeClass( CodeNode node , RangerAppWriterContext ctx , CodeWriter orig_wr ) {
    final Optional<RangerAppClassDesc> cl_7 = node.clDesc;
    if ( !cl_7.isPresent() ) {
      return;
    }
    HashMap<String,Boolean> declaredVariable = new HashMap<String,Boolean>();
    if ( (cl_7.get().extends_classes.size()) > 0 ) {
      for ( int i_78 = 0; i_78 < cl_7.get().extends_classes.size(); i_78++) {
        String pName = cl_7.get().extends_classes.get(i_78);
        final RangerAppClassDesc pC = ctx.findClass(pName);
        for ( int i_88 = 0; i_88 < pC.variables.size(); i_88++) {
          RangerAppParamDesc pvar_3 = pC.variables.get(i_88);
          declaredVariable.put(pvar_3.name, true);
        }
      }
    }
    final CodeWriter wr_5 = orig_wr.getFileWriter(".", (cl_7.get().name + ".java"));
    final CodeWriter importFork = wr_5.fork();
    wr_5.out("", true);
    wr_5.out("class " + cl_7.get().name, false);
    Optional<RangerAppClassDesc> parentClass = Optional.empty();
    if ( (cl_7.get().extends_classes.size()) > 0 ) {
      wr_5.out(" extends ", false);
      for ( int i_85 = 0; i_85 < cl_7.get().extends_classes.size(); i_85++) {
        String pName_6 = cl_7.get().extends_classes.get(i_85);
        wr_5.out(pName_6, false);
        parentClass = Optional.of(ctx.findClass(pName_6));
      }
    }
    wr_5.out(" { ", true);
    wr_5.indent(1);
    wr_5.createTag("utilities");
    for ( int i_88 = 0; i_88 < cl_7.get().variables.size(); i_88++) {
      RangerAppParamDesc pvar_8 = cl_7.get().variables.get(i_88);
      if ( declaredVariable.containsKey(pvar_8.name) ) {
        continue;
      }
      wr_5.out("public ", false);
      this.writeVarDef(pvar_8.node.get(), ctx, wr_5);
    }
    if ( cl_7.get().has_constructor ) {
      final Optional<RangerAppFunctionDesc> constr_2 = cl_7.get().constructor_fn;
      wr_5.out("", true);
      wr_5.out(cl_7.get().name + "(", false);
      this.writeArgsDef(constr_2.get(), ctx, wr_5);
      wr_5.out(" ) {", true);
      wr_5.indent(1);
      wr_5.newline();
      final RangerAppWriterContext subCtx_15 = constr_2.get().fnCtx.get();
      subCtx_15.is_function = true;
      this.WalkNode(constr_2.get().fnBody.get(), subCtx_15, wr_5);
      wr_5.newline();
      wr_5.indent(-1);
      wr_5.out("}", true);
    }
    for ( int i_91 = 0; i_91 < cl_7.get().static_methods.size(); i_91++) {
      RangerAppFunctionDesc variant_2 = cl_7.get().static_methods.get(i_91);
      wr_5.out("", true);
      if ( variant_2.nameNode.get().hasFlag("main") ) {
        wr_5.out("public static void main(String [] args ) {", true);
      } else {
        wr_5.out("public static ", false);
        this.writeTypeDef(variant_2.nameNode.get(), ctx, wr_5);
        wr_5.out(" ", false);
        wr_5.out(variant_2.name + "(", false);
        this.writeArgsDef(variant_2, ctx, wr_5);
        wr_5.out(") {", true);
      }
      wr_5.indent(1);
      wr_5.newline();
      final RangerAppWriterContext subCtx_20 = variant_2.fnCtx.get();
      subCtx_20.is_function = true;
      this.WalkNode(variant_2.fnBody.get(), subCtx_20, wr_5);
      wr_5.newline();
      wr_5.indent(-1);
      wr_5.out("}", true);
    }
    for ( int i_94 = 0; i_94 < cl_7.get().defined_variants.size(); i_94++) {
      String fnVar_2 = cl_7.get().defined_variants.get(i_94);
      final Optional<RangerAppMethodVariants> mVs_2 = Optional.ofNullable(cl_7.get().method_variants.get(fnVar_2));
      for ( int i_101 = 0; i_101 < mVs_2.get().variants.size(); i_101++) {
        RangerAppFunctionDesc variant_7 = mVs_2.get().variants.get(i_101);
        wr_5.out("", true);
        wr_5.out("public ", false);
        this.writeTypeDef(variant_7.nameNode.get(), ctx, wr_5);
        wr_5.out(" ", false);
        wr_5.out(variant_7.name + "(", false);
        this.writeArgsDef(variant_7, ctx, wr_5);
        wr_5.out(") {", true);
        wr_5.indent(1);
        wr_5.newline();
        final RangerAppWriterContext subCtx_23 = variant_7.fnCtx.get();
        subCtx_23.is_function = true;
        this.WalkNode(variant_7.fnBody.get(), subCtx_23, wr_5);
        wr_5.newline();
        wr_5.indent(-1);
        wr_5.out("}", true);
      }
    }
    wr_5.indent(-1);
    wr_5.out("}", true);
    final ArrayList<String> import_list = wr_5.getImports();
    for ( int i_100 = 0; i_100 < import_list.size(); i_100++) {
      String codeStr = import_list.get(i_100);
      importFork.out(("import " + codeStr) + ";", true);
    }
  }
}
