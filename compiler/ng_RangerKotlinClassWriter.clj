class RangerKotlinClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
  fn WriteScalarValue:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    switch node.value_type {
      case RangerNodeType.Double {
        wr.out((node.getParsedString()) false)
      }
      case RangerNodeType.String {
        def s:string (this.EncodeString(node ctx wr))
        wr.out((("\"" + s) + "\"") false)
      }
      case RangerNodeType.Integer {
        wr.out(("" + node.int_value) false)
      }
      case RangerNodeType.Boolean {
        if node.boolean_value {
          wr.out("true" false)
        } {
          wr.out("false" false)
        }
      }
    }
  }
  fn adjustType:string (tn:string) {
    if (tn == "this") {
      return "this"
    }
    return tn
  }
  fn getObjectTypeString:string (type_string:string ctx:RangerAppWriterContext) {
    switch type_string {
      case "int" {
        return "Integer"
      }
      case "string" {
        return "String"
      }
      case "chararray" {
        return "CharArray"
      }
      case "char" {
        return "char"
      }
      case "boolean" {
        return "Boolean"
      }
      case "double" {
        return "Double"
      }
      default {
        return type_string
      }
    }
    return ""
  }
  fn getTypeString:string (type_string:string) {
    switch type_string {
      case "int" {
        return "Integer"
      }
      case "string" {
        return "String"
      }
      case "chararray" {
        return "CharArray"
      }
      case "char" {
        return "Char"
      }
      case "boolean" {
        return "Boolean"
      }
      case "double" {
        return "Double"
      }
      default {
        return type_string
      }
    }
    return type_string
  }
  fn writeTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def v_type:RangerNodeType node.value_type
    if (node.eval_type != RangerNodeType.NoType) {
      v_type = node.eval_type
    }
    switch v_type {
      case RangerNodeType.Enum {
        wr.out("Int" false)
      }
      case RangerNodeType.Integer {
        wr.out("Int" false)
      }
      case RangerNodeType.Double {
        wr.out("Double" false)
      }
      case RangerNodeType.Char {
        wr.out("Char" false)
      }
      case RangerNodeType.CharBuffer {
        wr.out("CharArray" false)
      }
      case RangerNodeType.String {
        wr.out("String" false)
      }
      case RangerNodeType.Boolean {
        wr.out("Boolean" false)
      }
      case RangerNodeType.Hash {
        wr.out((((("MutableMap<" + (this.getObjectTypeString(node.key_type ctx))) + ",") + (this.getObjectTypeString(node.array_type ctx))) + ">") false)
      }
      case RangerNodeType.Array {
        wr.out((("MutableList<" + (this.getObjectTypeString(node.array_type ctx))) + ">") false)
      }
      default {
        if (node.type_name == "void") {
          wr.out("Unit" false)
        } {
          wr.out((this.getTypeString(node.type_name)) false)
        }
      }
    }
    if (node.hasFlag("optional")) {
      wr.out("?" false)
    }
  }
  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.eval_type == RangerNodeType.Enum) {
      if( (array_length node.ns) > 1) {
        def rootObjName:string (itemAt node.ns 0)
        def enumName:string (itemAt node.ns 1)
        def e@(optional):RangerAppEnum (ctx.getEnum(rootObjName))
        if (!null? e) {
          wr.out(("" + (unwrap (get e.values enumName))) false)
          return
        }
      }
    }
    if ((array_length node.nsp) > 0) {
      for node.nsp p:RangerAppParamDesc i {
        if (i > 0) {
          wr.out("." false)
        }
        if ((strlen p.compiledName) > 0) {
          wr.out((this.adjustType(p.compiledName)) false)
        } {
          if ((strlen p.name) > 0) {
            wr.out((this.adjustType(p.name)) false)
          } {
            wr.out((this.adjustType((itemAt node.ns i))) false)
          }
        }
        if (i == 0) {
          if (p.nameNode.hasFlag("optional")) {
            wr.out("!!" false)
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
    for node.ns part:string i {
      if (i > 0) {
        wr.out("." false)
      }
      wr.out((this.adjustType(part)) false)
    }
  }
  fn writeVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("/** unused:  " false)
      }
      if ((p.set_cnt > 0) || p.is_class_variable) {
        wr.out("var " false)
      } {
        wr.out("val " false)
      }
      wr.out(p.compiledName false)
      wr.out(" : " false)
      this.writeTypeDef((unwrap p.nameNode) ctx wr)
      wr.out(" " false)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = arrayListOf()" false)
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = hashMapOf()" false)
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
  fn writeArgsDef:void (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out("," false)
      }
      wr.out(" " false)
      wr.out((arg.name + " : ") false)
      this.writeTypeDef( (unwrap arg.nameNode) ctx wr)
    }
  }
  fn writeFnCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasFnCall {
      def fc:CodeNode (node.getFirst())
      this.WriteVRef(fc ctx wr)
      wr.out("(" false)
      def givenArgs:CodeNode (node.getSecond())
      for node.fnDesc.params arg:RangerAppParamDesc i {
        if (i > 0) {
          wr.out(", " false)
        }
        if( (array_length givenArgs.children) <= i) {
          def defVal@(optional):CodeNode (arg.nameNode.getFlag("default"))
          if (!null? defVal) {
            def fc:CodeNode (defVal.vref_annotation.getFirst())
            this.WalkNode(fc ctx wr)
          } {
            ctx.addError(node "Default argument was missing")
          }
          continue 
        }
        def n:CodeNode (itemAt givenArgs.children i)
        this.WalkNode(n ctx wr)
      }
      wr.out(")" false)
      if ((ctx.expressionLevel()) == 0) {
        wr.out(";" true)
      }
    }
  }
  fn writeNewCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasNewOper {
      def cl:RangerAppClassDesc node.clDesc
      def fc:CodeNode (node.getSecond())
      wr.out(" " false)
      wr.out(node.clDesc.name false)
      wr.out("(" false)
      def constr:RangerAppFunctionDesc cl.constructor_fn
      def givenArgs:CodeNode (node.getThird())
      if (!null? constr) {
        for constr.params arg:RangerAppParamDesc i {
          def n:CodeNode (itemAt givenArgs.children i)
          if (i > 0) {
            wr.out(", " false)
          }
          if( true || (!null? arg.nameNode)) {
            this.WalkNode(n ctx wr)
          }
        }
      }
      wr.out(")" false)
    }
  }
  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    def wr:CodeWriter orig_wr
    def importFork:CodeWriter (wr.fork())
    wr.out("" true)
    wr.out(("class " + cl.name) false)
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc (unwrap cl.constructor_fn)
      wr.out("(" false)
      this.writeArgsDef(constr ctx wr)
      wr.out(" ) " true)
    }
    wr.out(" {" true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
      this.writeVarDef((unwrap pvar.node) ctx wr)
    }
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      wr.out("" true)
      wr.out("init {" true)
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext (unwrap constr.fnCtx)
      subCtx.is_function = true
      this.WalkNode( (unwrap constr.fnBody) subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    if ((array_length cl.static_methods) > 0) {
      wr.out("companion object {" true)
      wr.indent(1)
    }
    for cl.static_methods variant:RangerAppFunctionDesc i {
      wr.out("" true)
      if (variant.nameNode.hasFlag("main")) {
        continue _
      }
      wr.out("fun " false)
      wr.out(" " false)
      wr.out((variant.name + "(") false)
      this.writeArgsDef(variant ctx wr)
      wr.out(") : " false)
      this.writeTypeDef( (unwrap variant.nameNode ) ctx wr)
      wr.out(" {" true)
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext (unwrap variant.fnCtx)
      subCtx.is_function = true
      this.WalkNode( (unwrap variant.fnBody ) subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    if ((array_length cl.static_methods) > 0) {
      wr.indent(-1)
      wr.out("}" true)
    }
    for cl.defined_variants fnVar:string i {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {
        wr.out("" true)
        wr.out("fun " false)
        wr.out(" " false)
        wr.out((variant.name + "(") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") : " false)
        this.writeTypeDef( (unwrap variant.nameNode ) ctx wr)
        wr.out(" {" true)
        wr.indent(1)
        wr.newline()
        def subCtx:RangerAppWriterContext (unwrap variant.fnCtx)
        subCtx.is_function = true
        this.WalkNode( (unwrap variant.fnBody ) subCtx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
      }
    }
    wr.indent(-1)
    wr.out("}" true)
    for cl.static_methods variant:RangerAppFunctionDesc i {
      wr.out("" true)
      if (variant.nameNode.hasFlag("main")) {
        wr.out("fun main(args : Array<String>) {" true)
        wr.indent(1)
        wr.newline()
        def subCtx:RangerAppWriterContext (unwrap variant.fnCtx )
        subCtx.is_function = true
        this.WalkNode( (unwrap variant.fnBody ) subCtx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
      }
    }
  }
}

