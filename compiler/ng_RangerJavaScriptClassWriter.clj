
class RangerJavaScriptClassWriter {

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
          ; if (p.nameNode.hasFlag("optional")) {
          ; }
          def part:string (itemAt node.ns 0)
          if ((part != "this") && (ctx.isMemberVariable(part))) {
            def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
            def currC:RangerAppClassDesc (unwrap uc)
            def up@(optional):RangerAppParamDesc (currC.findVariable(part))
            if (!null? up) {
              wr.out( "this." false)
            }
          }
          if(part == "this") {
            wr.out("this" false)
            continue
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
          wr.out("this." false)
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
          wr.out("." false)
        } {
          wr.out("." false)
        }
      }
      if (i == 0) {
        if (ctx.hasClass(part)) {
          b_was_static = true
        } {
          wr.out("" false)
        }
        if ((part != "this") && (ctx.isMemberVariable(part))) {
          def uc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
          def currC:RangerAppClassDesc (unwrap uc)
          def up@(optional):RangerAppParamDesc (currC.findVariable(part))
          if (!null? up) {
            wr.out("this." false)
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
      def remove_unused:boolean (ctx.hasCompilerFlag("remove-unused-class-vars"))

      if ((p.ref_cnt == 0) && (remove_unused || (p.is_class_variable == false))) {
       return
      }

      def was_set false
      
      if ((array_length node.children) > 2) {
        wr.out(("this." + p.compiledName + " = ") , false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
        was_set = true
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(("this." + p.compiledName ) , false)
          wr.out(" = []" false)
          was_set = true
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(("this." + p.compiledName ) , false)
          wr.out(" = {}" false)
          was_set = true
        }
      }
      if was_set {
        wr.out(";" false)
        if ((p.ref_cnt == 0) && (p.is_class_variable == true)) {
          wr.out("     /** note: unused */" false)
        }
        wr.newline()
      }
    }
  }
  fn writeVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      def opt_js:boolean (ctx.hasCompilerFlag("optimize-js"))
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("/** unused:  " false)
      }
      def has_value false
      if ((array_length node.children) > 2) {
        has_value = true
      }

      if ((p.set_cnt > 0) || p.is_class_variable || (has_value == false)) {
        wr.out(("let " + p.compiledName) false)
      } {
        wr.out(("const " + p.compiledName) false)
      }      
      
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
      if ((p.ref_cnt == 0) && (p.is_class_variable == true)) {
        wr.out("     /** note: unused */" false)
      }
      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("   **/ " true)
      } {
        wr.out(";" false)
        wr.newline()
      }
    }
  }
  fn writeClassVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }
  fn writeArgsDef:void (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out(", " false)
      }
      wr.out( arg.name false)
    }
  }

  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc

    if(cl.is_interface) {
      orig_wr.out("// interface : " + cl.name , true)
      return
    }

    if (null? cl) {
      return
    }
    def wr:CodeWriter orig_wr
    def importFork:CodeWriter (wr.fork())
    if (wrote_header == false) {
      wr.out("" true)
      wrote_header = true
    }

    def b_extd:boolean false
    wr.out("class " + cl.name +" " , false)
    
    for cl.extends_classes pName:string i {
      if( i == 0) {
        wr.out(" extends " false)
      }
      wr.out(pName false)
      b_extd = true
    }

    
    wr.out( " {" true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
      this.writeClassVarDef(( unwrap pvar.node ) ctx wr)
    }
    wr.out("constructor(" false)
    
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc (unwrap cl.constructor_fn)
      this.writeArgsDef(constr ctx wr)
    }
    wr.out(") {" true)
    wr.indent(1)

    if(b_extd) {
      wr.out("super()" true)
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
    for cl.defined_variants fnVar:string i {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {
        wr.out((("" + variant.compiledName) + " (") false)
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
      if (variant.nameNode.hasFlag("main")) {
        continue _
      } {
        wr.out((((cl.name + ".") + variant.compiledName) + " = function(") false)
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
    for cl.static_methods variant:RangerAppFunctionDesc i {
      ctx.disableCurrentClass()
      if ( (variant.nameNode.hasFlag("main")) && (variant.nameNode.code.filename == (ctx.getRootFile()))) {
        wr.out("/* static JavaSript main routine */" false)
        wr.newline()
        wr.out("function __js_main() {" true)
        wr.indent(1)
        this.WalkNode(( unwrap variant.fnBody ) ctx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
        wr.out("__js_main();" true)
      }
    }
  }
}

