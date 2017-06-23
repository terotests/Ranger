class RangerPHPClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
  def thisName:string "this"
  def wrote_header:boolean false
  fn adjustType:string (tn:string) {
    if (tn == "this") {
      return "this"
    } 
    return tn
  }

  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {


    if (node.vref == "this") {
      wr.out("$this" false)
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
            wr.out("$this" false)
            continue
          } 
        }        

        if (i > 0) {
          wr.out("->" false)
        }
        if (i == 0) {
          wr.out("$" false)
          if (p.nameNode.hasFlag("optional")) {
          }
          def part:string (itemAt node.ns 0)
          if ((part != "this") && (ctx.hasCurrentClass())) {
            def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
            def currC:RangerAppClassDesc (unwrap uc)
            def up@(optional):RangerAppParamDesc (currC.findVariable(part))
            if (!null? up) {
              wr.out((thisName + "->") false)
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
      wr.out("$" false)
      def part:string (itemAt node.ns 0)
      if ((part != "this") && (ctx.hasCurrentClass())) {

        def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
        def currC:RangerAppClassDesc (unwrap uc)
        def up@(optional):RangerAppParamDesc (currC.findVariable(part))
        if (!null? up) {
          wr.out((thisName + "->") false)
        }

      }
      def p:RangerAppParamDesc node.paramDesc
      wr.out(p.compiledName false)
      return
    }
    def b_was_static:boolean false
    for node.ns part:string i {
      if (i > 0) {
        if ((i == 1) && b_was_static) {
          wr.out("::" false)
        } {
          wr.out("->" false)
        }
      }
      if (i == 0) {
        if (ctx.hasClass(part)) {
          b_was_static = true
        } {
          wr.out("$" false)
        }
        if ((part != "this") && (ctx.hasCurrentClass())) {
          def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
          def currC:RangerAppClassDesc (unwrap uc)
          def up@(optional):RangerAppParamDesc (currC.findVariable(part))
          if (!null? up) {
            wr.out((thisName + "->") false)
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
        wr.out("/** unused:  " false)
      }
      wr.out(("$this->" + p.compiledName) false)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = array()" false)
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = array()" false)
        }
      }
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("   **/" true)
        return
      }
      wr.out(";" false)
      if ((p.ref_cnt == 0) && (p.is_class_variable == true)) {
        wr.out("     /** note: unused */" false)
      }
      wr.newline()
    }
  }
  fn writeVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("/** unused:  " false)
      }
      wr.out(("$" + p.compiledName) false)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = array()" false)
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = array()" false)
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
  fn writeClassVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      wr.out((("var $" + p.compiledName) + ";") true)
    }
  }
  fn writeArgsDef:void (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out("," false)
      }
      wr.out(((" $" + arg.name) + " ") false)
    }
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
        wr.out(";" true)
      }
    }
  }
  fn writeNewCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasNewOper {
      def cl:RangerAppClassDesc node.clDesc
      def fc:CodeNode (node.getSecond())
      wr.out(" new " false)
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
  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    def wr:CodeWriter orig_wr
    def importFork:CodeWriter (wr.fork())
    if (wrote_header == false) {
      wr.out("<? " true)
      wr.out("" true)
      wrote_header = true
    }
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
    for cl.variables pvar:RangerAppParamDesc i  {
      this.writeClassVarDef(( unwrap pvar.node ) ctx wr)
    }
    wr.out("" true)
    wr.out("function __construct(" false)
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc (unwrap cl.constructor_fn)
      this.writeArgsDef(constr ctx wr)
    }
    wr.out(" ) {" true)
    wr.indent(1)

    if(parentClass) {
      wr.out("parent::__construct();" true)
    }

    for cl.variables pvar:RangerAppParamDesc i {
      this.writeVarInitDef(( unwrap pvar.node ) ctx wr)
    }
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      wr.newline()
      def subCtx:RangerAppWriterContext ( unwrap constr.fnCtx )
      subCtx.is_function = true
      this.WalkNode(( unwrap constr.fnBody ) subCtx wr)
    }
    wr.newline()
    wr.indent(-1)
    wr.out("}" true)
    for cl.static_methods variant:RangerAppFunctionDesc i {
      wr.out("" true)
      if (variant.nameNode.hasFlag("main")) {
        continue _
      } {
        wr.out("public static function " false)
        wr.out((variant.name + "(") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") {" true)
      }
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext ( unwrap variant.fnCtx )
      subCtx.is_function = true
      this.WalkNode(( unwrap variant.fnBody ) subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    for cl.defined_variants fnVar:string i {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {
        wr.out("" true)
        wr.out((("function " + variant.name) + "(") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") {" true)
        wr.indent(1)
        wr.newline()
        def subCtx:RangerAppWriterContext ( unwrap variant.fnCtx )
        subCtx.is_function = true
        this.WalkNode(( unwrap variant.fnBody ) subCtx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
      }
    }
    wr.indent(-1)
    wr.out("}" true)
    for cl.static_methods variant:RangerAppFunctionDesc i {
      ctx.disableCurrentClass()
      wr.out("" true)
      if (variant.nameNode.hasFlag("main")) {
        wr.out("/* static PHP main routine */" false)
        wr.newline()
        this.WalkNode(( unwrap variant.fnBody ) ctx wr)
        wr.newline()
      }
    }
  }
}

