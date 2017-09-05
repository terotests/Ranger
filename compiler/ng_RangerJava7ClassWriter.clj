class RangerJava7ClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
  
  def signatures:[string:int]
  def signature_cnt:int 0
  def iface_created:[string:boolean]

  fn getSignatureInterface:string (s:string) {
    def idx@(optional) (get signatures s)
    if(!null? idx) {
      return ("LambdaSignature" + (unwrap idx))
    }
    signature_cnt = signature_cnt + 1
    set signatures s signature_cnt
    return ("LambdaSignature" + signature_cnt)
    
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
      case "charbuffer" {
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
    if(ctx.isDefinedClass(type_string)) {
      def cc (ctx.findClass(type_string))
      if(cc.is_union) {
        return "Object"
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
      case "charbuffer" {
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
    if (node.hasFlag("optional")) {
      wr.addImport("java.util.Optional")
      wr.out("Optional<" false)
      switch v_type {
        ; ClojureInterface1
        case RangerNodeType.ExpressionType {
          def sig (this.buildLambdaSignature( (unwrap node.expression_value)))
          def iface_name (this.getSignatureInterface(sig)) 
          wr.out( iface_name false)

          if( ( has iface_created iface_name) == false ) {
            def fnNode (itemAt node.expression_value.children 0)
            def args (itemAt node.expression_value.children 1)
            set iface_created iface_name true
            def utilWr (wr.getFileWriter("." (iface_name + ".java")))
            utilWr.out("public interface " + iface_name + " { " , true)
            utilWr.indent(1)
            utilWr.out("public " false)
            this.writeTypeDef( fnNode ctx utilWr)
            utilWr.out(" run(" false)
            for args.children arg:CodeNode i {
                if (i > 0) {
                  utilWr.out(", " false)
                }
                this.writeTypeDef(arg ctx utilWr)
                utilWr.out(" " false)
                utilWr.out(arg.vref  false)
                
            }    
            utilWr.out(");" true)
            utilWr.indent(-1)
            utilWr.out("}" true)
          }

        }
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
          wr.out("byte" false)
        }
        case RangerNodeType.CharBuffer {
          wr.out("byte[]" false)
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
        case RangerNodeType.ExpressionType {
          def sig (this.buildLambdaSignature( (unwrap node.expression_value)))
          def iface_name (this.getSignatureInterface(sig)) 
          wr.out( iface_name false)

          if( ( has iface_created iface_name) == false ) {
            def fnNode (itemAt node.expression_value.children 0)
            def args (itemAt node.expression_value.children 1)
            set iface_created iface_name true
            def utilWr (wr.getFileWriter("." (iface_name + ".java")))
            utilWr.out("public interface " + iface_name + " { " , true)
            utilWr.indent(1)
            utilWr.out("public " false)
            this.writeTypeDef( fnNode ctx utilWr)
            utilWr.out(" run(" false)
            for args.children arg:CodeNode i {
                if (i > 0) {
                  utilWr.out(", " false)
                }
                this.writeTypeDef(arg ctx utilWr)
                utilWr.out(" " false)
                utilWr.out(arg.vref  false)
                
            }    
            utilWr.out(");" true)
            utilWr.indent(-1)
            utilWr.out("}" true)
          }
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
          wr.out((((("HashMap<" + (this.getObjectTypeString(k_name ctx))) + ",") + (this.getObjectTypeString(a_name ctx)))) + ">" , false)
          wr.addImport("java.util.*")
        }
        case RangerNodeType.Array {
          wr.out((("ArrayList<" + (this.getObjectTypeString(a_name ctx)))) + ">" , false)
          wr.addImport("java.util.*")
        }
        default {

          def b_object_set false
          if(ctx.isDefinedClass(t_name)) {
            def cc (ctx.findClass(t_name))
            if(cc.is_union) {
              wr.out("Object" false)
              b_object_set = true
            }
          }          
          if( b_object_set == false) {
            if (t_name == "void") {
              wr.out("void" false)
            } {
              wr.out((this.getTypeString(t_name)) , false)
            }
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
      if( ctx.inLambda() ) {
        def currC (ctx.getCurrentClass())
        wr.out( (currC.name + ".this") false)
      } {
        wr.out("this" false)
      } 
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
            if( ctx.inLambda() ) {
              def currC (ctx.getCurrentClass())
              wr.out( (currC.name + ".this") false)
            } {
              wr.out("this" false)
            }            
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
      if(part == "this") {
        if( ctx.inLambda() ) {
          def currC (ctx.getCurrentClass())
          wr.out( (currC.name + ".this") false)
          continue
        }  
      }          
      wr.out((this.adjustType(part)) false)
    }
  }

  fn disabledVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("/** unused:  " false)
      }
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
      wr.out(((" " + arg.compiledName) + " ") false)
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

  fn buildLambdaSignature:string (node:CodeNode) {
      def exp node
      def exp_s ""
      def fc (exp.getFirst())
      def args (exp.getSecond())
      exp_s = exp_s + (fc.buildTypeSignature())
      exp_s = exp_s + "("
      for args.children arg:CodeNode i {
        exp_s = exp_s + (arg.buildTypeSignature())
        exp_s = exp_s + ","
      }
      exp_s = exp_s + ")"
      return exp_s    
  }

  fn CreateLambdaCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def fName:CodeNode (itemAt node.children 0)
    def givenArgs:CodeNode (itemAt node.children 1)
    this.WriteVRef(fName ctx wr)

    def param (ctx.getVariableDef(fName.vref))
    def args ( itemAt param.nameNode.expression_value.children 1)

    wr.out(".run(" false)
    for args.children arg:CodeNode i {
        def n:CodeNode (itemAt givenArgs.children i)
        if (i > 0) {
          wr.out(", " false)
        }
        ; wr.out((arg.vref + " : ") false)
        if(arg.value_type != RangerNodeType.NoType) {
          this.WalkNode(n ctx wr)
        }        
    }
    if ((ctx.expressionLevel()) == 0) {
      wr.out(");" true)
    } {
      wr.out(")" false)
    }
  }
  fn CreateLambda:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def lambdaCtx (unwrap node.lambda_ctx)
    def fnNode:CodeNode (itemAt node.children 0)
    def args:CodeNode (itemAt node.children 1)
    def body:CodeNode (itemAt node.children 2)
    def sig (this.buildLambdaSignature( node))
    def iface_name (this.getSignatureInterface(sig)) 
    if( ( has iface_created iface_name) == false ) {
      set iface_created iface_name true
      def utilWr (wr.getFileWriter("." (iface_name + ".java")))
      utilWr.out("public interface " + iface_name + " { " , true)
      utilWr.indent(1)
      utilWr.out("public " false)
      this.writeTypeDef( fnNode ctx utilWr)
      utilWr.out(" run(" false)

      for args.children arg:CodeNode i {
          if (i > 0) {
            utilWr.out(", " false)
          }
          this.writeTypeDef(arg lambdaCtx utilWr)
          utilWr.out(" " false)
          utilWr.out(arg.vref  false)
          
      }    
      utilWr.out(");" true)
      utilWr.indent(-1)
      utilWr.out("}" true)
    }
    
    wr.out("new " + iface_name + "() { " , true)
    wr.indent(1)
    wr.out("public " false)
    this.writeTypeDef( fnNode ctx wr)
    wr.out(" run(" false)

    for args.children arg:CodeNode i {
        if (i > 0) {
          wr.out(", " false)
        }
        this.writeTypeDef(arg lambdaCtx wr)
        wr.out(" " false)
        wr.out(arg.vref  false)
        
    }    
    wr.out(") {" true)
    wr.indent(1)
    lambdaCtx.restartExpressionLevel()
    lambdaCtx.is_lambda = true
    for body.children item:CodeNode i {
      this.WalkNode(item lambdaCtx wr)
    }
    wr.newline()
    for lambdaCtx.captured_variables cname:string i {
      wr.out( "// captured var " + cname , true)
    }
    wr.indent(-1)
    wr.out("}" true)
    wr.indent(-1)
    wr.out("}" false)    
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

    for cl.capturedLocals dd@(lives):RangerAppParamDesc i {
      if(dd.is_class_variable == false ) {
        if ( dd.set_cnt > 0 ) {
          if(dd.varType == RangerContextVarType.FunctionParameter) {
            ctx.addError( (unwrap dd.nameNode) "Mutating captured function parameter is not allowed")
            return
          }          
          wr.out("// local captured " + dd.name , true)
          print "java captured"
          print (dd.node.getLineAsString())
          dd.node.disabled_node = true
          cl.addVariable(dd)
          def csubCtx:RangerAppWriterContext cl.ctx
          csubCtx.defineVariable(dd.name dd)
          dd.is_class_variable = true
        }
      }
    }    

    wr.out("" true)
    wr.out(("class " + cl.name) false)
    if ( ( array_length cl.extends_classes ) > 0 ) { 
      wr.out(" extends " false)
      for cl.extends_classes pName:string i {
        wr.out(pName false)
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
      if ( (variant.nameNode.hasFlag("main")) && (variant.nameNode.code.filename != (ctx.getRootFile()))) {     
        continue 
      }
      if (variant.nameNode.hasFlag("main")) {
        wr.out("public static void main(String [] args ) {" true)
      } {
        wr.out("public static " false)
        this.writeTypeDef( (unwrap variant.nameNode) ctx wr)
        wr.out(" " false)
        wr.out((variant.compiledName  + "(") false)
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
        wr.out((variant.compiledName  + "(") false)
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

