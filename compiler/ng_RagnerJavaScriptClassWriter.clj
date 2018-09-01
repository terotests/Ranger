class RangerJavaScriptClassWriter {
  Extends RangerGenericClassWriter
  def compiler:LiveCompiler
  def thisName:string "this"
  def wrote_header:boolean false
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
        return "Integer"
      }
      case "string" {
        return "String"
      }
      case "chararray" {
        return "byte[]"
      }
      case "char" {
        return "byte"
      }
      case "boolean" {
        return "Boolean"
      }
      case "double" {
        return "Double"
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
        return "String"
      }
      case "chararray" {
        return "byte[]"
      }
      case "char" {
        "byte"
      }
      case "boolean" {
        return "boolean"
      }
      case "double" {
        return "double"
      }
      this.default(return type_string
      )
    }
    return type_string
  }
  fn writeTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def v_type:int node.value_type
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
      case RangerNodeType.Char {
        wr.out("byte" false)
      }
      case RangerNodeType.CharBuffer {
        wr.out("byte[]" false)
      }
      case RangerNodeType.String {
        wr.out("String" false)
      }
      case RangerNodeType.Boolean {
        wr.out("boolean" false)
      }
      case RangerNodeType.Hash {
        wr.out((((("Dictionary<" + (this.getObjectTypeString())) + ",") + (this.getObjectTypeString())) + ">") false)
      }
      case RangerNodeType.Array {
        wr.out((("List<" + (this.getObjectTypeString())) + ">") false)
      }
      this.default(if (node.type_name == "void") {
        (wr.out("void" false))
      } {
        (wr.out((this.getTypeString(node.type_name)) false))
      }
      )
    }
    if (node.hasFlag("optional")) {
      wr.out("?" false)
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
          wr.out("." false)
        }
        if (i == 0) {
          if (p.nameNode.hasFlag("optional")) {
          }
          def part:string (itemAt node.ns 0)
          if ((part != "this") && (ctx.isMemberVariable(part))) {
            def currC:RangerAppClassDesc (ctx.getCurrentClass())
            def p2:RangerAppParamDesc (currC.findVariable(part))
            if (!null? p2) {
              wr.out((thisName + ".") false)
            }
          }
        }
        if ((strlen p.compiledName) > 0) {
          wr.out((this.adjustType()) false)
        } {
          if ((strlen p.name) > 0) {
            wr.out((this.adjustType()) false)
          } {
            wr.out((this.adjustType(itemAt node.ns i)) false)
          }
        }
      }
      return
    }
    if node.hasParamDesc {
      def part:string (itemAt node.ns 0)
      if ((part != "this") && (ctx.isMemberVariable(part))) {
        def currC:RangerAppClassDesc (ctx.getCurrentClass())
        def p:RangerAppParamDesc (currC.findVariable(part))
        if (!null? p) {
          wr.out((thisName + ".") false)
        }
      }
      def p:RangerAppParamDesc node.paramDesc
      wr.out(p.compiledName false)
      return
    }
    def b_was_static:boolean false
    for node.ns part:string part:string {
      if (i > 0) {
        if ((i == 1) && b_was_static) {
          wr.out("." false)
        } {
          wr.out("." false)
        }
      }
      if (i == 0) {
        if (ctx.hasClass(part)) {
          b_was_static = true
        } {
          wr.out("" false)
        }
        if ((part != "this") && (ctx.isMemberVariable(part))) {
          def currC:RangerAppClassDesc (ctx.getCurrentClass())
          def p:RangerAppParamDesc (currC.findVariable(part))
          if (!null? p) {
            wr.out((thisName + ".") false)
          }
        }
      }
      wr.out((this.adjustType()) false)
    }
  }
  fn writeVarInitDef (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      def remove_unused:boolean (ctx.hasCompilerFlag("remove-unused-class-vars"))
      if ((p.ref_cnt == 0) && (remove_unused || (p.is_class_variable == false))) {
        wr.out("/** unused:  " false)
      }
      wr.out(("this." + p.compiledName) false)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = []" false)
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = {}" false)
        }
      }
      if ((p.ref_cnt == 0) && (remove_unused || (p.is_class_variable == false))) {
        wr.out("   **/" true)
        return
      }
      wr.out(";" false)
      if ((p.ref_cnt == 0) && (p.is_class_variable == true)) {
        wr.out("     /** note: unused */" false)
      }
      wr.newline()
    }
  }
  fn writeVarDef (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      def opt_js:boolean (ctx.hasCompilerFlag("optimize-js"))
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("/** unused:  " false)
      }
      wr.out(("var " + p.compiledName) false)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = []" false)
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = []" false)
        }
      }
      if ((p.ref_cnt == 0) && (p.is_class_variable == true)) {
        wr.out("     /** note: unused */" false)
      }
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("   **/ " true)
      } {
        wr.out("" false)
        wr.newline()
      }
    }
  }
  fn writeClassVarDef (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }
  fn writeArgsDef (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc arg:RangerAppParamDesc {
      if (i > 0) {
        wr.out("," false)
      }
      wr.out((arg.name + " ") false)
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
      if ((ctx.expressionLevel()) == 0) {
        wr.out(";" true)
      }
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
  fn writeClass (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    def wr:CodeWriter orig_wr
    def importFork:CodeWriter (wr.fork())
    if (wrote_header == false) {
      wr.out("" true)
      wrote_header = true
    }
    wr.out((("class " + cl.name) + " {") true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc pvar:RangerAppParamDesc {
      this.writeClassVarDef(pvar.node ctx wr)
    }
    wr.out("" true)
    wr.out("constructor(" false)
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      this.writeArgsDef(constr ctx wr)
    }
    wr.out(" ) {" true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc pvar:RangerAppParamDesc {
      this.writeVarInitDef(pvar.node ctx wr)
    }
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      wr.newline()
      def subCtx:RangerAppWriterContext constr.fnCtx
      subCtx.is_function = true
      this.WalkNode(constr.fnBody subCtx wr)
    }
    wr.newline()
    wr.indent(-1)
    wr.out("}" true)
    for cl.defined_variants fnVar:string fnVar:string {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc variant:RangerAppFunctionDesc {
        wr.out("" true)
        wr.out((("" + variant.name) + "(") false)
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
    wr.indent(-1)
    wr.out("}" true)
    for cl.static_methods variant:RangerAppFunctionDesc variant:RangerAppFunctionDesc {
      wr.out("" true)
      if (variant.nameNode.hasFlag("main")) {
        continue _
      } {
        wr.out((((cl.name + ".") + variant.name) + " = function(") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") {" true)
      }
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext variant.fnCtx
      subCtx.is_function = true
      this.WalkNode(variant.fnBody subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    for cl.static_methods variant:RangerAppFunctionDesc variant:RangerAppFunctionDesc {
      ctx.disableCurrentClass()
      wr.out("" true)
      if (variant.nameNode.hasFlag("main")) {
        wr.out("/* static JavaSript main routine */" false)
        wr.newline()
        this.WalkNode(variant.fnBody ctx wr)
        wr.newline()
      }
    }
  }
}

