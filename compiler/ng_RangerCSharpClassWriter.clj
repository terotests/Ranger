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

    switch v_type {

      case RangerNodeType.ExpressionType {
        def rv:CodeNode (itemAt node.expression_value.children 0)
        def sec:CodeNode (itemAt node.expression_value.children 1)
        def fc:CodeNode (sec.getFirst())
;        this.import_lib("<functional>" ctx wr)
        def is_void false
        if(rv.type_name == "void" || rv.eval_type_name == "void") {
          is_void = true
        }
        if is_void {
          wr.out("Action<" false)
        } {
          wr.out("Func<" false)
        }
        for sec.children arg:CodeNode i {
          if( i > 0 ) {
            wr.out(", " false)
          }
          this.writeTypeDef( arg ctx wr)
        }
        if( is_void == false ) {
          if( (array_length sec.children) > 0 ) {
            wr.out(", " false)
          }
          this.writeTypeDef( rv ctx wr)
        }
        wr.out(">" false)
      }   
      
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
        wr.addImport("System.Collections.Generic")
      }
      case RangerNodeType.Array {
        wr.out((("List<" + (this.getObjectTypeString(node.array_type ctx))) + ">") false)
        wr.addImport("System.Collections")
        wr.addImport("System.Collections.Generic")
      }
      default {
        if (node.type_name == "void") {
          wr.out("void" false)
        } {
          wr.out((this.getTypeString(node.type_name)) false)
        }
      }
    }

    ; if (node.hasFlag("optional")) {
    ;   wr.out("?" false)
    ; }
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
          def part:string (itemAt node.ns 0)
          if(part == "this") {
            if( ctx.inLambda() ) {
              wr.out("this" false)
              ; def currC (ctx.getCurrentClass())
              ; wr.out( (currC.name + ".this") false)
            } {
              wr.out("this" false)
            }            
            continue
          } 
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
        ; const could be set here, if detected correctly
        wr.out("" false)
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
      wr.out(((" " + arg.compiledName) + " ") false)
    }
  }

  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }

    def wr orig_wr

    ; def wr:CodeWriter (orig_wr.getFileWriter("." (cl.name + ".cs")))
    ; def importFork:CodeWriter (wr.fork())
    
    this.import_lib("System" ctx wr)

    wr.out("" true)
    wr.createTag("utilities")
    wr.out("" true)
    
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
      if ( (variant.nameNode.hasFlag("main")) && (variant.nameNode.code.filename != (ctx.getRootFile()))) {
        continue
      }
      if (variant.nameNode.hasFlag("main")) {
        wr.out("static void Main( string [] args ) {" true)
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
  }
}

