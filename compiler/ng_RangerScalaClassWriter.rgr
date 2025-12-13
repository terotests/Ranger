  class RangerScalaClassWriter {
  Extends ( RangerGenericClassWriter )
  def compiler:LiveCompiler
  def init_done false
  fn getObjectTypeString:string (type_string:string ctx:RangerAppWriterContext) {

    if(ctx.isDefinedClass(type_string)) {
      def cc (ctx.findClass(type_string))
      if(cc.is_union) {
        return "Any"
      }
    }
    
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
    }
    return type_string
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
    }
    return type_string
  }
  fn writeTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.hasFlag("optional")) {
      wr.out("Option[" false)
    }

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
        wr.out("(" false)
        for sec.children arg:CodeNode i {
          if( i > 0 ) {
            wr.out(", " false)
          }
          this.writeTypeDef( arg ctx wr)
        }
        wr.out(")" false)
        if is_void {
          wr.out("=> Unit" false)
        } {
          wr.out("=> " false)
          this.writeTypeDef( rv ctx wr)
        }
      }   
      
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
        wr.out((((("collection.mutable.HashMap[" + (this.getObjectTypeString(k_name ctx))) + ", ") + (this.getObjectTypeString(a_name ctx))) + "]") false)
      }
      case RangerNodeType.Array {
        wr.addImport("scala.collection.mutable")
        wr.out((("collection.mutable.ArrayBuffer[" + (this.getObjectTypeString(a_name ctx))) + "]") false)
      }
      default {

        if(ctx.isDefinedClass(t_name)) {
          def cc (ctx.findClass(t_name))
          if(cc.is_union) {
            wr.out("Any" false)
            if (node.hasFlag("optional")) {
              wr.out("]" false)
            }
            return
          }
        }
        
        if (node.type_name == "void") {
          wr.out("Unit" false)
          return
        }
        wr.out((this.getTypeString(t_name)) false)
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

      case RangerNodeType.ExpressionType {
        def rv:CodeNode (itemAt node.expression_value.children 0)
        def sec:CodeNode (itemAt node.expression_value.children 1)
        def fc:CodeNode (sec.getFirst())
        def is_void false
        if(rv.type_name == "void" || rv.eval_type_name == "void") {
          is_void = true
        }
        wr.out("(" false)
        for sec.children arg:CodeNode i {
          if( i > 0 ) {
            wr.out(", " false)
          }
          this.writeTypeDef( arg ctx wr)
        }
        wr.out(")" false)
        if is_void {
          wr.out("=> Unit" false)
        } {
          wr.out("=> " false)
          this.writeTypeDef( rv ctx wr)
        }
      }   
      
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
        wr.out((("var " + p.compiledName) + " ") false)
      } {
        wr.out((("val " + p.compiledName) + " ") false)
      }

      def ti_ok (ctx.canUseTypeInference( (unwrap p.nameNode) ))     
      if( (false == ti_ok ) || ( (false == (p.nameNode.hasFlag("optional"))) && ( (array_length node.children) == 2) ) ) {
        wr.out(": " false)
        this.writeTypeDef(( unwrap p.nameNode ) ctx wr)
        wr.out(" " false)
      }

      if ((array_length node.children) > 2) {
        wr.out("= " false)
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
            wr.out("= _" false)
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
      wr.out((arg.compiledName + " : ") false)
      this.writeTypeDef( (unwrap arg.nameNode) ctx wr)
    }
  }

  fn writeFnEnd (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
      wr.indent(-1)
      wr.out("} catch {" true)
      wr.indent(1)
        wr.out("case rv:ScalaReturnValue => {" true)
        wr.indent(1)
        wr.out("__returns__ = rv.value" true)
        wr.indent(-1)
        wr.out("}" true)
      wr.indent(-1)
      wr.out("}" true)
       
      wr.out("__returns__.asInstanceOf[" false )
      this.writeTypeDef(node ctx wr)
      wr.out("]" true)    
  }

  fn writeFnStart(node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    wr.out("var __returns__ : Any = null" true)
    wr.out("try {" true)
    wr.indent(1)
  }

  fn CustomOperator:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    def fc:CodeNode (node.getFirst())
    def cmd:string fc.vref
    ;"
    if(cmd == "for") {
        ; for list item:Type ...
        def listNode (itemAt node.children 1)
        def itemNode (itemAt node.children 2)
        def indexNode (itemAt node.children 3)
        def bodyNode (itemAt node.children 4)

        def break_cnt 0 
        def continue_cnt 0 
        bodyNode.forTree({
          if(item.isFirstVref('break')) {
            break_cnt = break_cnt + 1
          }
          if(item.isFirstVref('continue')) {
            continue_cnt = continue_cnt + 1
          }
        })
        if( continue_cnt > 0 ) {
          ctx.addError(node "oops, sorry. Currently Scala output can not handle for-loops with continue :/")
          return
        }
        if( break_cnt > 0  ) {
          wr.addImport("scala.util.control._")
          wr.out('try {' true)
          wr.indent(1)
          wr.out('val __break__ = new Breaks' true)
          wr.out('__break__.breakable {' true)
          wr.indent(1)
        }

        wr.out( 'for( ' false )
        this.WalkNode( indexNode ctx wr )
        wr.out( ' <- 0 until ' false)
        this.WalkNode( listNode ctx wr )
        wr.out('.length ) {' true}
        wr.indent(1)
        ;  "for (  " (e 3) " <- 0 until " (e 1) ".length ) {" nl I "val " (e 2) " = " (e 1) "(" (e 3) ")" nl (block 4) nl i "}" 

        wr.out('val ' false)
        this.WalkNode( itemNode ctx wr )
        wr.out(' = ' false)
        this.WalkNode( listNode ctx wr )
        wr.out("(" false)
        this.WalkNode( indexNode ctx wr )
        wr.out(')' true)
        
        this.WalkNode( bodyNode ctx wr )
        wr.indent(-1)
        wr.out("}" true)

        if( break_cnt > 0  ) {
          wr.indent(-1)
          wr.out("}" true)
          wr.indent(-1)
          wr.out("}" true)
        }
        return
    }

    if(cmd == "try" ) { 
      def tryBlock:CodeNode (node.getSecond())
      def catchBlock:CodeNode (node.getThird())
      wr.out("try {" true)
      wr.indent(1)
      this.WalkNode( tryBlock ctx wr )
      wr.indent(-1)
      wr.out("} catch {" true)
      wr.indent(1)
      if( ctx.inLambda() ) {
        wr.out("case rv:ScalaReturnValue => {" true)
        wr.indent(1)
          wr.out("throw new ScalaReturnValue(rv.value)" true)
        wr.indent(-1)
        wr.out("}" true)
      } 
      wr.out("case e: Exception => {" true)
      wr.indent(1)
        this.WalkNode( catchBlock ctx wr )
      wr.indent(-1)
      wr.out("}" true)
      wr.indent(-1)
      wr.out("}" true)
      return
    }

    if(cmd == "return" ) {
      if( (array_length node.children ) > 1 ) {
        def rValue (node.getSecond())

        if( ctx.getFlag("last_returns")) {
          this.WalkNode( rValue ctx wr )
          return          
        }
        if( ctx.inLambda() ) {
          wr.out("throw new ScalaReturnValue(" false)
          ctx.setInExpr()
          this.WalkNode( rValue ctx wr )
          ctx.unsetInExpr()
          wr.out(")" true)
        } {
          wr.out("return " false)
          ctx.setInExpr()
          this.WalkNode( rValue ctx wr )
          ctx.unsetInExpr()
          wr.out("  " true)          
        }
      } {
        if( ctx.inLambda() ) {
          wr.out("throw new ScalaReturnValue(null)" true)
        } {
          wr.out("return" true)
        }
      }
      return
    }
  }  

  fn CreateLambda:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def lambdaCtx (unwrap node.lambda_ctx)
    def fnDef:CodeNode (itemAt node.children 0)
    def args:CodeNode (itemAt node.children 1)
    def body:CodeNode (itemAt node.children 2)
    lambdaCtx.is_lambda = true
    wr.out("((" false)
    for args.children arg:CodeNode i {
      if (i > 0) {
        wr.out(", " false)
      }
      if(arg.flow_done == false) {
        this.compiler.parser.WalkNode( arg lambdaCtx wr)  
      }
      this.WalkNode(arg lambdaCtx wr)
      wr.out(" : " false)
      this.writeTypeDef( arg ctx wr)
    }
    wr.out(")" false)

    def return_cnt 0 
    def line_cnt (array_length body.children)
    body.forTree({
      if(item.isFirstVref('return')) {
        return_cnt = return_cnt + 1
      }
    })

    if( line_cnt == 1) {
      return_cnt = 1
    }


; disable optimizations
;    return_cnt = 2
;    line_cnt = 2

    ; test if this function can be simplified as last value is return
    if( fnDef.type_name != "void" ) {
      if( return_cnt == 1 ) {
        if( line_cnt > 1) {
          wr.out(" => { " true)
          wr.indent(1)          
          lambdaCtx.restartExpressionLevel()
        } {
          wr.out(" => " false)
          lambdaCtx.setInExpr()
        }
        ; trivial case: we can simplify the function
        lambdaCtx.setFlag("last_returns" true)
        for body.children item:CodeNode i {
          this.WalkNode(item lambdaCtx wr)
        }
        if( line_cnt > 1) {
          wr.newline()
          wr.indent(-1)
          wr.out("}" false)
        } {
          lambdaCtx.unsetInExpr()
        }
        wr.out(')' false)
        return
      }
    }

    if( line_cnt > 1 || (return_cnt > 1) ) {
      wr.out(" => { " true)
      wr.indent(1)          
      lambdaCtx.restartExpressionLevel()
    } {
      wr.out(" => " false)
      lambdaCtx.setInExpr()
    }
    if( fnDef.type_name != "void") {
      this.writeFnStart( fnDef ctx wr )
    }
    for body.children item:CodeNode i {
      this.WalkNode(item lambdaCtx wr)
    }
    if( fnDef.type_name != "void") {
      this.writeFnEnd( fnDef ctx wr )
    }
    if( line_cnt > 1 || (return_cnt > 1) ) {
      wr.newline()
      wr.indent(-1)
      wr.out("}" false)
    } {
      lambdaCtx.unsetInExpr()
    }
    wr.out(')' false)
    
    ; wr.indent(-1)
    ; wr.out("}" false)
  }

  fn writeArrayLiteral( node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    wr.out("collection.mutable.ArrayBuffer(" false)
    node.children.forEach({
      if( index > 0 ) {
        wr.out(", " false)
      }
      this.WalkNode( item ctx wr )
    })
    wr.out(")" false)
  }
  
  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def declaredFunction:[string:boolean]
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    def wr:CodeWriter orig_wr ; (orig_wr.getFileWriter("." (cl.name + ".scala")))

    if( init_done == false ) {
      wr.out("case class ScalaReturnValue(value:Any) extends Exception" true)
      wr.createTag("imports")
      init_done = true
      wr.createTag("beginning")
    }
    def importFork:CodeWriter (wr.getTag("imports"))
    def b_class_has_content ( cl.has_constructor || ( has cl.variables) || (has cl.defined_variants) || (has cl.extends_classes) )
    if b_class_has_content {


      if ( ( array_length cl.extends_classes ) > 0 ) { 
        for cl.extends_classes pName:string i {
          def pC:RangerAppClassDesc (ctx.findClass(pName))
          ; for pC.variables pvar:RangerAppParamDesc i {
          ;   set declaredVariable pvar.name true
          ; }
          for pC.defined_variants fnVar:string i {
            def mVs:RangerAppMethodVariants (get pC.method_variants fnVar)
            for mVs.variants variant:RangerAppFunctionDesc i {
              set declaredFunction variant.name true
;              set parentFunction variant.name variant
            }
          }
;          for pC.static_methods variant:RangerAppFunctionDesc i {
;            set declaredStaticFunction variant.name true
;          }
        }
      }
      
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

      if ( ( array_length cl.extends_classes ) > 0 ) { 
        wr.out(" extends " false)
        for cl.extends_classes pName:string i {
          wr.out(pName false)
  ;        parentClass = (ctx.findClass(pName))
        }
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

          if( has declaredFunction variant.name ) {
            wr.out('override ' false)
          }
          wr.out("def " false)
          wr.out(" " false)
          wr.out((variant.name + "(") false)
          this.writeArgsDef(variant ctx wr)
          wr.out(") : " false)
          this.writeTypeDef(( unwrap variant.nameNode ) ctx wr)
          wr.out(" = " false)

          def return_cnt 0 
          def line_cnt (array_length variant.fnBody.children)
          variant.fnBody.forTree({
            if(item.isFirstVref('return')) {
              return_cnt = return_cnt + 1
            }
          })

          def subCtx:RangerAppWriterContext ( unwrap variant.fnCtx )
          subCtx.is_function = true
          if( return_cnt <= 1 ) {
            subCtx.setFlag("last_returns" true)
            if( line_cnt > 1) {
              wr.out(" { " true)
              wr.indent(1)   
            } {
              subCtx.setInExpr()
            }
            this.WalkNode( (unwrap variant.fnBody ) subCtx wr)
            if( line_cnt > 1) {
              wr.newline()
              wr.indent(-1)
              wr.out("}" true)
            } {
              subCtx.unsetInExpr()
              wr.newline()
            }
          } {
            wr.out(" {" true)
            wr.indent(1)
            wr.newline()
            this.WalkNode( (unwrap variant.fnBody ) subCtx wr)
            wr.newline()
            wr.indent(-1)
            wr.out("}" true)
          }
          
        }
      }
      wr.indent(-1)
      wr.out("}" true)
    }

    def b_has_non_main_static false
    def b_had_app:boolean false
    def app_obj:RangerAppFunctionDesc

    cl.static_methods.forEach({
      if( item.name != "main" ) {
        b_has_non_main_static = true
      } {
        b_had_app = true
        def it item
        app_obj = it
      }
    })

    if b_has_non_main_static {
      wr.out("" true)
      wr.out(("// companion object for static methods of " + cl.name) + " static cnt == " + (array_length cl.static_methods) , true)
      wr.out((("object " + cl.name) + " {") true)
      wr.indent(1)
      for cl.static_methods variant:RangerAppFunctionDesc i {
        if (variant.nameNode.hasFlag("main")) {
          continue _
        }
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
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    if b_had_app {
      def variant:RangerAppFunctionDesc app_obj
      def b_scalafiddle (ctx.hasCompilerFlag("scalafiddle"))
      def theEnd (wr.getTag("file_end"))

      if b_scalafiddle {
        theEnd = (wr.getTag("beginning"))
        theEnd.out("" true)
        theEnd.out("// -----------  the scalafiddle main function begins ---------" true)
      }

      if( b_scalafiddle == false ) {
        theEnd.out("" true)
        theEnd.out(("// application main function for " + cl.name) true)
        theEnd.out((("object App" + cl.name) + " extends App {") true)
        theEnd.indent(1)
        theEnd.newline()
      }
      def subCtx:RangerAppWriterContext ( unwrap variant.fnCtx )
      subCtx.is_function = true
      this.WalkNode( (unwrap variant.fnBody ) subCtx theEnd)

      if b_scalafiddle {
        theEnd.out("// -----------  the scalafiddle main function ends ---------" true)
        theEnd.out("" true)
      }

      if( b_scalafiddle == false ) {
        theEnd.newline()
        theEnd.indent(-1)
        theEnd.out("}" true)
      } 
    }
  }
}

