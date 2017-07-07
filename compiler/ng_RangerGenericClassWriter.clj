
class RangerGenericClassWriter {

  def compiler:LiveCompiler

fn EncodeString:string (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def encoded_str:string ""
    def str_length:int (strlen node.string_value)
    def encoded_str:string ""
    def ii:int 0
    while (< ii str_length) {
      def cc:int (charAt node.string_value ii)
      switch cc {
        case 8 {
            encoded_str = encoded_str + (strfromcode 92 ) + (strfromcode 98 )  
        }
        case 9 {
            encoded_str = encoded_str + (strfromcode 92 ) + (strfromcode 116 ) 
        }    
        case 10 {
            ( = encoded_str ( encoded_str + (strfromcode 92 ) + (strfromcode 110 ) ) ) 
        }    
        case 12 {
            ( = encoded_str ( encoded_str + (strfromcode 92 ) + (strfromcode 102 ) ) ) 
        }    
        case 13 {
            ( = encoded_str ( encoded_str + (strfromcode 92 ) + (strfromcode 114 ) ) ) 
        }

        case 34 {
            ( = encoded_str ( encoded_str + (strfromcode 92 ) + (strfromcode 34 ) ) ) 
        }  
        case 92 {
            = encoded_str ( encoded_str + (strfromcode 92 ) + (strfromcode 92 ) ) 
        }
                                            
        default {
            ( = encoded_str ( encoded_str + (strfromcode cc) ) ) 
        }
      }
      ii = ii + 1
    }
    return encoded_str   
  }

  fn CustomOperator:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }

  fn WriteSetterVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {  
  }

  fn writeArrayTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {  
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
          this.WriteVRef( (unwrap nn) ctx wr)
        }
      }
    }
  }
  fn WriteScalarValue:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    switch node.value_type {
      case RangerNodeType.Double {
        wr.out(("" + node.double_value) , false)
      }
      case RangerNodeType.String {
        def s:string (this.EncodeString(node ctx wr))
        wr.out((("\"" + s) + "\"") , false)
      }
      case RangerNodeType.Integer {
        wr.out(("" + node.int_value) , false)
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
  fn getTypeString:string (type_string:string) {
    return type_string
  }
  fn import_lib:void (lib_name:string ctx:RangerAppWriterContext wr:CodeWriter) {
    wr.addImport(lib_name)
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
  fn release_local_vars:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    for ctx.localVarNames n:string i {
      def p:RangerAppParamDesc (get ctx.localVariables n)
      if (p.ref_cnt == 0) {
        continue _
      }
      if (p.isAllocatedType()) {
        if (1 == (p.getStrength())) {
          if (p.nameNode.eval_type == RangerNodeType.Hash) {
          }
          if (p.nameNode.eval_type == RangerNodeType.Array) {
          }
          if ((p.nameNode.eval_type != RangerNodeType.Array) && (p.nameNode.eval_type != RangerNodeType.Hash)) {
          }
        }
        if (0 == (p.getStrength())) {
          if (p.nameNode.eval_type == RangerNodeType.Hash) {
          }
          if (p.nameNode.eval_type == RangerNodeType.Array) {
          }
          if ((p.nameNode.eval_type != RangerNodeType.Array) && (p.nameNode.eval_type != RangerNodeType.Hash)) {
          }
        }
      }
    }
    if ctx.is_function {
      return
    }
    if (!null? ctx.parent) {
      this.release_local_vars(node (unwrap ctx.parent) wr)
    }
  }
  fn WalkNode:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    this.compiler.WalkNode(node ctx wr)
  }
  fn writeTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    wr.out(node.type_name false)
  }
  fn writeRawTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    this.writeTypeDef(node ctx wr)
  }
  fn adjustType:string (tn:string) {
    return tn
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
      }
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
      if (p.set_cnt > 0) {
        wr.out(("var " + p.name) false)
      } {
        wr.out(("const " + p.name) false)
      }
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
        wr.out(";" true)
      } {
        wr.out(";" true)
      }
    }
  }
  fn CreateLambdaCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def fName:CodeNode (itemAt node.children 0)
    def args:CodeNode (itemAt node.children 1)
    this.WriteVRef(fName ctx wr)
    wr.out("(" false)
    for args.children arg:CodeNode i {
      if (i > 0) {
        wr.out(", " false)
      }
      this.WalkNode( arg ctx wr)
    }
    wr.out(")" false)
  }
  fn CreateLambda:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def lambdaCtx (unwrap node.lambda_ctx)
    def args:CodeNode (itemAt node.children 1)
    def body:CodeNode (itemAt node.children 2)
    wr.out("(" false)
    for args.children arg:CodeNode i {
      if (i > 0) {
        wr.out(", " false)
      }
      this.WalkNode(arg lambdaCtx wr)
    }
    wr.out(")" false)
    wr.out(" => { " true)
    wr.indent(1)
    lambdaCtx.restartExpressionLevel()
    for body.children item:CodeNode i {
      this.WalkNode(item lambdaCtx wr)
    }
    wr.newline()
    wr.indent(-1)
    wr.out("}" true)
  }
  fn writeFnCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasFnCall {
      def fc:CodeNode (node.getFirst())
      this.WriteVRef(fc ctx wr)
      wr.out("(" false)
      def givenArgs:CodeNode (node.getSecond())
      ctx.setInExpr();
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
      ctx.unsetInExpr()
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
      wr.out(("new " + node.clDesc.name) false)
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
  
  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    wr.out((("class " + cl.name) + " { ") true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
      wr.out(((("/* var " + pvar.name) + " => " + (pvar.nameNode.parent.getCode())) + " */ ") true)
    }
    for cl.static_methods pvar:RangerAppFunctionDesc i {
      wr.out((("/* static " + pvar.name) + " */ ") true)
    }
    for cl.defined_variants fnVar:string i {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {
        wr.out((("function " + variant.name) + "() {") true)
        wr.indent(1)
        wr.newline()
        def subCtx:RangerAppWriterContext (ctx.fork())
        this.WalkNode( (unwrap variant.fnBody) subCtx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
      }
    }
    wr.indent(-1)
    wr.out("}" true)
  }
}

