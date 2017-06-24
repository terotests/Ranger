class RangerSwift3ClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
  fn adjustType:string (tn:string) {
    if (tn == "this") {
      return "self"
    }
    return tn
  }
  fn getObjectTypeString:string (type_string:string ctx:RangerAppWriterContext) {
    switch type_string {
      case "int" {
        return "Int"
      }
      case "string" {
        return "String"
      }
      case "chararray" {
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
        wr.out((((("[" + (this.getObjectTypeString(node.key_type ctx))) + ":") + (this.getObjectTypeString(node.array_type ctx))) + "]") false)
      }
      case RangerNodeType.Array {
        wr.out((("[" + (this.getObjectTypeString(node.array_type ctx))) + "]") false)
      }
      default {
        if (node.type_name == "void") {
          wr.out("Void" false)
          return
        }
        wr.out((this.getTypeString(node.type_name)) false)
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
      wr.out((arg.name + " : ") false)
      this.writeTypeDef( (unwrap arg.nameNode) ctx wr)
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
        wr.out((arg.name + " : ") false)
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


  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    wr.out(("class " + cl.name) false)

    def parentClass:RangerAppClassDesc
    
    if ( ( array_length cl.extends_classes ) > 0 ) { 
      wr.out(" : " false)
      for cl.extends_classes pName:string i {
        wr.out(pName false)
        parentClass = (ctx.findClass(pName))
      }
    }    
    
    wr.out( " { " true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
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
      wr.out((("static func " + variant.name) + "(") false)
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
        wr.out((("func " + variant.name) + "(") false)
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
    }
    wr.indent(-1)
    wr.out("}" true)
    for cl.static_methods variant:RangerAppFunctionDesc i {
      def b:boolean (variant.nameNode.hasFlag("main"))
      if b {
        wr.newline()
        def subCtx:RangerAppWriterContext (unwrap variant.fnCtx)
        subCtx.is_function = true
        this.WalkNode( (unwrap variant.fnBody) subCtx wr)
        wr.newline()
      }
    }
  }
}

