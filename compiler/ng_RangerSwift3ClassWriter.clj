class RangerSwift3ClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
  def header_created:boolean false
  fn adjustType:string (tn:string) {
    if (tn == "this") {
      return "self"
    }
    return tn
  }
  fn getObjectTypeString:string (type_string:string ctx:RangerAppWriterContext) {

    if(ctx.isDefinedClass(type_string)) {
      def cc (ctx.findClass(type_string))
      if(cc.is_union) {
        return "Any"
      }

      if(cc.is_system) {
        def sysName (get cc.systemNames "swift3")
        if(!null? sysName) {
          return (unwrap sysName)
        } {
          def node (new CodeNode( (new SourceCode("")) 0 0 ))
          ctx.addError(node ( 'No system class ' + type_string +  "defined for Swift "))
        }
      }      
    }

    switch type_string {

      case "int" {
        return "Int"
      }
      case "string" {
        return "String"
      }
      case "charbuffer" {
        return "[UInt8]"
      }
      case "char" {
        return "UInt8"
      }
      case "boolean" {
        return "Bool"
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
        return "Int"
      }
      case "string" {
        return "String"
      }
      case "charbuffer" {
        return "[UInt8]"
      }
      case "char" {
        return "UInt8"
      }      
      case "boolean" {
        return "Bool"
      }
      case "double" {
        return "Double"
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
        wr.out("(" false)
        wr.out("(" false)
        for sec.children arg:CodeNode i {
          if( i > 0 ) {
            wr.out(', ' false)
          }
          wr.out(' _ : ' , false )
          this.writeTypeDef( arg ctx wr)
        }
        wr.out( ') -> ' false)
        this.writeTypeDef( rv ctx wr)
        wr.out(')' false)
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
      case RangerNodeType.Char {
        wr.out("UInt8" false)
      }
      case RangerNodeType.CharBuffer {
        wr.out("[UInt8]" false)
      }
      case RangerNodeType.Boolean {
        wr.out("Bool" false)
      }
      case RangerNodeType.Hash {
        wr.out((((("[" + (this.getObjectTypeString(k_name ctx))) + ":") + (this.getObjectTypeString(a_name ctx))) + "]") false)
      }
      case RangerNodeType.Array {
        wr.out((("[" + (this.getObjectTypeString(a_name ctx))) + "]") false)
      }
      default {
        if (t_name == "void") {
          wr.out("Void" false)
          return
        }

        if(ctx.isDefinedClass(t_name)) {
          def cc (ctx.findClass(t_name))
          if(cc.is_union) {
            wr.out("Any" false)
            if (node.hasFlag("optional")) {
              wr.out("?" false)
            }            
            return
          }
          if(cc.is_system) {
            def sysName (get cc.systemNames "swift3")
            if(!null? sysName) {
              wr.out( (unwrap sysName) false)
            } {
              ctx.addError(node ( "No system class " + t_name +  "defined for Swift "))
            }
            if (node.hasFlag("optional")) {
              wr.out("?" false)
            }            
            return
          }      
        }        
        wr.out((this.getTypeString(t_name)) false)
      }
    }
    if (node.hasFlag("optional")) {
      wr.out("?" false)
    }
  }
  fn WriteEnum:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.eval_type == RangerNodeType.Enum) {
      def rootObjName:string (itemAt node.ns 0)
      def e@(optional):RangerAppEnum (ctx.getEnum(rootObjName))
      if (!null? e) {
        def enumName:string (itemAt node.ns 1)
        wr.out(("" + (unwrap (get e.values enumName))) false)
      } {
        if node.hasParamDesc {
          def pp:RangerAppParamDesc node.paramDesc
          def nn:CodeNode pp.nameNode
          wr.out(nn.vref false)
        }
      }
    }
  }
  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    if (node.vref == "this") {
      wr.out("self" false)
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
            wr.out("self" false)
            continue
          } 
          if ((part != "this") && (ctx.isMemberVariable(part))) {
            def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
            def currC:RangerAppClassDesc (unwrap uc)
            def up@(optional):RangerAppParamDesc (currC.findVariable(part))
            if (!null? up) {
              if( false == (ctx.isInStatic()) ) {
                wr.out("self." false)
              }               
            }
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
            wr.out((this.adjustType(( itemAt node.ns i))) false)
          }
        }
        if (i < (max_len - 1) ) {
          if (p.nameNode.hasFlag("optional")) {
            wr.out("!" false)
          }
        }
      }
      return
    }
    if node.hasParamDesc {
      def p:RangerAppParamDesc node.paramDesc
      def part:string (itemAt node.ns 0)
      if ((part != "this") && (ctx.isMemberVariable(part))) {
        def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
        def currC:RangerAppClassDesc (unwrap uc)
        def up@(optional):RangerAppParamDesc (currC.findVariable(part))
        if (!null? up) {
          if( false == (ctx.isInStatic()) ) {
            wr.out("self." false)
          }               
        }
      }        

      wr.out(p.compiledName false)
      return
    }
    for node.ns part:string i {
      if( i == 0) {
        if ((part != "this") && (ctx.isMemberVariable(part))) {
          def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
          def currC:RangerAppClassDesc (unwrap uc)
          def up@(optional):RangerAppParamDesc (currC.findVariable(part))
          if (!null? up) {
            if( false == (ctx.isInStatic()) ) {
              wr.out("self." false)
            }               
          }
        }        
        if(ctx.hasClass(part)) {
          def classDesc (ctx.findClass(part))
          wr.out(classDesc.compiledName false)
          continue
        }
      }
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

      if( nn.hasFlag("optional")) {
        if( p.set_cnt == 1 && p.ref_cnt == 2 && p.is_class_variable == false) {
          ctx.addError(node "Optional variable is only set but never read.")
        }
      }

      ; wr.out("// set " + p.set_cnt +" ref " + p.ref_cnt , true)
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("/** unused:  " false)
      }
      if ((p.set_cnt > 0) || p.is_class_variable) {
        wr.out((("var " + p.compiledName) + " : ") false)
      } {
        wr.out((("let " + p.compiledName) + " : ") false)
      }
      this.writeTypeDef( (unwrap p.nameNode) ctx wr)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = " false)
          this.writeTypeDef( (unwrap p.nameNode) ctx wr)
          wr.out("()" false)
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = " false)
          this.writeTypeDef( (unwrap p.nameNode) ctx wr)
          wr.out("()" false)
        }
      }
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
  fn writeArgsDef:void (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out(", " false)
      }
      wr.out((arg.compiledName + " : ") false)
      def nn (unwrap arg.nameNode)
;      if( nn.hasFlag("strong") ) {
        if(nn.value_type == RangerNodeType.ExpressionType ) {
          wr.out("  @escaping  " false)
        }
;      }
      this.writeTypeDef( (unwrap arg.nameNode) ctx wr)
    }
  }

  fn writeArgsDefWithLocals:void (fnDesc:RangerAppFunctionDesc localFnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {

    if( (array_length fnDesc.params) != (array_length localFnDesc.params) ) {
      ctx.addError( (unwrap localFnDesc.node) "Parameter count does not match with the function prototype")
      return
    }
    for fnDesc.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out(", " false)
      }
      def local (itemAt localFnDesc.params i)
      if( local.name != arg.name ) {
        wr.out(arg.compiledName + " " , false )
      }
      wr.out(local.compiledName + " : " , false)
      def nn (unwrap arg.nameNode)
      if( nn.hasFlag("strong") ) {
        if(nn.value_type == RangerNodeType.ExpressionType ) {
          wr.out("  @escaping  " false)
        }
      }    
      this.writeTypeDef( (unwrap arg.nameNode) ctx wr)
    }
  }

  fn CreateCallExpression(node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.has_call {
      def obj:CodeNode (node.getSecond())
      def method:CodeNode (node.getThird())
      def args:CodeNode (itemAt node.children 3)

      wr.out("(" false)
      ctx.setInExpr()
      this.WalkNode( obj ctx wr)
      ctx.unsetInExpr()
      wr.out(")." false)
      wr.out(method.vref false)
;       this.WriteVRef(fc ctx wr)
      wr.out("(" false)
      ctx.setInExpr()
      for args.children arg:CodeNode i {
        if (i > 0) {
          wr.out(", " false)
        }
        ; TODO: optionality check here ?
        ; this.WalkNode(arg ctx wr)
        ; got to find the target method somehow here...
        ; Continue the swift compiler here...

        if( ctx.isDefinedClass(obj.eval_type_name)) {
          def clDef (ctx.findClass(obj.eval_type_name))
          def clMethod (clDef.findMethod(method.vref))
          if(!null? clMethod) {
            def mm (unwrap clMethod)
            def pDesc (itemAt mm.params i)
    ;        def n:CodeNode (itemAt givenArgs.children i)
            wr.out((pDesc.compiledName + " : ") false)
            this.WalkNode(arg ctx wr)
            continue
          } 
        } {
          ctx.addError(arg "Could not find evaluated class for the call")          
        }
        this.WalkNode(arg ctx wr)          

      }
      ctx.unsetInExpr()
      wr.out(")" false)
      if ((ctx.expressionLevel()) == 0) {
        wr.out(";" true)
      }
    }    
  }


  fn writeFnCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasFnCall {
      def fc:CodeNode (node.getFirst())
      def fnName:CodeNode node.fnDesc.nameNode
      if ((ctx.expressionLevel()) == 0) {
        if (fnName.type_name != "void") {
          wr.out("_ = " false)
        }
      }
      this.WriteVRef(fc ctx wr)
      wr.out("(" false)
      ctx.setInExpr()
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
        wr.out((arg.compiledName + " : ") false)
        this.WalkNode(n ctx wr)
      }
      ctx.unsetInExpr()
      wr.out(")" false)
      if ((ctx.expressionLevel()) == 0) {
        wr.newline()
      }
    }
  }
  fn CreateLambdaCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def fName:CodeNode (itemAt node.children 0)
    def givenArgs:CodeNode (itemAt node.children 1)
    def rv:CodeNode 
    def args:CodeNode
    if( (!null? fName.expression_value) ) {
      rv  = ( itemAt fName.expression_value.children 0)
      args  = ( itemAt fName.expression_value.children 1)      
    } {
      def param (ctx.getVariableDef(fName.vref))
      rv  = ( itemAt param.nameNode.expression_value.children 0)
      args  = ( itemAt param.nameNode.expression_value.children 1)
    }

    if ((ctx.expressionLevel()) == 0) {
      if (rv.type_name != "void") {
        wr.out("_ = " false)
      }
    }
    ctx.setInExpr()
    this.WalkNode(fName ctx wr)
    wr.out("(" false)
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
    ctx.unsetInExpr()
    wr.out(")" false)
    if ((ctx.expressionLevel()) == 0) {
      wr.out(';' true)
    }    
  }
  fn CreateLambda:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def lambdaCtx (unwrap node.lambda_ctx)
    def fnNode:CodeNode (itemAt node.children 0)
    def args:CodeNode (itemAt node.children 1)
    def body:CodeNode (itemAt node.children 2)
    
    wr.out("({ (" false)
    for args.children arg:CodeNode i {
        if (i > 0) {
          wr.out(", " false)
        }
        ; --> TODO could be walking the node instead of just using the vref
        wr.out(arg.vref  false)
        ; this.writeTypeDef(arg lambdaCtx wr)
    }
    wr.out(") ->  " false)
    this.writeTypeDef(fnNode lambdaCtx wr)
    wr.out(" in " true)
    wr.indent(1)
    lambdaCtx.restartExpressionLevel()
    for body.children item:CodeNode i {
      this.WalkNode(item lambdaCtx wr)
    }
    wr.newline()

    for lambdaCtx.captured_variables cname:string i {
      wr.out( "// captured var " + cname , true)
    }

    wr.indent(-1)
    wr.out("})" false)
  }  
  
  fn writeNewCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasNewOper {
      def cl:RangerAppClassDesc node.clDesc
      def fc:CodeNode (node.getSecond())
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
          wr.out((arg.name + " : ") false)
          this.WalkNode(n ctx wr)
        }
      }
      wr.out(")" false)
    }
  }

  fn haveSameSig:boolean ( fn1:RangerAppFunctionDesc fn2:RangerAppFunctionDesc ctx:RangerAppWriterContext) {
    
      if(fn1.name != fn2.name) {
        return false
      }

      def match:RangerArgMatch (new RangerArgMatch())

      def n1:CodeNode (unwrap (fn1.nameNode))
      def n2:CodeNode (unwrap (fn1.nameNode))

      if( (match.doesDefsMatch(n1 n2 ctx)) == false) {
        return false
      }

      if( (array_length fn1.params) != (array_length fn2.params) ) {
        return false
      }

      for fn1.params p:RangerAppParamDesc i {
        def p2:RangerAppParamDesc (itemAt fn2.params i)
        if( (match.doesDefsMatch( (unwrap p.nameNode) (unwrap p2.nameNode) ctx) ) == false) {
          return false
        }
      }
      return true
  }

  fn CustomOperator:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    def fc:CodeNode (node.getFirst())
    def cmd:string fc.vref

    if( cmd == "switch" ) {
      def condition:CodeNode (node.getSecond())
      def case_nodes:CodeNode (node.getThird())
      wr.newline()
      
      wr.out("switch (" false)
      this.WalkNode( condition ctx wr )
      wr.out(") {" true)
      wr.indent(1)

      def found_default false
      for case_nodes.children ch:CodeNode i {
        def blockName (ch.getFirst())
        if (blockName.vref == "default") {
          found_default = true
          this.WalkNode( ch ctx wr )
        } {
          this.WalkNode( ch ctx wr )
        }
      }
      if ( false == found_default ) {
        wr.newline()
        wr.out("default :" true)
        wr.indent(1)
        wr.out("break" true) 
        wr.indent(-1)
      }
      wr.indent(-1)
      wr.out("}" true) 

    }
  }   


  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    def declaredVariable:[string:boolean]
    def dblDeclaredFunction:[string:boolean]
    def declaredFunction:[string:boolean]
    def declaredStaticFunction:[string:boolean]
    def parentFunction@(weak):[string:RangerAppFunctionDesc]
    if ( ( array_length cl.extends_classes ) > 0 ) { 
      for cl.extends_classes pName:string i {
        def pC:RangerAppClassDesc (ctx.findClass(pName))
        for pC.variables pvar:RangerAppParamDesc i {
          set declaredVariable pvar.name true
        }
        for pC.defined_variants fnVar:string i {
          def mVs:RangerAppMethodVariants (get pC.method_variants fnVar)
          for mVs.variants variant:RangerAppFunctionDesc i {
            set declaredFunction variant.name true
            set parentFunction variant.name variant
          }
        }
        for pC.static_methods variant:RangerAppFunctionDesc i {
          set declaredStaticFunction variant.name true
        }
      }
    }
    if( header_created == false) {
      wr.createTag("utilities")
      header_created = true
    }

    wr.out("func ==(l: " + cl.compiledName +  ", r: " + cl.compiledName +  ") -> Bool {" , true)
    wr.indent(1)
    wr.out("return l === r" true)
    wr.indent(-1)
    wr.out("}" true)

    wr.out(("class " + cl.compiledName) false)

    def parentClass:RangerAppClassDesc
    
    if ( ( array_length cl.extends_classes ) > 0 ) { 
      wr.out(" : " false)
      for cl.extends_classes pName:string i {
        parentClass = (ctx.findClass(pName))
        wr.out(parentClass.compiledName false)
      }
    } {
      wr.out(" : Equatable " false )
    }  
    
    wr.out( " { " true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
      if( has declaredVariable pvar.name ) {
        wr.out("// WAS DECLARED : " + pvar.name , true)
        continue
      }
      this.writeVarDef( (unwrap pvar.node) ctx wr)
    }
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      def b_must_override:boolean false
      if(parentClass) {
          if( (array_length constr.params) == 0 ) {
              b_must_override = true
          } {
              if(parentClass.has_constructor) {
                def p_constr:RangerAppFunctionDesc (unwrap parentClass.constructor_fn)
                if( this.haveSameSig( (unwrap constr) p_constr ctx)) {
                  b_must_override = true
                }
              }
          }
      }

      if(b_must_override) {
        wr.out("override " false)
      }

      wr.out("init(" false)
      this.writeArgsDef( (unwrap constr) ctx wr)
      wr.out(" ) {" true)
      wr.indent(1)

      if(parentClass) {
        ; TODO: call with correct parameters too!!!
        wr.out("super.init()" true)
      }

      wr.newline()
      def subCtx:RangerAppWriterContext (unwrap constr.fnCtx)
      subCtx.is_function = true
      this.WalkNode( (unwrap constr.fnBody) subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    for cl.static_methods variant:RangerAppFunctionDesc i {
      if (variant.nameNode.hasFlag("main")) {
        continue _
      }
      if ( has declaredStaticFunction variant.name ) {
        wr.out("override " false)
      }
      wr.out((("class func " + variant.compiledName) + "(") false)
      this.writeArgsDef(variant ctx wr)
      wr.out(") -> " false)
      this.writeTypeDef( (unwrap variant.nameNode) ctx wr)
      wr.out(" {" true)
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
        if(has dblDeclaredFunction variant.name) {
          continue
        }
        if(has declaredFunction variant.name) {
          wr.out("override " false)
        }

        set dblDeclaredFunction variant.name true
        wr.out((("func " + variant.compiledName) + "(") false)

        if(has parentFunction variant.name) {
          this.writeArgsDefWithLocals( (unwrap (get parentFunction variant.name)) variant ctx wr)
        } {
          this.writeArgsDef(variant ctx wr)
        }
        
        wr.out(") -> " false)
        this.writeTypeDef( (unwrap variant.nameNode) ctx wr)
        wr.out(" {" true)
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
    for cl.static_methods variant:RangerAppFunctionDesc i {
      if ( (variant.nameNode.hasFlag("main")) && (variant.nameNode.code.filename == (ctx.getRootFile()))) {
        def theEnd (wr.getTag("file_end"))

        theEnd.newline()
        theEnd.out("func __main__swift() {" true)
        theEnd.indent(1)
        def subCtx:RangerAppWriterContext (unwrap variant.fnCtx)
        subCtx.is_function = true
        this.WalkNode( (unwrap variant.fnBody) subCtx theEnd)
        theEnd.newline()
        theEnd.indent(-1)
        theEnd.out("}" true)
        theEnd.out("// call the main function" true)
        theEnd.out("__main__swift()" true)
        if( ctx.hasCompilerFlag('forever')) {
          theEnd.out('CFRunLoopRun()' true)
        }
      }
    }
  }
}

