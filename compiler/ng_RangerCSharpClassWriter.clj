class RangerCSharpClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
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
    }
    return type_string
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
        return "byte"
      }
      case "boolean" {
        return "boolean"
      }
      case "double" {
        return "double"
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
        wr.out((((("Dictionary<" + (this.getObjectTypeString(node.key_type ctx))) + ",") + (this.getObjectTypeString(node.array_type ctx))) + ">") false)
        wr.addImport("System.Collections")
      }
      case RangerNodeType.Array {
        wr.out((("List<" + (this.getObjectTypeString(node.array_type ctx))) + ">") false)
        wr.addImport("System.Collections")
      }
      default {
        if (node.type_name == "void") {
          wr.out("void" false)
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
        if (i == 0) {
          if (p.nameNode.hasFlag("optional")) {
          }
        }
        if ((strlen p.compiledName) > 0) {
          wr.out((this.adjustType(p.compiledName)) false)
        } {
          if ((strlen p.name) > 0) {
            wr.out((this.adjustType(p.name)) false)
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
        wr.out("" false)
      } {
        wr.out("const " false)
      }
      this.writeTypeDef(( unwrap p.nameNode ) ctx wr)
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
          this.writeTypeDef(( unwrap p.nameNode ) ctx wr)
          wr.out("()" false)
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = new " false)
          this.writeTypeDef(( unwrap p.nameNode ) ctx wr)
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

  fn writeArgsDef:void (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out("," false)
      }
      wr.out(" " false)
      this.writeTypeDef( (unwrap arg.nameNode ) ctx wr)
      wr.out(((" " + arg.name) + " ") false)
    }
  }

  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    def wr:CodeWriter (orig_wr.getFileWriter("." (cl.name + ".cs")))
    def importFork:CodeWriter (wr.fork())
    wr.out("" true)
    wr.out((("class " + cl.name) + " {") true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
      wr.out("public " false)
      this.writeVarDef( (unwrap pvar.node) ctx wr)
    }
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc (unwrap cl.constructor_fn)
      wr.out("" true)
      wr.out((cl.name + "(") false)
      this.writeArgsDef(constr ctx wr)
      wr.out(" ) {" true)
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext (unwrap constr.fnCtx )
      subCtx.is_function = true
      this.WalkNode( (unwrap constr.fnBody ) subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    for cl.static_methods variant:RangerAppFunctionDesc i {
      wr.out("" true)
      if (variant.nameNode.hasFlag("main")) {
        wr.out("static int Main( string [] args ) {" true)
      } {
        wr.out("public static " false)
        this.writeTypeDef( (unwrap variant.nameNode ) ctx wr)
        wr.out(" " false)
        wr.out((variant.name + "(") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") {" true)
      }
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext (unwrap variant.fnCtx)
      subCtx.is_function = true
      this.WalkNode( (unwrap variant.fnBody) subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    for cl.defined_variants fnVar:string i {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {
        wr.out("" true)
        wr.out("public " false)
        this.writeTypeDef( (unwrap variant.nameNode) ctx wr)
        wr.out(" " false)
        wr.out((variant.name + "(") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") {" true)
        wr.indent(1)
        wr.newline()
        def subCtx:RangerAppWriterContext (unwrap variant.fnCtx)
        subCtx.is_function = true
        this.WalkNode((unwrap variant.fnBody) subCtx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
      }
    }
    wr.indent(-1)
    wr.out("}" true)
    def import_list:[string] (wr.getImports())
    for import_list codeStr:string i {
      importFork.out(("using " + codeStr + ";") true)
    }
  }
}

