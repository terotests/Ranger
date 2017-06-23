class RangerScalaClassWriter {
  Extends ( RangerGenericClassWriter )
  def compiler:LiveCompiler

  fn getObjectTypeString:string (type_string:string ctx:RangerAppWriterContext) {
    switch type_string {
      case "int" {
        return "Int"
      }
      case "string" {
        return "String"
      }
      case "boolean" {
        return "Boolean"
      }
      case "double" {
        return "Double"
      }
      case "chararray" {
        return "Array[Byte]"
      }
      case "char" {
        return "byte"
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
        return "Int"
      }
      case "string" {
        return "String"
      }
      case "boolean" {
        return "Boolean"
      }
      case "double" {
        return "Double"
      }
      case "chararray" {
        return "Array[Byte]"
      }
      case "char" {
        return "byte"
      }
      default {
        return type_string
      }
    }
    return ""
  }
  fn writeTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.hasFlag("optional")) {
      wr.out("Option[" false)
    }
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
      case RangerNodeType.String {
        wr.out("String" false)
      }
      case RangerNodeType.Boolean {
        wr.out("Boolean" false)
      }
      case RangerNodeType.Char {
        wr.out("Byte" false)
      }
      case RangerNodeType.CharBuffer {
        wr.out("Array[Byte]" false)
      }
      case RangerNodeType.Hash {
        wr.addImport("scala.collection.mutable")
        wr.out((((("collection.mutable.HashMap[" + (this.getObjectTypeString(node.key_type ctx))) + ", ") + (this.getObjectTypeString(node.array_type ctx))) + "]") false)
      }
      case RangerNodeType.Array {
        wr.addImport("scala.collection.mutable")
        wr.out((("collection.mutable.ArrayBuffer[" + (this.getObjectTypeString(node.array_type ctx))) + "]") false)
      }
      default {
        if (node.type_name == "void") {
          wr.out("Unit" false)
          return
        }
        wr.out((this.getTypeString(node.type_name)) false)
      }
    }
    if (node.hasFlag("optional")) {
      wr.out("]" false)
    }
  }
  fn writeTypeDefNoOption:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
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
      case RangerNodeType.String {
        wr.out("String" false)
      }
      case RangerNodeType.Boolean {
        wr.out("Boolean" false)
      }
      case RangerNodeType.Char {
        wr.out("Byte" false)
      }
      case RangerNodeType.CharBuffer {
        wr.out("Array[Byte]" false)
      }
      case RangerNodeType.Hash {
        wr.addImport("scala.collection.mutable")
        wr.out((((("collection.mutable.HashMap[" + (this.getObjectTypeString(node.key_type ctx))) + ", ") + (this.getObjectTypeString(node.array_type ctx))) + "]") false)
      }
      case RangerNodeType.Array {
        wr.addImport("scala.collection.mutable")
        wr.out((("collection.mutable.ArrayBuffer[" + (this.getObjectTypeString(node.array_type ctx))) + "]") false)
      }
      default {
        if (node.type_name == "void") {
          wr.out("Unit" false)
          return
        }
        wr.out((this.getTypeString(node.type_name)) false)
      }
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
            wr.out((this.adjustType( (itemAt node.ns i))) false)
          }
        }
        if (i == 0) {
          if (p.nameNode.hasFlag("optional")) {
            wr.out(".get" false)
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
      def p:RangerAppParamDesc node.paramDesc
      def nn:CodeNode (itemAt node.children 1)
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("/** unused " false)
      }
      if ((p.set_cnt > 0) || p.is_class_variable) {
        wr.out((("var " + p.compiledName) + " : ") false)
      } {
        wr.out((("val " + p.compiledName) + " : ") false)
      }
      this.writeTypeDef(( unwrap p.nameNode ) ctx wr)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        def b_inited:boolean false
        if (p.nameNode.value_type == RangerNodeType.Array) {
          b_inited = true
          wr.out("= new collection.mutable.ArrayBuffer()" false)
        }
        if (p.nameNode.value_type == RangerNodeType.Hash) {
          b_inited = true
          wr.out("= new collection.mutable.HashMap()" false)
        }
        if (p.nameNode.hasFlag("optional")) {
          wr.out(" = Option.empty[" false)
          this.writeTypeDefNoOption( ( unwrap p.nameNode ) ctx wr)
          wr.out("]" false)
        } {
          if (b_inited == false) {
            wr.out(" = _" false)
          }
        }
      }
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("**/ " true)
      } {
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

  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    def wr:CodeWriter (orig_wr.getFileWriter("." (cl.name + ".scala")))
    def importFork:CodeWriter (wr.fork())
    wr.out("" true)
    wr.out((("class " + cl.name) + " ") false)
    if cl.has_constructor {
      wr.out("(" false)
      def constr:RangerAppFunctionDesc (unwrap cl.constructor_fn)
      for constr.params arg:RangerAppParamDesc i {
        if (i > 0) {
          wr.out(", " false)
        }
        wr.out((arg.name + " : ") false)
        this.writeTypeDef( (unwrap arg.nameNode) ctx wr)
      }
      wr.out(")" false)
    }
    wr.out(" {" true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
      this.writeVarDef(( unwrap pvar.node ) ctx wr)
    }
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      wr.newline()
      def subCtx:RangerAppWriterContext (unwrap constr.fnCtx)
      subCtx.is_function = true
      this.WalkNode(( unwrap constr.fnBody ) subCtx wr)
      wr.newline()
    }
    for cl.defined_variants fnVar:string i {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {
        wr.out("" true)
        wr.out("def " false)
        wr.out(" " false)
        wr.out((variant.name + "(") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") : " false)
        this.writeTypeDef(( unwrap variant.nameNode ) ctx wr)
        wr.out(" = {" true)
        wr.indent(1)
        wr.newline()
        def subCtx:RangerAppWriterContext ( unwrap variant.fnCtx )
        subCtx.is_function = true
        this.WalkNode( (unwrap variant.fnBody ) subCtx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
      }
    }
    wr.indent(-1)
    wr.out("}" true)
    def b_had_app:boolean false
    def app_obj:RangerAppFunctionDesc
    if ((array_length cl.static_methods) > 0) {
      wr.out("" true)
      wr.out(("// companion object for static methods of " + cl.name) true)
      wr.out((("object " + cl.name) + " {") true)
      wr.indent(1)
    }
    for cl.static_methods variant:RangerAppFunctionDesc i {
      if (variant.nameNode.hasFlag("main")) {
        b_had_app = true
        app_obj = variant
        continue _
      }
      wr.out("" true)
      wr.out("def " false)
      wr.out(" " false)
      wr.out((variant.name + "(") false)
      this.writeArgsDef(variant ctx wr)
      wr.out(") : " false)
      this.writeTypeDef(( unwrap variant.nameNode ) ctx wr)
      wr.out(" = {" true)
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext ( unwrap variant.fnCtx )
      subCtx.is_function = true
      this.WalkNode( (unwrap variant.fnBody ) subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    if ((array_length cl.static_methods) > 0) {
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    if b_had_app {
      def variant:RangerAppFunctionDesc app_obj
      wr.out("" true)
      wr.out(("// application main function for " + cl.name) true)
      wr.out((("object App" + cl.name) + " extends App {") true)
      wr.indent(1)
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext ( unwrap variant.fnCtx )
      subCtx.is_function = true
      this.WalkNode( (unwrap variant.fnBody ) subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    def import_list:[string] (wr.getImports())
    for import_list codeStr:string i {
      importFork.out(("import " + codeStr + ";") true)
    }
  }
}

