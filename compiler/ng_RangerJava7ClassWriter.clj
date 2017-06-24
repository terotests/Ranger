class RangerJava7ClassWriter {
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
        return "char[]"
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
        return "char[]"
      }
      case "char" {
        return "char"
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
    def t_name:string node.type_name
    def a_name:string node.array_type
    def k_name:string node.key_type

    if ((v_type == RangerNodeType.Object) || (v_type == RangerNodeType.VRef) || (v_type == RangerNodeType.NoType)) {
      v_type = (node.typeNameAsType(ctx))
    }
    if (node.eval_type != RangerNodeType.NoType) {
      v_type = node.eval_type
      if ( (strlen node.eval_type_name) > 0 ) {
        t_name = node.eval_type_name
      }
      if ( (strlen node.eval_array_type) > 0 ) {
        a_name = node.eval_array_type
      }
      if ( (strlen node.eval_key_type) > 0 ) {
        k_name = node.eval_key_type
      }
    }
    if (node.hasFlag("optional")) {
      wr.addImport("java.util.Optional")
      wr.out("Optional<" false)
      switch v_type {
        case RangerNodeType.Enum {
          wr.out("Integer" false)
        }
        case RangerNodeType.Integer {
          wr.out("Integer" false)
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
          wr.out("char" false)
        }
        case RangerNodeType.CharBuffer {
          wr.out("char[]" false)
        }
        case RangerNodeType.Hash {
          wr.out( (((("HashMap<" + (this.getObjectTypeString(k_name ctx))) + ",") + (this.getObjectTypeString(a_name ctx))) + ">") , false)
          wr.addImport("java.util.*")
        }
        case RangerNodeType.Array {
          wr.out((("ArrayList<" + (this.getObjectTypeString(a_name ctx))) + ">") , false)
          wr.addImport("java.util.*")
        }
        default {
          if (t_name== "void") {
            wr.out("void" false)
          } {
            wr.out((this.getObjectTypeString(t_name ctx) ), false)
          }
        }
      }
    } {
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
          wr.out("char" false)
        }
        case RangerNodeType.CharBuffer {
          wr.out("char[]" false)
        }
        case RangerNodeType.String {
          wr.out("String" false)
        }
        case RangerNodeType.Boolean {
          wr.out("boolean" false)
        }
        case RangerNodeType.Hash {
          wr.out((((("HashMap<" + (this.getObjectTypeString(k_name ctx))) + ",") + (this.getObjectTypeString(a_name ctx)))) + ">" , false)
          wr.addImport("java.util.*")
        }
        case RangerNodeType.Array {
          wr.out((("ArrayList<" + (this.getObjectTypeString(a_name ctx)))) + ">" , false)
          wr.addImport("java.util.*")
        }
        default {
          if (t_name == "void") {
            wr.out("void" false)
          } {
            wr.out((this.getTypeString(t_name)) , false)
          }
        }
      }
    }
    if (node.hasFlag("optional")) {
      wr.out(">" false)
    }
  }
  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    if (node.vref == "this") {
      wr.out("this" false)
      return
    }

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
    def max_len:int (array_length node.ns)
    if ((array_length node.nsp) > 0) {
      for node.nsp p:RangerAppParamDesc i {

        if (i == 0) {
          def part:string (itemAt node.ns 0)
          if(part == "this") {
            wr.out("this" false)
            continue
          } 
        }

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

        if (i < (max_len - 1) ) {
          if (p.nameNode.hasFlag("optional")) {
            wr.out(".get()" false)
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
        wr.out("final " false)
      }
      this.writeTypeDef((unwrap p.nameNode) ctx wr)
      wr.out(" " false)
      wr.out(p.compiledName false)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        def b_was_set:boolean false
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = new " false)
          this.writeTypeDef( (unwrap p.nameNode) ctx wr)
          wr.out("()" false)
          b_was_set = true
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = new " false)
          this.writeTypeDef((unwrap p.nameNode)  ctx wr)
          wr.out("()" false)
          b_was_set = true
        }
        if ((b_was_set == false) && (nn.hasFlag("optional"))) {
          wr.out(" = Optional.empty()" false)
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
      this.writeTypeDef((unwrap arg.nameNode) ctx wr)
      wr.out(((" " + arg.name) + " ") false)
    }
  }

  fn CustomOperator:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def fc:CodeNode (node.getFirst())
    def cmd:string fc.vref
    if(cmd == "return") {
      wr.newline()
      if( (array_length node.children ) > 1 ) {
        def value:CodeNode (node.getSecond())

        if( value.hasParamDesc ) {
          def nn:CodeNode (unwrap value.paramDesc.nameNode )
          if ( ctx.isDefinedClass(nn.type_name) ) {
              def cl:RangerAppClassDesc (ctx.findClass(nn.type_name))
              def activeFn:RangerAppFunctionDesc (ctx.getCurrentMethod())
              def fnNameNode:CodeNode (unwrap activeFn.nameNode)
              if(fnNameNode.hasFlag("optional")) {

                ; Optional.ofNullable( ( none_2.isPresent() ? (CodeNode)none_2.get() : null ) );
                ; Optional.of((RangerAppParamDesc)ctx.getCurrentClass().get())
                wr.out("return Optional.ofNullable((" false)
                ; this.writeTypeDef( fnNameNode ctx wr)

                this.WalkNode( value ctx wr )
                wr.out(".isPresent() ? (" false)
                wr.out(fnNameNode.type_name false)
                wr.out(")" false)
                this.WalkNode( value ctx wr )
                wr.out(".get() : null ) );" true)
                return
              }
          }
        }

        wr.out("return " false)
        ctx.setInExpr()
        this.WalkNode( value ctx wr )
        ctx.unsetInExpr()
        wr.out(";" true)

      } {
        wr.out("return;" true)
      }
    }
  }  

  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    def declaredVariable:[string:boolean]
    if ( ( array_length cl.extends_classes ) > 0 ) { 
      for cl.extends_classes pName:string i {
        def pC:RangerAppClassDesc (ctx.findClass(pName))
        for pC.variables pvar:RangerAppParamDesc i {
          set declaredVariable pvar.name true
        }
      }
    }

    def wr:CodeWriter (orig_wr.getFileWriter("." (cl.name + ".java")))
    def importFork:CodeWriter (wr.fork())
    wr.out("" true)
    wr.out(("class " + cl.name) false)
    def parentClass:RangerAppClassDesc  
    if ( ( array_length cl.extends_classes ) > 0 ) { 
      wr.out(" extends " false)
      for cl.extends_classes pName:string i {
        wr.out(pName false)
        parentClass = (ctx.findClass(pName))
      }
    }    
    wr.out( " { " true)
    wr.indent(1)
    wr.createTag("utilities")
    for cl.variables pvar:RangerAppParamDesc i {
      if( has declaredVariable pvar.name ) {
        continue
      }
      wr.out("public " false)
      this.writeVarDef( (unwrap pvar.node) ctx wr)
    }
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      wr.out("" true)
      wr.out((cl.name + "(") false)
      this.writeArgsDef( (unwrap constr) ctx wr)
      wr.out(" ) {" true)
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext (unwrap constr.fnCtx)
      subCtx.is_function = true
      this.WalkNode( (unwrap constr.fnBody) subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    for cl.static_methods variant:RangerAppFunctionDesc i {
      wr.out("" true)
      if (variant.nameNode.hasFlag("main")) {
        wr.out("public static void main(String [] args ) {" true)
      } {
        wr.out("public static " false)
        this.writeTypeDef( (unwrap variant.nameNode) ctx wr)
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
        this.WalkNode( (unwrap variant.fnBody) subCtx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
      }
    }
    wr.indent(-1)
    wr.out("}" true)
    def import_list:[string] (wr.getImports())
    for import_list codeStr:string i {
      importFork.out(("import " + codeStr + ";") true)
    }
  }
}

