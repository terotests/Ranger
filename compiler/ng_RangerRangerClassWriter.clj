
class RangerRangerClassWriter {

  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler

  fn adjustType:string (tn:string) {
    if (tn == "this") {
      return "this"
    } 
    return tn
  }

  fn getObjectTypeString:string (type_string:string ctx:RangerAppWriterContext) {
      return type_string
  }
  
  fn getTypeString:string (type_string:string) {
      return type_string
  }

  fn writeArrayLiteral( node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    wr.out("([] " false)
    node.children.forEach({
      if( index > 0 ) {
        wr.out(" " false)
      }
      this.WalkNode( item ctx wr )
    })
    wr.out(")" false)
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
    if ( v_type == RangerNodeType.Hash ) {
        wr.out("[" + k_name + ":" + a_name + "]" , false )
        return
    }
    if ( v_type == RangerNodeType.Array ) {
        wr.out("[" + a_name + "]" , false )
        return
    }
    wr.out(t_name false)
  }

  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
      wr.out(node.vref false)
  }

  fn WriteVRefWithOpt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
      wr.out(node.vref false)
      def flags:[string] ([] _:string ("optional" "weak" "strong" "temp" "lives" "returns" "returnvalue"))
      def some_set:boolean false
      for flags flag:string i {
          if(node.hasFlag(flag)) {
            if (false == some_set) {
                wr.out("@(" false)
                some_set = true
            } {
                wr.out(" " false)
            }
            wr.out(flag false)
          }
      }
      if some_set {
          wr.out(")" false)
      }
  }  

  fn writeVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      wr.out("def " false)
      this.WriteVRefWithOpt( nn ctx wr)
      wr.out( ":" false)
      this.writeTypeDef((unwrap p.nameNode) ctx wr)
      if ((array_length node.children) > 2) {
        wr.out(" " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      }    
      wr.newline()
    } 
  }


  fn CreateLambdaCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def fName:CodeNode (itemAt node.children 0)
    def args:CodeNode (itemAt node.children 1)
    this.WriteVRef(fName ctx wr)
    wr.out("(" false)
    for args.children arg:CodeNode i {
      if (i > 0) {
        wr.out(" " false)
      }
      this.WalkNode( arg ctx wr)
    }
    wr.out(")" false)
    if ((ctx.expressionLevel()) == 0) {
      wr.out(" " true)
    }
  }
  ; the lambda transform...
  fn CreateLambda:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def lambdaCtx (unwrap node.lambda_ctx)

    def nn:CodeNode (itemAt node.children 0)
    def args:CodeNode (itemAt node.children 1)
    def body:CodeNode (itemAt node.children 2)
    wr.out("(fn:" false)
    this.writeTypeDef( nn ctx wr)
    wr.out(" (" false)

    for args.children arg:CodeNode i {
      if (i > 0) {
        wr.out(" " false)
      }
      this.WriteVRefWithOpt( arg ctx wr )
      wr.out(":" false)
      this.writeTypeDef(arg ctx wr)
    }
    wr.out(")" false)
    wr.out(" { " true)
    wr.indent(1)
    lambdaCtx.restartExpressionLevel()
    ; print "==> walking the lambda Ctx... target language is ==> " + (lambdaCtx.getTargetLang())
    def newLambdaCtx (lambdaCtx.fork())
    newLambdaCtx.targetLangName = "ranger"
    ; print "==> walking the lambda Ctx... newLambdaCtx language is ==> " + (newLambdaCtx.getTargetLang())
    for body.children item:CodeNode i {
      this.WalkNode(item newLambdaCtx wr)
    }
    wr.newline()
    wr.indent(-1)
    wr.out("})" true)
  }
  fn writeFnCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasFnCall {

      if ((ctx.expressionLevel()) > 0) {
        wr.out("(" false)
      }      
      def fc:CodeNode (node.getFirst())
      this.WriteVRef(fc ctx wr)
      wr.out("(" false)
      def givenArgs:CodeNode (node.getSecond())
      ctx.setInExpr();
      for node.fnDesc.params arg:RangerAppParamDesc i {
        if (i > 0) {
          wr.out(" " false)
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
      ctx.unsetInExpr()
      wr.out(")" false)

      if ((ctx.expressionLevel()) > 0) {
        wr.out(")" false)
      }      
      if ((ctx.expressionLevel()) == 0) {
        wr.newline()
      }
    }
  }  

  fn writeNewCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasNewOper {
      def cl:RangerAppClassDesc node.clDesc
      def fc:CodeNode (node.getSecond())
      wr.out(("(new " + node.clDesc.name) false)
      wr.out("(" false)
      def constr:RangerAppFunctionDesc cl.constructor_fn
      def givenArgs:CodeNode (node.getThird())
      if (!null? constr) {
        for constr.params arg:RangerAppParamDesc i {
          def n:CodeNode (itemAt givenArgs.children i)
          if (i > 0) {
            wr.out(" " false)
          }
          if( true || (!null? arg.nameNode)) {
            this.WalkNode(n ctx wr)
          }       
        }
      }
      wr.out("))" false)
    }
  }

  fn writeArgsDef:void (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out("," false)
      }
      wr.out(" " false)
      this.WriteVRefWithOpt( (unwrap arg.nameNode) ctx wr )
      wr.out(":" false)
      this.writeTypeDef((unwrap arg.nameNode) ctx wr)
    }
  }

  fn CreateCallExpression(node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.has_call {
      def obj:CodeNode (node.getSecond())
      def method:CodeNode (node.getThird())
      def args:CodeNode (itemAt node.children 3)

      wr.out("(call " false)
      ctx.setInExpr()
      this.WalkNode( obj ctx wr)
      ctx.unsetInExpr()
      wr.out(" " false)
      wr.out(method.vref false)
;       this.WriteVRef(fc ctx wr)
      wr.out("(" false)
      ctx.setInExpr()
      for args.children arg:CodeNode i {
        if (i > 0) {
          wr.out(" " false)
        }
        ; TODO: optionality check here ?
        this.WalkNode(arg ctx wr)
      }
      ctx.unsetInExpr()
      wr.out("))" false)
      if ((ctx.expressionLevel()) == 0) {
        ; wr.out(";" true)
      }
    }    
  }

  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    ; def wr:CodeWriter (orig_wr.getFileWriter("." (cl.name + ".java")))
    def wr:CodeWriter orig_wr
    def importFork:CodeWriter (wr.fork())
    wr.out("" true)
    wr.out(("class " + cl.name) false)
    wr.out( " { " true)
    wr.indent(1)
    if ( ( array_length cl.extends_classes ) > 0 ) { 
      wr.out("Extends(" false)
      for cl.extends_classes pName:string i {
        wr.out(pName false)
      }
      wr.out(")" true)
    }  

    wr.createTag("utilities")
    for cl.variables pvar:RangerAppParamDesc i {
      this.writeVarDef( (unwrap pvar.node) ctx wr)
    }
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      wr.out("" true)
      wr.out("Constructor (" false)
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
        wr.out("sfn m@(main):void () {" true)
      } {
        wr.out("sfn " false)
        this.WriteVRefWithOpt( (unwrap variant.nameNode)  ctx wr)
        wr.out(":" false)
        this.writeTypeDef( (unwrap variant.nameNode) ctx wr)        
        wr.out(" (" false)
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
        wr.out("fn " false)
        this.WriteVRefWithOpt( (unwrap variant.nameNode)  ctx wr)
        wr.out(":" false)
        this.writeTypeDef( (unwrap variant.nameNode) ctx wr)
        wr.out(" " false)
        wr.out("(" false)
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
      importFork.out(("Import \"" + codeStr + "\"") true)
    }
  }
}

