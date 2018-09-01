
Import "ng_WebPageWriter.clj"

class RangerJavaScriptClassWriter {

  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
  def thisName:string "this"
  def wrote_header:boolean false

  def target_flow false
  def target_typescript false

  fn lineEnding:string () {
    return ";"
  }

  fn adjustType:string (tn:string) {
    if (tn == "this") {
      return "this"
    } 
    return tn
  }

  fn CreateTsUnions (parser:RangerFlowParser ctx:RangerAppWriterContext wr:CodeWriter) {
    def root (ctx.getRoot())
    root.definedClasses.forEach({
      ; index == name
      ; item == class description
      if(item.is_union) {
        ; TODO: implement system class unions too...
        wr.out( ( "type union_" + index + " = " )  false)
        wr.indent(1)
          def cnt 0
          item.is_union_of.forEach({
            if (ctx.isDefinedClass(item)) {
              def cl (ctx.findClass(item))
              if( false == (cl.isNormalClass() ) ) {
                return
              }
              if( cnt > 0 ) {
                wr.out("|" false)
              }
              wr.out( (this.getObjectTypeString( item ctx ) ) false ) 
              cnt = cnt + 1
            } {
              if( cnt > 0 ) {
                wr.out("|" false)
              }
              wr.out( (this.getObjectTypeString( item ctx ) ) false ) 
              cnt = cnt + 1
            }
          })
        wr.indent(-1)
        wr.out(";"  true)
      }
    })
  }

  fn writeFnCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasFnCall {
      def fc:CodeNode (node.getFirst())

      if( (!null? node.fnDesc) && (!null? node.fnDesc.nameNode) ) {
        def fnName:CodeNode node.fnDesc.nameNode
        if( fnName.hasFlag('async') ) {
          wr.out('await ' false)
        }
      }

      this.WriteVRef(fc ctx wr)
      wr.out("(" false)
      def givenArgs:CodeNode (node.getSecond())
      ctx.setInExpr();
      def cnt 0
      for node.fnDesc.params arg:RangerAppParamDesc i {
        if( arg.nameNode.hasFlag('keyword')) {
          continue
        }
        if (cnt > 0) {
          wr.out(', ' false)
        }
        cnt = cnt + 1
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

      if(has node.methodChain) {
        ; wr.newline()
        ; wr.indent(1)
        for node.methodChain cc:CallChain i {
          wr.out("." + cc.methodName , false)
          wr.out("(" false)
          ctx.setInExpr()
          for cc.args.children arg:CodeNode i {
            if (i > 0) {
              wr.out(", " false)
            }
            this.WalkNode( arg ctx wr)            
          }
          ctx.unsetInExpr()
          wr.out(")" false)
        }
        ; wr.indent(-1)
      }

      if ((ctx.expressionLevel()) == 0) {
        wr.out(";" true)
      }
    }
  }
  
  fn CreateCallExpression(node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.has_call {
      def obj:CodeNode (node.getSecond())
      def method:CodeNode (node.getThird())
      def args:CodeNode (itemAt node.children 3)

      if( (!null? node.fnDesc) && (!null? node.fnDesc.nameNode) ) {
        def fnName:CodeNode node.fnDesc.nameNode
        if( fnName.hasFlag('async') ) {
          wr.out('await ' false)
        }
      }

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
        this.WalkNode(arg ctx wr)
      }
      ctx.unsetInExpr()
      wr.out(")" false)
      if ((ctx.expressionLevel()) == 0) {
        wr.out(";" true)
      }
    }    
  }

  ; typescript type 
  fn getObjectTypeString:string (type_string:string ctx:RangerAppWriterContext) {
    switch type_string {
      case "int" {
        return "number"
      }
      case "string" {
        return "string"
      }
      case "charbuffer" {
        return "string"
      }
      case "char" {
        return "number"
      }
      case "boolean" {
        return "boolean"
      }
      case "double" {
        return "number"
      }
    }
    if(ctx.isDefinedClass(type_string)) {
      def cc (ctx.findClass(type_string))
      if(cc.is_system) {
        def current_sys (ctx)
        def sName (unwrap (get cc.systemNames "es6"))
        return sName        
      }
      ; define the unions
      if(cc.is_union) {
        return ("union_" + cc.name)
      }
    }
    return type_string
  }
  fn getTypeString:string (type_string:string) {
    switch type_string {
      case "int" {
        return "number"
      }
      case "string" {
        return "string"
      }
      case "charbuffer" {
        return "string"
      }
      case "char" {
        return "number"
      }
      case "boolean" {
        return "boolean"
      }
      case "double" {
        return "number"
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
    ; std::function<int (int, int)>
    switch v_type {
      case RangerNodeType.ExpressionType {

        ; (n: number) => any
        def rv:CodeNode (itemAt node.expression_value.children 0)
        def sec:CodeNode (itemAt node.expression_value.children 1)
        def fc:CodeNode (sec.getFirst())

        wr.out("(" false)
        for sec.children arg:CodeNode i {
          if( i > 0 ) {
            wr.out(", " false)
          }
          this.WalkNode( arg ctx wr )
          wr.out(":" false)
          this.writeTypeDef( arg ctx wr)
        }
        wr.out(") => " false )
        this.writeTypeDef( rv ctx wr)
        
      }   
      case RangerNodeType.Enum {
        wr.out("number" false)
      }
      case RangerNodeType.Integer {
        wr.out("number" false)
      }
      case RangerNodeType.Char {
        wr.out("number" false)
      }  
      case RangerNodeType.CharBuffer {
        wr.out("string" false)
      }            
      case RangerNodeType.Double {
        wr.out("number" false)
      }
      case RangerNodeType.String {
        wr.out("string" false)
      }
      case RangerNodeType.Boolean {
        wr.out("boolean" false)
      }
      case RangerNodeType.Hash {
        wr.out((((("{[key:" + (this.getObjectTypeString(k_name ctx))) + "]:") + (this.getObjectTypeString(a_name ctx)))) + "}" , false)
      }
      case RangerNodeType.Array {
        wr.out((("Array<" + (this.getObjectTypeString(a_name ctx))) + ">") false)
      }
      default {
        if (node.type_name == "void") {
          wr.out("void" false)
          return
        }
        if(ctx.isDefinedClass(t_name)) {
          def cc (ctx.findClass(t_name))

          if(cc.is_system) {
            def current_sys (ctx)
            def sName (unwrap (get cc.systemNames "es6"))
            print " typedef for system class " + sName
            wr.out(sName false)
            return         
          }
          
          if(cc.is_union) {
            wr.out("union_" false)
            wr.out(t_name false)
            return
          }          
          def cc:RangerAppClassDesc (ctx.findClass(t_name))
          print " typedef for class " + cc.name
          wr.out(cc.name false)
          return
        }
        wr.out((this.getTypeString(t_name)) false))
      }
    }
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
          if(nn.hasFlag("immutable")) {
            wr.out(" = require('immutable').List()" false)
          } {
             wr.out(" = []" false)
          }
          was_set = true
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(("this." + p.compiledName ) , false)
          ; wr.out(" = {}" false)
          if(nn.hasFlag("immutable")) {
            wr.out(" = require('immutable').Map()" false)
          } {
             wr.out(" = {}" false)
          }          
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

      if target_typescript {
        wr.out(" : " false)
        this.writeTypeDef((unwrap p.nameNode) ctx wr)
        wr.out(" " false)        
      }
      
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        ; the compiler could call the operators here with possibly some parameters ?
        if (nn.value_type == RangerNodeType.Array) {
          if(nn.hasFlag("immutable")) {
            wr.out(" = require('immutable').List()" false)
          } {
            wr.out(" = []" false)
          }          
        }
        if (nn.value_type == RangerNodeType.Hash) {
          if(nn.hasFlag("immutable")) {
            wr.out(" = require('immutable').Map()" false)
          } {
            wr.out(" = {}" false)
          }          
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
  fn writeClassVarDef:void (p:RangerAppParamDesc ctx:RangerAppWriterContext wr:CodeWriter) {
      if target_typescript {
        wr.out( p.compiledName false)
        wr.out(": " false)
        this.writeTypeDef( (unwrap p.nameNode) ctx wr)
        wr.out(";" true)
      }
  }

  fn CreateLambdaCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def fName:CodeNode (itemAt node.children 0)
    def args:CodeNode (itemAt node.children 1)
    ctx.setInExpr()

    def currM ( ctx.getCurrentMethod( ))

    if( (!null? currM.nameNode) && (currM.nameNode.hasFlag('async'))) {
        wr.out('await ' false)      
    }
    this.WalkNode( fName ctx wr)
;    this.WriteVRef(fName ctx wr)
    wr.out("(" false)
    for args.children arg:CodeNode i {
      if (i > 0) {
        wr.out(", " false)
      }
      this.WalkNode( arg ctx wr)
    }
    wr.out(")" false)
    ctx.unsetInExpr()
    if ((ctx.expressionLevel()) == 0) {
      wr.out(";" true)
    }
  }

  fn CreateLambda:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def lambdaCtx (unwrap node.lambda_ctx)
    def fName:CodeNode (itemAt node.children 0)    
    def args:CodeNode (itemAt node.children 1)
    def body:CodeNode (itemAt node.children 2)

    if ((ctx.expressionLevel()) > 0) {
      wr.out('(' false)
    }

    if( fName.hasFlag('async') ) {
      wr.out('async ' false)
    }
    
    wr.out("(" false)
    for args.children arg:CodeNode i {
      if (i > 0) {
        wr.out(', ' false)
      }
      if(arg.flow_done == false) {
        this.compiler.parser.WalkNode( arg lambdaCtx wr)  
      }
      this.WalkNode(arg lambdaCtx wr)
      if target_typescript {
        wr.out(' : ' false)
        this.writeTypeDef( arg ctx wr)      
      }
    }
    wr.out(')' false)
    if(target_typescript) {
      wr.out(":" false)
      if( fName.hasFlag('async') ) {
        wr.out(' Promise<' false)
      }      
      this.writeTypeDef( fName ctx wr)
      if( fName.hasFlag('async') ) {
        wr.out('>' false)
      }       
    }
    wr.out(' => { ' true)
    wr.indent(1)
    lambdaCtx.restartExpressionLevel()
    for body.children item:CodeNode i {
      ; print "lambda row " + (item.getCode())
      ; if(has item.register_expressions) {
      ;   print "Lambda had register expressions at : " + (item.getCode())
      ; }
      this.WalkNode(item lambdaCtx wr)
    }
    wr.newline()
    wr.indent(-1)
    wr.out("}" false)

    if ((ctx.expressionLevel()) > 0) {
      wr.out(')' false)
    } {
      wr.out('' true)
    }
    
  }
  
  fn writeArgsDef:void (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    def cnt 0
    def pms (filter (fnDesc.params) {
      if( item.nameNode.hasFlag('keyword')) {
        return false
      }
      return true
    })
    for pms arg:RangerAppParamDesc i {
      if (cnt > 0) {
        wr.out(', ' false)
      }
      cnt = cnt + 1
      wr.out( arg.compiledName false)
      if target_typescript {
        wr.out(' : ' false)
        this.writeTypeDef( (unwrap arg.nameNode) ctx wr)      
      }
    }
  }

  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {

    def cl:RangerAppClassDesc node.clDesc
    def is_react_native:boolean false
    def is_rn_default false

    if( (ctx.hasCompilerFlag('dead4main')) || (ctx.hasCompilerSetting('dceclass'))) {
      if(cl.is_used_by_main == false) {
        return
      }
    }

    if(cl.is_interface) {
      orig_wr.out("// interface : " + cl.name , true)
      return
    }
    if (null? cl) {
      return
    }
    if(cl.nameNode.hasFlag("ReactNative")) {
      is_react_native = true
      set this.compFlags "ReactNative" true
    }
    if(cl.nameNode.hasFlag("default")) {
      is_rn_default = true
    }
    def wr:CodeWriter orig_wr
    def importFork:CodeWriter (wr.fork())
    if (wrote_header == false) {
      wrote_header = true

      if(ctx.hasCompilerFlag("nodecli")) {
        wr.out("#!/usr/bin/env node" true)
      }

      ; write the npm exports at the end of the file if required...
      if(ctx.hasCompilerFlag("nodemodule")) {
        def root (ctx.getRoot())
        root.definedClasses.forEach({

          if( (ctx.hasCompilerFlag('dead4main')) || (ctx.hasCompilerSetting('dceclass'))) {
            if(item.is_used_by_main == false) {
              return
            }
          }          
          if(item.isNormalClass()) {
              def theEnd (wr.getTag("file_end"))
              theEnd.out( ("module.exports." + item.name + " = " + item.name + ";") true )
          }
        })
      }
      ; javascript option for the flow types...
      target_flow = (ctx.hasCompilerFlag("flow"))
      target_typescript = (ctx.hasCompilerFlag("typescript"))
      if( target_typescript ) {
        this.CreateTsUnions( (unwrap this.compiler.parser) ctx wr )
      }
      if(ctx.hasCompilerFlag("npm")) {
        this.writeNpmPackage( node ctx wr )
      }      
    }
    def b_extd:boolean false

    if( is_react_native ) {
      wr.out("export " false)
      if(is_rn_default) {
        wr.out(" default " false)
      }
    }

    wr.out("class " + cl.name +" " , false)
    
    if is_react_native {
      wr.out(" extends Component " false)
    } {
      for cl.extends_classes pName:string i {
        if( i == 0) {
          wr.out(" extends " false)
        }
        wr.out(pName false)
        b_extd = true
      }
    }
    
    wr.out( " {" true)
    wr.indent(1)
    ; define the class variables
    for cl.variables pvar:RangerAppParamDesc i {
      this.writeClassVarDef( pvar ctx wr)
    }

    if(is_react_native == false) {

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
    }
    for cl.defined_variants fnVar:string i {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {

        if( variant.nameNode.hasFlag('async') ) {
          wr.out('async ' false)
        }
        wr.out((("" + variant.compiledName) + " (") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(")" false)
        
        if target_typescript {
          wr.out(" : " false)

          if( variant.nameNode.hasFlag('async') ) {
            wr.out(' Promise<' false)
          }          
          this.writeTypeDef( (unwrap variant.nameNode ) ctx wr)
          if( variant.nameNode.hasFlag('async') ) {
            wr.out('>' false)
          }             
          wr.out(" " false)        
        }

        wr.out(" {" true)
        wr.indent(1)
        wr.newline()
        def subCtx:RangerAppWriterContext ( unwrap variant.fnCtx )
        subCtx.is_function = true
        subCtx.localVariables.forEach({
          if(item.is_register) {
            wr.out( ('// register ' + item.name) true)
          }
        })        
        this.WalkNode(( unwrap variant.fnBody ) subCtx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("};" true)
      }
    }

    if target_typescript  {
      for cl.static_methods variant:RangerAppFunctionDesc i {
        if (variant.nameNode.hasFlag("main")) {
          continue _
        } 

     
        wr.out("static " false)
        if( variant.nameNode.hasFlag('async') ) {
          wr.out('async ' false)
        }   
        wr.out((("" + variant.compiledName) + " (") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(")" false)        
        wr.out(" : " false)

        if( variant.nameNode.hasFlag('async') ) {
          wr.out(' Promise<' false)
        }                
        this.writeTypeDef( (unwrap variant.nameNode ) ctx wr)
        if( variant.nameNode.hasFlag('async') ) {
          wr.out('> ' false)
        }        


        wr.out(" " false)        
        wr.out(" {" true)
        wr.indent(1)
        wr.newline()
        def subCtx:RangerAppWriterContext ( unwrap variant.fnCtx )
        subCtx.is_function = true
        this.WalkNode(( unwrap variant.fnBody ) subCtx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("};" true)

      }
    }
    
    wr.indent(-1)
    wr.out("}" true)
    
    if ( target_typescript == false ) {
      for cl.static_methods variant:RangerAppFunctionDesc i {
        if (variant.nameNode.hasFlag("main")) {
          continue _
        } {
          def asyncKeyword ""
          if( variant.nameNode.hasFlag('async') ) {
            asyncKeyword = 'async '
          }
          wr.out((((cl.name + ".") + variant.compiledName) + " = " + asyncKeyword + "function(") false)
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
        wr.out("};" true)
      }
    }
    if( (ctx.hasCompilerFlag("nodemodule")) == false ) {
      for cl.static_methods variant:RangerAppFunctionDesc i {
        ctx.disableCurrentClass()
        if ( (variant.nameNode.hasFlag("main")) && (variant.nameNode.code.filename == (ctx.getRootFile()))) {  

          def asyncKeyword ""
          if( variant.nameNode.hasFlag('async') ) {
            asyncKeyword = 'async '
          }

          def theEnd (wr.getTag("file_end"))
          theEnd.out("/* static JavaSript main routine at the end of the JS file */" false)
          theEnd.newline()
          theEnd.out( (asyncKeyword + "function __js_main() {") true)
          theEnd.indent(1)
          this.WalkNode(( unwrap variant.fnBody ) ctx theEnd)
          theEnd.newline()
          theEnd.indent(-1)
          theEnd.out("}" true)
          theEnd.out("__js_main();" true)
        }
      }
    }
  }

  fn BuildAST:CodeNode ( code_string:string) {
      def lang_code:SourceCode (new SourceCode ( code_string ) )
      lang_code.filename = "services"
      def lang_parser:RangerLispParser (new RangerLispParser (lang_code))
      lang_parser.parse(false)
      def node@(lives):CodeNode (unwrap lang_parser.rootNode)
      return node
  }

  fn CreateServices (parser:RangerFlowParser ctx:RangerAppWriterContext orig_wr:CodeWriter) {

    if(ctx.hasCompilerFlag("client")) {
      ctx.addError( (CodeNode.blockNode()) "client service writing for target JavaScript is not implemented")
      return
    } 

    def root (ctx.getRoot())

    def serviceBlock (CodeNode.blockNode())

    def wr (new CodeWriter)
    wr.out("class test_webservice {" true)
    wr.indent(1)
    wr.out("fn run () {" true)
    wr.indent(1)
    wr.out("def www (create_web_server)" true)
    wr.out("prepare_server www" true);
    root.appServices.forEach({

        try {

          def paramList (item.getThird())
          def param (paramList.getFirst())
        
          wr.out("www.post_route(\"/" + item.appGUID + "\" {" , true)
          wr.indent(1)
          wr.out("def obj (" + (param.type_name) +  ".fromDictionary( (from_string (get_post_data req ))) )" , true)
          wr.out("def service (new appServices)" true)
          wr.out("def data (service." + item.appGUID + "(obj))" , true)
          wr.out("res.send((to_string (data.toDictionary())))" , true)
          wr.indent(-1)
          wr.out("})" true)

          def nn (item.getSecond())
          nn.vref = item.appGUID
          def params (item.getThird())

          def block_index 3
          def ch_len ( ( array_length item.children ) - 1)
          for item.children cb:CodeNode i {
            if( i > 3 ) {
              if( (strlen cb.vref) > 0 ) {
                if( ( ctx.hasCompilerFlag(cb.vref) ) && ( i < ch_len ) ) {
                  block_index = i + 1
                }
              }
            }
          }

          def codeBlock (unwrap (item.getChild(block_index)) )
          push serviceBlock.children (r.op "fn" nn params codeBlock)  


        } {
          ctx.addError( item "Invalid service function")
        }
    })
    wr.indent(-1)
    wr.out("www.startServer( 1777, {" , true)
    wr.indent(1)
      wr.out("print \"Server started\"" true)
    wr.indent(-1)
    wr.out("}" true)
    wr.out("}" true)
    wr.indent(-1)
    wr.out("}" true)
    
    def codeNode (this.BuildAST( (wr.getCode() )) )
    def serviceClassDef (r.op "class" (r.vref "appServices") serviceBlock )
    
    def subCtx (root.fork())
    def theEnd (orig_wr.getTag("file_end"))

    parser.WalkCollectMethods( serviceClassDef root theEnd )
    parser.WalkCollectMethods( codeNode root theEnd )
    parser.WalkNode( serviceClassDef root theEnd )
    parser.WalkNode( codeNode root theEnd )

    theEnd.out("(new test_webservice).run();" true)

  }

  fn CreatePages (parser:RangerFlowParser ctx:RangerAppWriterContext orig_wr:CodeWriter) {

      def wr:CodeWriter (orig_wr.getFileWriter("." ("pages.js")))
    
      ; TODO: the application container could be here
      wr.out("class theApplicationClass {" true)
      wr.indent(1)
      ctx.appPages.forEach({
        this.CreatePage(parser item ctx wr)
      })
      wr.indent(-1)
      wr.out("}" true)
  }

  fn CreatePage (parser:RangerFlowParser node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def writer (new WebPageWriter)
    writer.classWriter = this
    writer.CreatePage( parser node ctx orig_wr )
  }

  fn writeNpmPackage ( node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter ) {
    def wr:CodeWriter (orig_wr.getFileWriter("." ("package.json")))
    def opts ([] "name" "version" "description" "author" "license")
    wr.out("{" true)
    wr.indent(1)
    opts.forEach({
      if( (ctx.hasCompilerSetting(item)) == false ) {
        ctx.addError( node ("NPM package requires option -" + item + "=<value>") )
      } {
        wr.out( ('"' + item + '" : "' + (ctx.getCompilerSetting(item)) + '",') true)
      }
    })
    def target_file (ctx.getCompilerSetting("o"))
    if( ctx.hasCompilerFlag("nodecli")) {
      wr.out( ('"bin": {"' + (ctx.getCompilerSetting("name")) +'":"' + target_file + '"},') true)
    }
    wr.out('"scripts":{},' true)
    wr.out( ('"main":"' + target_file + '"') true)
    wr.indent(-1)
    wr.out("}" true)    
  }
  
}

