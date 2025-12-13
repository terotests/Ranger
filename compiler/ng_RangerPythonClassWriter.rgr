class RangerPythonClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
  def thisName:string "self"
  def wrote_header:boolean false

  fn adjustType:string (tn:string) {
    if (tn == "this") {
      return "self"
    } 
    return tn
  }

  fn EncodeString:string (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def encoded_str:string ""
    def str_length:int (strlen node.string_value)
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
            encoded_str = encoded_str + (strfromcode 92 ) + (strfromcode 110 )
        }    
        case 12 {
            encoded_str = encoded_str + (strfromcode 92 ) + (strfromcode 102 )
        }    
        case 13 {
            encoded_str = encoded_str + (strfromcode 92 ) + (strfromcode 114 )
        }
        case 34 {
            encoded_str = encoded_str + (strfromcode 92 ) + (strfromcode 34 )
        }  
        case 92 {
            encoded_str = encoded_str + (strfromcode 92 ) + (strfromcode 92 )
        }
        default {
            encoded_str = encoded_str + (strfromcode cc)
        }
      }
      ii = ii + 1
    }
    return encoded_str   
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
          wr.out("True" false)
        } {
          wr.out("False" false)
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

    if ((array_length node.nsp) > 0) {
      for node.nsp p:RangerAppParamDesc i {
        if (i == 0) {
          def part:string (itemAt node.ns 0)
          if(part == "this") {
            wr.out("self" false)
            continue
          } 
        }        

        if (i > 0) {
          wr.out("." false)
        }
        if (i == 0) {
          if (p.nameNode.hasFlag("optional")) {
          }
          def part:string (itemAt node.ns 0)
          if ((part != "this") && (ctx.isMemberVariable(part))) {
            def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
            def currC:RangerAppClassDesc (unwrap uc)
            def up@(optional):RangerAppParamDesc (currC.findVariable(part))
            if (!null? up) {
              if( false == (ctx.isInStatic()) ) {
                wr.out((thisName + ".") false)
              }               
            }
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
      def part:string (itemAt node.ns 0)
      if ((part != "this") && (ctx.isMemberVariable(part))) {
        def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
        def currC:RangerAppClassDesc (unwrap uc)
        def up@(optional):RangerAppParamDesc (currC.findVariable(part))
        if (!null? up) {
          if( false == (ctx.isInStatic()) ) {
            wr.out((thisName + ".") false)
          }
        }
      }
      def p:RangerAppParamDesc node.paramDesc
      wr.out(p.compiledName false)
      return
    }

    def b_was_static:boolean false
    for node.ns part:string i {
      if (i > 0) {
        wr.out("." false)
      }
      if (i == 0) {
        if (ctx.hasClass(part)) {
          b_was_static = true
        }
        if ((part != "this") && (ctx.hasCurrentClass())) {
          def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
          def currC:RangerAppClassDesc (unwrap uc)
          def up@(optional):RangerAppParamDesc (currC.findVariable(part))
          if (!null? up) {
            if( false == (ctx.isInStatic()) ) {
              wr.out((thisName + ".") false)
            }
          }
        }
      }
      wr.out((this.adjustType(part)) false)
    }
  }

  fn writeVarInitDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("# unused:  " false)
      }
      wr.out(("self." + p.compiledName) false)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = []" false)
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = {}" false)
        }
      }
      wr.newline()
    }
  }

  fn writeVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("# unused:  " false)
      }
      wr.out(p.compiledName false)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = []" false)
        } {
          if (nn.value_type == RangerNodeType.Hash) {
            wr.out(" = {}" false)
          } {
            wr.out(" = None" false)
          }
        }
      }
      wr.newline()
    }
  }

  fn CreateMethodCall(node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def obj:CodeNode (node.getFirst())
    def args:CodeNode (node.getSecond())
    ctx.setInExpr()
    this.WalkNode( obj ctx wr)
    ctx.unsetInExpr()
    wr.out('(' false)
    ctx.setInExpr()
    for args.children arg:CodeNode i {
      if (i > 0) {
        wr.out(', ' false)
      }
      this.WalkNode(arg ctx wr)
    }
    ctx.unsetInExpr()
    wr.out(')' false)
  }

  fn CreatePropertyGet(node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def obj:CodeNode (node.getSecond())
    def prop:CodeNode (node.getThird())
    ctx.setInExpr()
    this.WalkNode( obj ctx wr)
    ctx.unsetInExpr()
    wr.out('.' false)
    wr.out(prop.vref false)
  }
  
  fn CreateLambdaCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def fName:CodeNode (itemAt node.children 0)
    def givenArgs:CodeNode (itemAt node.children 1)

    def args:CodeNode
    if( (!null? fName.expression_value) ) {
      args = ( itemAt fName.expression_value.children 1)      
    } {
      def param (ctx.getVariableDef(fName.vref))
      args = ( itemAt param.nameNode.expression_value.children 1)
    }
    ctx.setInExpr()
    this.WalkNode(fName ctx wr)
    wr.out('(' false)

    for args.children arg:CodeNode i {
      def n:CodeNode (itemAt givenArgs.children i)
      if (i > 0) {
        wr.out(', ' false)
      }
      if(arg.value_type != RangerNodeType.NoType) {
        this.WalkNode(n ctx wr)
      }        
    }
    ctx.unsetInExpr()
    wr.out(")" false)
    if ((ctx.expressionLevel()) == 0) {
      wr.newline()
    }
  }

  fn CreateLambda:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def lambdaCtx (unwrap node.lambda_ctx)
    def fnNode:CodeNode (itemAt node.children 0)
    def args:CodeNode (itemAt node.children 1)
    def body:CodeNode (itemAt node.children 2)
   
    wr.out("lambda " false)
    for args.children arg:CodeNode i {
      if (i > 0) {
        wr.out(", " false)
      }
      this.WalkNode(arg lambdaCtx wr)  
    }    
    wr.out(": " false)
    
    ; Python lambdas are single expressions, so this is simplified
    lambdaCtx.restartExpressionLevel()
    for body.children item:CodeNode i {
      this.WalkNode(item lambdaCtx wr)
    }
  } 

  fn writeClassVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    ; Python doesn't need class variable declarations at class level
    ; They are initialized in __init__
  }

  fn writeArgsDef:void (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out(", " false)
      }
      wr.out(arg.compiledName false)
    }
  }

  fn writeArrayLiteral( node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    wr.out("[" false)
    node.children.forEach({
      if( index > 0 ) {
        wr.out(", " false)
      }
      this.WalkNode( item ctx wr )
    })
    wr.out("]" false)
  }
  
  fn writeFnCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasFnCall {
      def fc:CodeNode (node.getFirst())
      this.WriteVRef(fc ctx wr)
      wr.out("(" false)
      def givenArgs:CodeNode (node.getSecond())
      ctx.setInExpr()
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
        wr.newline()
      }
    }
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
          if( true || (!null? arg.nameNode)) {
            this.WalkNode(n ctx wr)
          }
        }
      }
      wr.out(")" false)
    }
  }

  fn CreateCallExpression(node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.has_call {
      def obj:CodeNode (node.getSecond())
      def method:CodeNode (node.getThird())
      def args:CodeNode (itemAt node.children 3)

      ctx.setInExpr()
      this.WalkNode( obj ctx wr)
      ctx.unsetInExpr()
      wr.out("." false)
      wr.out(method.vref false)
      wr.out("(" false)
      ctx.setInExpr()

      for args.children arg:CodeNode i {
        if (i > 0) {
          wr.out(", " false)
        }
        this.WalkNode(arg ctx wr)
      }
      ctx.unsetInExpr()
      wr.out(")" false)
      if ((ctx.expressionLevel()) == 0) {
        wr.newline()
      }
    }    
  }

  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    def declaredFunction:[string:boolean]
    def wr:CodeWriter orig_wr
    def importFork:CodeWriter (wr.fork())

    if (wrote_header == false) {
      wr.out("# -*- coding: utf-8 -*-" true)
      wr.out("" true)
      wrote_header = true
    }

    wr.out(("class " + cl.name) false)
    def parentClass:RangerAppClassDesc  
    if ( ( array_length cl.extends_classes ) > 0 ) { 
      wr.out("(" false)
      for cl.extends_classes pName:string i {
        wr.out(pName false)
        parentClass = (ctx.findClass(pName))
      }
      wr.out(")" false)
    }    
    wr.out(":" true)
    wr.indent(1)

    ; Constructor (__init__)
    wr.out("def __init__(self" false)
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc (unwrap cl.constructor_fn)
      if ((array_length constr.params) > 0) {
        wr.out(", " false)
        this.writeArgsDef(constr ctx wr)
      }
    }
    wr.out("):" true)
    wr.indent(1)

    if(parentClass) {
      wr.out("super().__init__()" true)
    }

    def hasContent:boolean false
    for cl.variables pvar:RangerAppParamDesc i {
      this.writeVarInitDef(( unwrap pvar.node ) ctx wr)
      hasContent = true
    }
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      wr.newline()
      def subCtx:RangerAppWriterContext ( unwrap constr.fnCtx )
      subCtx.is_function = true
      this.WalkNode(( unwrap constr.fnBody ) subCtx wr)
      hasContent = true
    }
    if (hasContent == false) {
      wr.out("pass" true)
    }
    wr.newline()
    wr.indent(-1)

    ; Static methods
    for cl.static_methods variant:RangerAppFunctionDesc i {
      if (variant.nameNode.hasFlag("main")) {
        continue _
      } {
        wr.out("@staticmethod" true)
        wr.out(("def " + variant.compiledName + "(") false)
        this.writeArgsDef(variant ctx wr)
        wr.out("):" true)
      }
      wr.indent(1)
      def subCtx:RangerAppWriterContext ( unwrap variant.fnCtx )
      subCtx.is_function = true
      subCtx.in_static_method = true
      this.WalkNode(( unwrap variant.fnBody ) subCtx wr)
      subCtx.in_static_method = false
      wr.newline()
      wr.indent(-1)
    }

    ; Instance methods
    for cl.defined_variants fnVar:string i {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {
        if(has declaredFunction variant.name) {
          continue
        }
        set declaredFunction variant.name true
        wr.out(("def " + variant.compiledName + "(self") false)
        if ((array_length variant.params) > 0) {
          wr.out(", " false)
          this.writeArgsDef(variant ctx wr)
        }
        wr.out("):" true)
        wr.indent(1)
        def subCtx:RangerAppWriterContext ( unwrap variant.fnCtx )
        subCtx.is_function = true
        subCtx.in_static_method = false
        this.WalkNode(( unwrap variant.fnBody ) subCtx wr)
        wr.newline()
        wr.indent(-1)
      }
    }
    wr.indent(-1)
    wr.newline()

    ; Main function at module level
    for cl.static_methods variant:RangerAppFunctionDesc i {
      ctx.disableCurrentClass()
      ctx.in_static_method = true
      if ( (variant.nameNode.hasFlag("main")) && (variant.nameNode.code.filename == (ctx.getRootFile()))) {
        wr.out("# Main entry point" true)
        wr.out("def main():" true)
        wr.indent(1)
        this.WalkNode(( unwrap variant.fnBody ) ctx wr)
        wr.indent(-1)
        wr.newline()
        wr.out("if __name__ == \"__main__\":" true)
        wr.indent(1)
        wr.out("main()" true)
        wr.indent(-1)
      }
      ctx.in_static_method = false
    }
  }
}
