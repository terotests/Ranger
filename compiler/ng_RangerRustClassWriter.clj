class RangerRustClassWriter {
  Extends RangerGenericClassWriter
  def compiler:LiveCompiler
  def thisName:string "self"
  fn WriteScalarValue (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    switch node.value_type {
      case RangerNodeType.Double {
        wr.out((("" + node.double_value) + "_f64") false)
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
  fn getObjectTypeString:string (type_string:string ctx:RangerAppWriterContext) {
    switch type_string {
      case "int" {
        return "i64"
      }
      case "string" {
        return "String"
      }
      case "boolean" {
        return "bool"
      }
      case "double" {
        return "f64"
      }
      default {
        return type_string
      }
    }
  }
  fn getTypeString:string (type_string:string) {
    switch type_string {
      case "int" {
        return "i64"
      }
      case "string" {
        return "String"
      }
      case "boolean" {
        return "bool"
      }
      case "double" {
        return "f64"
      }
      default {
        return type_string
      }
    }
  }
  fn writeTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.hasFlag("optional")) {
      wr.out("Option<" false)
    }
    def v_type:int node.value_type
    if (node.eval_type != RangerNodeType.NoType) {
      v_type = node.eval_type
    }
    switch v_type {
      case RangerNodeType.Enum {
        wr.out("i64" false)
      }
      case RangerNodeType.Integer {
        wr.out("i64" false)
      }
      case RangerNodeType.Double {
        wr.out("f64" false)
      }
      case RangerNodeType.String {
        wr.out("String" false)
      }
      case RangerNodeType.Boolean {
        wr.out("bool" false)
      }
      case RangerNodeType.Char {
        wr.out("u8" false)
      }
      case RangerNodeType.CharBuffer {
        wr.out("Vec<u8>" false)
      }
      case RangerNodeType.Hash {
        wr.out((((("HashMap<" + (this.getObjectTypeString(node.key_type ctx))) + ",") + (this.getObjectTypeString(node.array_type ctx))) + ">") false)
        wr.addImport("std::collections::HashMap")
      }
      case RangerNodeType.Array {
        wr.out((("Vec<" + (this.getObjectTypeString(node.array_type ctx))) + ">") false)
      }
      default {
        if (node.type_name == "void") {
          wr.out("()" false)
          return
        }
        wr.out((this.getTypeString(node.type_name)) false)
      }
    }
    if (node.hasFlag("optional")) {
      wr.out(">" false)
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
      def had_static:boolean false
      for node.nsp p:RangerAppParamDesc i {
        if (null? p) {
          ctx.addError(node ("Invalid reference:" + (itemAt node.ns i)))
          return
        }
        if (i > 0) {
          if had_static {
            wr.out("::" false)
          } {
            wr.out("." false)
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
        if (i == 0) {
          if (p.nameNode.hasFlag("optional")) {
            wr.out("!" false)
          }
        }
        if (p.isClass()) {
          had_static = true
        }
      }
      return
    }
    if node.hasParamDesc {
      def part:string (itemAt node.ns 0)
      if (part != "this") {
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
    for node.ns part:string i {
      if (i > 0) {
        if ((i == 1) && b_was_static) {
          wr.out("::" false)
        } {
          wr.out("." false)
        }
      }
      if (i == 0) {
        if (ctx.hasClass(part)) {
          b_was_static = true
        }
        if (part != "this") {
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
  fn writeStructField (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      wr.out((p.compiledName + " : ") false)
      this.writeTypeDef(p.nameNode ctx wr)
      wr.out(", " true)
    }
  }
  fn writeVarDef (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("/** unused:  " false)
      }
      def map_or_hash:boolean ((nn.value_type == RangerNodeType.Array) || (nn.value_type == RangerNodeType.Hash))
      if (((p.set_cnt > 0) || p.is_class_variable) || map_or_hash) {
        wr.out((("let mut " + p.compiledName) + " : ") false)
      } {
        wr.out((("let mut " + p.compiledName) + " : ") false)
      }
      this.writeTypeDef(p.nameNode ctx wr)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = Vec::new()" false)
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = HashMap::new()" false)
        }
      }
      wr.out(";" false)
      if ((p.ref_cnt == 0) && (p.is_class_variable == true)) {
        wr.out("     /** note: unused */" false)
      }
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("   **/ " true)
      } {
        wr.newline()
      }
    }
  }
  fn writeArgsDef (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out(", " false)
      }
      wr.out((arg.name + " : ") false)
      wr.out("&" false)
      this.writeTypeDef(arg.nameNode ctx wr)
    }
  }
  fn writeFnCall (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasFnCall {
      def fc:CodeNode (node.getFirst())
      def part:string (itemAt fc.ns 0)
      if (part != "this") {
        def currC:RangerAppClassDesc (ctx.getCurrentClass())
        def p:RangerAppParamDesc (currC.findVariable(part))
        if (!null? p) {
          wr.out((thisName + ".") false)
        }
      }
      this.WriteVRef(fc ctx wr)
      wr.out("(" false)
      def givenArgs:CodeNode (node.getSecond())
      for node.fnDesc.params arg:RangerAppParamDesc i {
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
      wr.out(node.clDesc.name false)
      wr.out("::new(" false)
      def constr:RangerAppFunctionDesc cl.constructor_fn
      def givenArgs:CodeNode (node.getThird())
      if (!null? constr) {
        for constr.params arg:RangerAppParamDesc i {
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
    wr.out((("struct " + cl.name) + " { ") true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
      this.writeStructField(pvar.node ctx wr)
    }
    wr.indent(-1)
    wr.out("}" true)
    wr.out((("impl " + cl.name) + " { ") true)
    wr.indent(1)
    thisName = "me"
    wr.out("" true)
    wr.out("pub fn new(" false)
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      for constr.params arg:RangerAppParamDesc i {
        if (i > 0) {
          wr.out(", " false)
        }
        wr.out((arg.name + " : ") false)
        this.writeTypeDef(arg.nameNode ctx wr)
      }
    }
    wr.out(((") ->  " + cl.name) + " {") true)
    wr.indent(1)
    wr.newline()
    wr.out((("let mut me = " + cl.name) + " { ") true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
      def nn:CodeNode pvar.node
      if ((array_length nn.children) > 2) {
        def valueNode:CodeNode (itemAt nn.children 2)
        wr.out((pvar.name + ":") false)
        this.WalkNode(valueNode ctx wr)
        wr.out(", " true)
      } {
      }
    }
    wr.indent(-1)
    wr.out("};" true)
    wr.newline()
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      def subCtx:RangerAppWriterContext constr.fnCtx
      subCtx.is_function = true
      this.WalkNode(constr.fnBody subCtx wr)
    }
    wr.out("return me;" true)
    wr.indent(-1)
    wr.out("}" true)
    thisName = "self"
    for cl.static_methods variant:RangerAppFunctionDesc i {
      if (variant.nameNode.hasFlag("main")) {
        continue _
      }
      wr.out((("pub fn " + variant.name) + "(") false)
      this.writeArgsDef(variant ctx wr)
      wr.out(") -> " false)
      this.writeTypeDef(variant.nameNode ctx wr)
      wr.out(" {" true)
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext variant.fnCtx
      subCtx.is_function = true
      this.WalkNode(variant.fnBody subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    for cl.defined_variants fnVar:string i {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {
        wr.out((("fn " + variant.name) + "(") false)
        wr.out("&self, " false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") -> " false)
        this.writeTypeDef(variant.nameNode ctx wr)
        wr.out(" {" true)
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
    for cl.static_methods variant:RangerAppFunctionDesc i {
      def nn:CodeNode variant.nameNode
      if (nn.hasFlag("main")) {
        wr.out("fn main() {" true)
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
  }
}

