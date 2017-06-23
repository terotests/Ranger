class RangerCppClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
  fn adjustType:string (tn:string) {
    if (tn == "this") {
      return "this"
    } {
      return tn
    }
  }
  fn getObjectTypeString:string (type_string:string) {
    switch type_string {
      case "int" {
        return "int"
      }
      case "string" {
        return "std::string"
      }
      case "boolean" {
        return "bool"
      }
      case "double" {
        return "double"
      }
      this.default(return type_string
      )
    }
  }
  fn getTypeString:string (type_string:string) {
    switch type_string {
      case "int" {
        return "int"
      }
      case "string" {
        return "std::string"
      }
      case "boolean" {
        return "bool"
      }
      case "double" {
        return "double"
      }
      this.default(return type_string
      )
    }
    return type_string
  }
  fn writePtr:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.type_name == "void") {
      return
    }
    if (((node.isPrimitiveType()) == false) && ((node.isPrimitive()) == false)) {
      wr.out("*" false)
    }
  }
  fn writeTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def v_type:int node.value_type
    if ((v_type == RangerNodeType.VRef) || (v_type == RangerNodeType.NoType)) {
      v_type = node.typeNameAsType
    }
    if (node.eval_type != RangerNodeType.NoType) {
      v_type = node.eval_type
    }
    switch v_type {
      case RangerNodeType.Enum {
        wr.out("int" false)
      }
      case RangerNodeType.Integer {
        wr.out("int" false)
      }
      case RangerNodeType.Double {
        wr.out("double" false)
      }
      case RangerNodeType.String {
        wr.addImport("<string>")
        wr.out("std::string" false)
      }
      case RangerNodeType.Boolean {
        wr.out("bool" false)
      }
      case RangerNodeType.Hash {
        wr.out((((("std::map<" + (this.getObjectTypeString())) + ",") + (this.getObjectTypeString())) + ">") false)
        wr.addImport("<map>")
      }
      case RangerNodeType.Array {
        wr.out((("std::vector<" + (this.getObjectTypeString())) + ">") false)
        wr.addImport("<vector>")
      }
      this.default(if (node.type_name == "void") {
        (wr.out("void" false))
      } {
        (wr.out((this.getTypeString(node.type_name)) false))
      }
      )
    }
  }
  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.eval_type == RangerNodeType.Enum) {
      def rootObjName:string (itemAt node.ns 0)
      def enumName:string (itemAt node.ns 1)
      def e:RangerAppEnum (ctx.getEnum(rootObjName))
      if (!null? e) {
        wr.out(("" + (get e.values enumName)) false)
        return
      }
    }
    if ((array_length node.nsp) > 0) {
      for node.nsp p:RangerAppParamDesc p:RangerAppParamDesc {
        if (null? p) {
          ctx.addError(node ("Invalid reference:" + (itemAt node.ns i)))
          return
        }
        if (i > 0) {
          wr.out("->" false)
        }
        if (i == 0) {
          if (p.nameNode.hasFlag("optional")) {
            wr.out("*" false)
          }
        }
        if ((strlen p.compiledName) > 0) {
          wr.out((this.adjustType()) false)
        } {
          if ((strlen p.name) > 0) {
            wr.out((this.adjustType()) false)
          } {
            wr.out((this.adjustType( (itemAt node.ns i))) false)
          }
        }
      }
      return
    }
    if node.hasParamDesc {
      def p:RangerAppParamDesc node.paramDesc
      wr.out(p.compiledName false)
      return
    }
    for node.ns part:string part:string {
      if (i > 0) {
        wr.out("->" false)
      }
      wr.out((this.adjustType()) false)
    }
  }
  fn writeVarDef (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("/** unused:  " false)
      }
      if (nn.hasFlag("optional")) {
        wr.addImport("\"boost-optional.hpp\"")
        wr.out((("var " + p.compiledName) + " *CppOptional = new CppOptional(); ") true)
        if ((array_length node.children) > 2) {
          wr.out((p.compiledName + "->value = ") false)
          ctx.setInExpr()
          def value:CodeNode (node.getThird())
          this.WalkNode(value ctx wr)
          ctx.unsetInExpr()
          if value.hasParamDesc {
            def pnn:CodeNode value.paramDesc.nameNode
            if (pnn.hasFlag("optional")) {
              wr.out("->value" false)
              wr.out(";" true)
              wr.out((p.compiledName + "->has_value = ") false)
              ctx.setInExpr()
              def value:CodeNode (node.getThird())
              this.WalkNode(value ctx wr)
              ctx.unsetInExpr()
              wr.out("->has_value;" true)
              return
            }
          }
          wr.out(";" true)
          wr.out((p.compiledName + "->has_value = true;") true)
        }
        return
      }
      if ((p.set_cnt > 0) || p.is_class_variable) {
        wr.out("" false)
      } {
        wr.out("" false)
      }
      this.writeTypeDef(p.nameNode ctx wr)
      this.writePtr(node ctx wr)
      wr.out(" " false)
      wr.out(p.compiledName false)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = new " false)
          this.writeTypeDef(p.nameNode ctx wr)
          wr.out("()" false)
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = new " false)
          this.writeTypeDef(p.nameNode ctx wr)
          wr.out("()" false)
        }
      }
      if ((p.ref_cnt == 0) && (p.is_class_variable == true)) {
        wr.out("     /** note: unused */" false)
      }
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("   **/ ;" true)
      } {
        wr.out(";" false)
        wr.newline()
      }
    }
  }
  fn writeCppHeaderVar (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter do_initialize:boolean) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      if (p.nameNode.hasFlag("optional")) {
        wr.out("CppOptional* " false)
        wr.out((p.compiledName + ";") true)
        return
      }
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("/** unused:  " false)
      }
      if ((p.set_cnt > 0) || p.is_class_variable) {
        wr.out("" false)
      } {
        wr.out("" false)
      }
      this.writeTypeDef(p.nameNode ctx wr)
      wr.out(" " false)
      wr.out(p.compiledName false)
      if ((p.ref_cnt == 0) && (p.is_class_variable == true)) {
        wr.out("     /** note: unused */" false)
      }
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("   **/ ;" true)
      } {
        wr.out(";" false)
        wr.newline()
      }
    }
  }
  fn writeArgsDef (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc arg:RangerAppParamDesc {
      if (i > 0) {
        wr.out("," false)
      }
      wr.out(" " false)
      this.writeTypeDef(arg.nameNode ctx wr)
      this.writePtr(arg.nameNode ctx wr)
      wr.out(((" " + arg.name) + " ") false)
    }
  }
  fn writeFnCall (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasFnCall {
      def fc:CodeNode (node.getFirst())
      this.WriteVRef(fc ctx wr)
      wr.out("(" false)
      def givenArgs:CodeNode (node.getSecond())
      for node.fnDesc.params arg:RangerAppParamDesc arg:RangerAppParamDesc {
        def n:CodeNode (itemAt givenArgs.children i)
        if (i > 0) {
          wr.out(", " false)
        }
        if (null? n) {
          def defVal:CodeNode (arg.nameNode.getFlag("default"))
          if (!null? defVal) {
            def fc:CodeNode (defVal.vref_annotation.getFirst())
            this.WalkNode(fc ctx wr)
          } {
            ctx.addError(node "Default argument was missing")
          }
          continue _
        }
        this.WalkNode(n ctx wr)
      }
      wr.out(")" false)
    }
  }
  fn writeNewCall (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasNewOper {
      def cl:RangerAppClassDesc node.clDesc
      def fc:CodeNode (node.getSecond())
      wr.out(" new " false)
      wr.out(node.clDesc.name false)
      wr.out("(" false)
      def constr:RangerAppFunctionDesc cl.constructor_fn
      def givenArgs:CodeNode (node.getThird())
      if (!null? constr) {
        for constr.params arg:RangerAppParamDesc arg:RangerAppParamDesc {
          def n:CodeNode (itemAt givenArgs.children i)
          if (i > 0) {
            wr.out(", " false)
          }
          this.WalkNode(n ctx wr)
        }
      }
      wr.out(")" false)
    }
  }
  fn writeClassHeader (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    wr.out((("#ifndef " + cl.name) + "_HEADER ") true)
    wr.out((("#define " + cl.name) + "_HEADER ") true)
    wr.out((("class " + cl.name) + " { ") true)
    wr.indent(1)
    wr.out("public :" true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc pvar:RangerAppParamDesc {
      this.writeCppHeaderVar(pvar.node ctx wr false)
    }
    wr.out("" true)
    wr.out("/* class constructor */ " true)
    wr.out((cl.name + "(") false)
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      this.writeArgsDef(constr ctx wr)
    }
    wr.out(" );" true)
    for cl.static_methods variant:RangerAppFunctionDesc variant:RangerAppFunctionDesc {
      if (i == 0) {
        wr.out("" true)
        wr.out("/* static methods */ " true)
      }
      wr.out("static " false)
      this.writeTypeDef(variant.nameNode ctx wr)
      wr.out(((" " + variant.name) + "(") false)
      this.writeArgsDef(variant ctx wr)
      wr.out(");" true)
    }
    for cl.defined_variants fnVar:string fnVar:string {
      if (i == 0) {
        wr.out("" true)
        wr.out("/* instance methods */ " true)
      }
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc variant:RangerAppFunctionDesc {
        this.writeTypeDef(variant.nameNode ctx wr)
        wr.out(((" " + variant.name) + "(") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(");" true)
      }
    }
    wr.indent(-1)
    wr.indent(-1)
    wr.out("};" true)
    wr.out("#endif " true)
  }
  fn writeClass (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    def wr:CodeWriter (orig_wr.getFileWriter("." (cl.name + ".cpp")))
    def headerWriter:CodeWriter (orig_wr.getFileWriter("." (cl.name + ".hpp")))
    def projectHeaderWriter:CodeWriter (orig_wr.getFileWriter("." "project.hpp"))
    def projectName:string "project"
    projectHeaderWriter.out(((("#include \"" + cl.name) + ".hpp") + "\"") true)
    this.writeClassHeader(node ctx headerWriter)
    def importFork:CodeWriter (wr.fork())
    wr.out("" true)
    wr.out((((cl.name + "::") + cl.name) + "(") false)
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      this.writeArgsDef(constr ctx wr)
    }
    wr.out(" ) {" true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc pvar:RangerAppParamDesc {
      def nn:CodeNode pvar.nameNode
      if (nn.hasFlag("optional")) {
        wr.out((("CppOptional* " + pvar.compiledName) + " = new CppOptional();") true)
      }
    }
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      wr.newline()
      def subCtx:RangerAppWriterContext constr.fnCtx
      subCtx.is_function = true
      this.WalkNode(constr.fnBody subCtx wr)
      wr.newline()
    }
    wr.indent(-1)
    wr.out("}" true)
    for cl.static_methods variant:RangerAppFunctionDesc variant:RangerAppFunctionDesc {
      wr.out("" true)
      wr.out("static " false)
      this.writeTypeDef(variant.nameNode ctx wr)
      this.writePtr(variant.nameNode ctx wr)
      wr.out(((" " + cl.name) + "::") false)
      wr.out((variant.name + "(") false)
      this.writeArgsDef(variant ctx wr)
      wr.out(") {" true)
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext variant.fnCtx
      subCtx.is_function = true
      this.WalkNode(variant.fnBody subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    for cl.defined_variants fnVar:string fnVar:string {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc variant:RangerAppFunctionDesc {
        wr.out("" true)
        this.writeTypeDef(variant.nameNode ctx wr)
        this.writePtr(variant.nameNode ctx wr)
        wr.out(((" " + cl.name) + "::") false)
        wr.out((variant.name + "(") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") {" true)
        wr.indent(1)
        wr.newline()
        def subCtx:RangerAppWriterContext variant.fnCtx
        subCtx.is_function = true
        this.WalkNode(variant.fnBody subCtx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
      }
    }
    wr.addImport(((("\"" + projectName) + ".hpp") + "\""))
    def import_list:[string] (wr.getImports())
    for import_list codeStr:string codeStr:string {
      importFork.out(("#include " + codeStr + "") true)
    }
  }
}

