class RangerCppClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
  def header_created:boolean false
  fn adjustType:string (tn:string) {
    if (tn == "this") {
      return "this"
    }
    return tn
  }

  ; std::string

  fn WriteScalarValue:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    switch node.value_type {
      case RangerNodeType.Double {
        wr.out(("" + node.double_value) , false)
      }
      case RangerNodeType.String {
        def s:string (this.EncodeString(node ctx wr))
        wr.out( "std::string(" + (("\"" + s) + "\"") + ")" , false)
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

  fn getObjectTypeString:string (type_string:string ctx:RangerAppWriterContext) {
    switch type_string {
      case "char" {
        return "char"
      }   
      case "charbuffer" {
        return "const char*"
      }       
      case "int" {
        return "int"
      }
      case "string" {
        return "std::string"
      }
      case "boolean" {
        return "bool"
      }
      case "double" {
        return "double"
      }
    }
    if(ctx.isEnumDefined(type_string)) {
      return "int"
    }      
    if(ctx.isDefinedClass(type_string)) {

      def cc (ctx.findClass(type_string))
      if(cc.is_union) {
        ; TODO: how about optionals?
        return ("r_union_" + type_string)
      }
      
      return "std::shared_ptr<" + type_string + ">"
    }
    return type_string
  }
  fn getTypeString2:string (type_string:string ctx:RangerAppWriterContext) {
    switch type_string {
      case "char" {
        return "char"
      }   
      case "charbuffer" {
        return "const char*"
      }       
      case "int" {
        return "int"
      }
      case "string" {
        return "std::string"
      }
      case "boolean" {
        return "bool"
      }
      case "double" {
        return "double"
      }
    }
    if(ctx.isEnumDefined(type_string)) {
      return "int"
    }     
    return type_string
  }
  
  fn writePtr:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.type_name == "void") {
      return
    }
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
        def rv:CodeNode (itemAt node.expression_value.children 0)
        def sec:CodeNode (itemAt node.expression_value.children 1)
        def fc:CodeNode (sec.getFirst())
        this.import_lib("<functional>" ctx wr)

        wr.out("std::function<" false)
        this.writeTypeDef( rv ctx wr)
        wr.out("(" false)
        for sec.children arg:CodeNode i {
          if( i > 0 ) {
            wr.out(", " false)
          }
          this.writeTypeDef( arg ctx wr)
        }
        wr.out(")>" false)
        
      }   
      case RangerNodeType.Enum {
        wr.out("int" false)
      }
      case RangerNodeType.Integer {
        if(node.hasFlag("optional")) {
          wr.out(" r_optional_primitive<int> " false)
        } {
          wr.out("int" false)
        }
      }
      case RangerNodeType.Char {
        wr.out("char" false)
      }  
      case RangerNodeType.CharBuffer {
        wr.out("const char*" false)
      }            
      case RangerNodeType.Double {
        if(node.hasFlag("optional")) {
          wr.out(" r_optional_primitive<double> " false)
        } {
          wr.out("double" false)
        }
      }
      case RangerNodeType.String {
        wr.addImport("<string>")
        wr.out("std::string" false)
      }
      case RangerNodeType.Boolean {
        wr.out("bool" false)
      }
      case RangerNodeType.Hash {
        wr.out((((("std::map<" + (this.getObjectTypeString(k_name ctx))) + ",") + (this.getObjectTypeString(a_name ctx)))) + ">" , false)
        wr.addImport("<map>")
      }
      case RangerNodeType.Array {
        wr.out((("std::vector<" + (this.getObjectTypeString(a_name ctx))) + ">") false)
        wr.addImport("<vector>")
      }
      default {

        if (node.type_name == "void") {
          wr.out("void" false)
          return
        }

        ; r_union_myValues

        if(ctx.isDefinedClass(t_name)) {

          def cc (ctx.findClass(t_name))
          if(cc.is_union) {
            wr.out("r_union_" false)
            wr.out(t_name false)
;            if (node.hasFlag("optional")) {
;              wr.out("?" false)
;            }            
            return
          }          
          def cc:RangerAppClassDesc (ctx.findClass(t_name))
          wr.out("std::shared_ptr<" false)
          wr.out(cc.name false)
          wr.out(">" false)
          return
        }

        if(node.hasFlag("optional")) {
          wr.out("std::shared_ptr<std::vector<" false)
          wr.out((this.getTypeString2(t_name ctx)) false)
          wr.out(">" false)
          return
        }
        wr.out((this.getTypeString2(t_name ctx)) false))
      }
    }
  }
  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.vref == "this") {
      ; std::dynamic_pointer_cast<RangerAppClassDesc>

      def currC (ctx.getCurrentClass())
      if(!null? currC) {
        def cc (unwrap currC)
        if( (array_length cc.extends_classes) > 0 ) {
          wr.out("std::dynamic_pointer_cast<" + cc.name + ">(shared_from_this())" , false)
          return
        }
      }
      wr.out("shared_from_this()" false)
      return
    }
    if (node.eval_type == RangerNodeType.Enum) {
      def rootObjName:string (itemAt node.ns 0)
      if( ( array_length node.ns) > 1 ) {
        def enumName:string (itemAt node.ns 1)
        def e@(optional):RangerAppEnum (ctx.getEnum(rootObjName))
        if (!null? e) {
          wr.out(("" + (unwrap (get e.values enumName))) false)
          return
        }
      }
    }
    def had_static:boolean false
    if ((array_length node.nsp) > 0) {
      for node.nsp p:RangerAppParamDesc i {
        if (i > 0) {
          if(had_static) {
            wr.out("::" false)
          } {
            wr.out("->" false)
          }
        }
        if (i == 0) {
          def part:string (itemAt node.ns 0)
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
        if (p.isClass()) {
          had_static = true
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
        if had_static {
          wr.out("::" false)
        } {
          wr.out("->" false)
        }
      }

      if (ctx.hasClass(part)) {
        had_static = true
      } {
        had_static = false
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
        wr.out("" false)
      } {
        wr.out("" false)
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
        ;if (nn.value_type == RangerNodeType.Array) {
        ;  wr.out(" = new " false)
        ;  this.writeTypeDef((unwrap p.nameNode) ctx wr)
        ;  wr.out("()" false)
        ;}
        ;if (nn.value_type == RangerNodeType.Hash) {
        ;  wr.out(" = new " false)
        ;  this.writeTypeDef((unwrap p.nameNode) ctx wr)
        ;  wr.out("()" false)
        ;}
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

  fn disabledVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc
      if ((p.set_cnt > 0) || p.is_class_variable) {
        wr.out("" false)
      } {
        wr.out("" false)
      }

      wr.out(p.compiledName false)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        ;if (nn.value_type == RangerNodeType.Array) {
        ;  wr.out(" = new " false)
        ;  this.writeTypeDef((unwrap p.nameNode) ctx wr)
        ;  wr.out("()" false)
        ;}
        ;if (nn.value_type == RangerNodeType.Hash) {
        ;  wr.out(" = new " false)
        ;  this.writeTypeDef((unwrap p.nameNode) ctx wr)
        ;  wr.out("()" false)
        ;}
      }
      wr.out(";" false)
      wr.newline()
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
      wr.out(")->" false)
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

  fn CustomOperator:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    def fc:CodeNode (node.getFirst())
    def cmd:string fc.vref

    if( cmd == "return" ) {
      if(ctx.isInMain()) {
        wr.out("return 0;" true)
      } {
        wr.out("return;" true)
      }
      return
    }

    if( cmd == "switch" ) {
      def condition:CodeNode (node.getSecond())
      def case_nodes:CodeNode (node.getThird())
      wr.newline()
      

      def p@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
      p.name = "caseMatched"
      p.value_type = RangerNodeType.Boolean
      ctx.defineVariable(p.name p)      

      def b_has_default false
      for case_nodes.children ch:CodeNode i {
        def blockName (ch.getFirst())
        if (blockName.vref == "default") {
          b_has_default = true
        }
      }
      if b_has_default {
        wr.out("bool " + p.compiledName + " = false;" , true)
      }
      for case_nodes.children ch:CodeNode i {
        def blockName (ch.getFirst())
        if (blockName.vref == "default") {
          def defBlock (ch.getSecond())
          wr.out("if( ! " false)
          wr.out(p.compiledName false )
          wr.out(") {" true)
          wr.indent(1)
          this.WalkNode( defBlock ctx wr )
          wr.indent(-1)
          wr.out("}" true)
        } {
          def caseValue (ch.getSecond())
          def caseBlock (ch.getThird())
          wr.out("if( " false)
          this.WalkNode( condition ctx wr )
          wr.out(" == " false)
          this.WalkNode( caseValue ctx wr )
          wr.out(") {" true)
          wr.indent(1)
          if b_has_default {
            wr.out(p.compiledName + " = true;" , true)
          }
          this.WalkNode( caseBlock ctx wr )
          wr.indent(-1)
          wr.out("}" true)
        }
      }

    }
  }  

  fn CreateMethodCall(node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    ; property access...
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
        ; TODO: optionality check here ?
        this.WalkNode(arg ctx wr)
      }
      ctx.unsetInExpr()
      wr.out(')' false)
  }


  fn CreatePropertyGet(node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    ; property access...
      def obj:CodeNode (node.getSecond())
      def prop:CodeNode (node.getThird())
      wr.out('(' false)
      ctx.setInExpr()
      this.WalkNode( obj ctx wr)
      ctx.unsetInExpr()
      wr.out(')->' false)
      this.WalkNode(prop ctx wr)
  }


  fn CreateLambdaCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
    def fName:CodeNode (itemAt node.children 0)
    def givenArgs:CodeNode (itemAt node.children 1)

    def args:CodeNode
    if( (!null? fName.expression_value) ) {
      args  = ( itemAt fName.expression_value.children 1)      
    } {
      def param (ctx.getVariableDef(fName.vref))
      args  = ( itemAt param.nameNode.expression_value.children 1)
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
    wr.out(")" false)
    ctx.unsetInExpr()
    if ((ctx.expressionLevel()) == 0) {
      wr.out(";" true)
    }    
  }
  fn CreateLambda:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    this.import_lib("<functional>" ctx wr)

    def lambdaCtx (unwrap node.lambda_ctx)
    def fnNode:CodeNode (itemAt node.children 0)
    def args:CodeNode (itemAt node.children 1)
    def body:CodeNode (itemAt node.children 2)

    ; capture by reference, not value
    ; http://en.cppreference.com/w/cpp/language/lambda
    ; [=] captures all automatic values by copy and current object by reference
    ; [&] all by reference
    
    wr.out("[&" false)


    for lambdaCtx.captured_variables cname:string i {
      def vD (lambdaCtx.getVariableDef( cname ) )

      if( vD.varType == RangerContextVarType.FunctionParameter ) {
        wr.out(', ' false)
        wr.out( (vD.compiledName) false)     
      }

      ; is function parameter ?
;      if(vD.)
;      wr.out(', ' false)
;      wr.out( ("&" + vD.compiledName) false)
    }    

    ;for lambdaCtx.captured_variables cname:string i {
    ;  if(i>=0) {
    ;    wr.out(", " false)
    ;  }
    ;  def vD (lambdaCtx.getVariableDef( cname ) )
      ; capture by reference, not value
      ; http://en.cppreference.com/w/cpp/language/lambda
      ; [=] captures all automatic values by copy and current object by reference
      ; [&] all by reference
    ;  wr.out( ("&" + vD.compiledName) false)
    ;}    
    wr.out("](" false)

    for args.children arg:CodeNode i {
        if (i > 0) {
          wr.out(", " false)
        }
        this.writeTypeDef( arg ctx wr)
        wr.out(" " false)
        wr.out(arg.vref  false)
    }    
    wr.out(") mutable { " true)
    wr.indent(1)
    lambdaCtx.restartExpressionLevel()
    for body.children item:CodeNode i {
      this.WalkNode(item lambdaCtx wr)
    }
    wr.newline()
    wr.indent(-1)
    wr.out("}" false)
  } 

  fn writeCppHeaderVar:void  (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter do_initialize:boolean) {
    if node.hasParamDesc {
      def nn:CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc nn.paramDesc

      ; TODO: optionals...

      if ((p.ref_cnt == 0) && (p.is_class_variable == false)) {
        wr.out("/** unused:  " false)
      }
      if ((p.set_cnt > 0) || p.is_class_variable) {
        wr.out("" false)
      } {
        wr.out("" false)
      }
      this.writeTypeDef((unwrap p.nameNode) ctx wr)
      wr.out(" " false)
      wr.out(p.compiledName false)
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
  fn writeArgsDef:void  (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out("," false)
      }
      wr.out(" " false)
      this.writeTypeDef( (unwrap arg.nameNode) ctx wr)
      wr.out(((" " + arg.compiledName) + " ") false)
    }
  }
  fn writeFnCall:void  (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasFnCall {
      def fc:CodeNode (node.getFirst())
      this.WriteVRef(fc ctx wr)
      wr.out("(" false)
      ctx.setInExpr()
      def givenArgs:CodeNode (node.getSecond())
      for node.fnDesc.params arg:RangerAppParamDesc i {
        if (i > 0) {
          wr.out(", " false)
        }
        if ( i >= ( array_length givenArgs.children) ) {
          def defVal:CodeNode (arg.nameNode.getFlag("default"))
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
  fn writeNewCall:void  (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasNewOper {
      def cl:RangerAppClassDesc node.clDesc
      def fc:CodeNode (node.getSecond())
      wr.out(" std::make_shared<" false)
      wr.out(node.clDesc.name false)
      wr.out(">(" false)
      def constr:RangerAppFunctionDesc cl.constructor_fn
      def givenArgs:CodeNode (node.getThird())
      if (!null? constr) {
        for constr.params arg:RangerAppParamDesc i {
          def n:CodeNode (itemAt givenArgs.children i)
          if (i > 0) {
            wr.out(", " false)
          }
          if ( true || (!null? arg.nameNode) ) {
            this.WalkNode(n ctx wr)
          }
        }
      }
      wr.out(")" false)
    }
  }
;           this.createPolyfill( cmdArgs.string_value )

  fn writeArrayLiteral( node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    this.compiler.createPolyfill("
template< typename T, size_t N >
std::vector<T> r_make_vector_from_array( const T (&data)[N] )
{
    return std::vector<T>(data, data+N);
}
" ctx wr)     
    wr.out("r_make_vector_from_array( (" false)
    ; this.writeTypeDef( node ctx wr)
    wr.out( (this.getObjectTypeString( node.eval_array_type ctx )) false )
    wr.out("[] ) {" false)
    node.children.forEach({
      if( index > 0 ) {
        wr.out(", " false)
      }
      this.WalkNode( item ctx wr )
    })
    wr.out("} )" false)
  }
  
  fn writeClassHeader:void  (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }
    def inheritedVars:[string:boolean]
    wr.out(("class " + cl.name) , false)
    if ( ( array_length cl.extends_classes ) > 0 ) { 
      wr.out(" : " false)
      for cl.extends_classes pName:string i {
        wr.out("public " false)
        wr.out(pName false)
        def extC (ctx.findClass(pName))
        for extC.variables pvar:RangerAppParamDesc i {
          set inheritedVars pvar.name true
        }
      }
    } {
      wr.out(" : public std::enable_shared_from_this<" + cl.name +  "> " , false)
    }

    wr.out(" { " true)
    wr.indent(1)
    wr.out("public :" true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
      if( (has inheritedVars pvar.name) == false) {
        this.writeCppHeaderVar( (unwrap pvar.node) ctx wr false)
      }
    }
    wr.out("/* class constructor */ " true)
    wr.out((cl.name + "(") false)
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      this.writeArgsDef((unwrap constr) ctx wr)
    }
    wr.out(" );" true)
    for cl.static_methods variant:RangerAppFunctionDesc i {
      if (i == 0) {
        wr.out("/* static methods */ " true)
      }
      wr.out("static " false)
      this.writeTypeDef( (unwrap variant.nameNode) ctx wr)
      wr.out(((" " + variant.compiledName) + "(") false)
      this.writeArgsDef(variant ctx wr)
      wr.out(");" true)
    }
    for cl.defined_variants fnVar:string i {
      if (i == 0) {
        wr.out("/* instance methods */ " true)
      }
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {
        if(cl.is_inherited) {
          wr.out("virtual " false)
        }        
        this.writeTypeDef((unwrap variant.nameNode) ctx wr)
        wr.out(((" " + variant.compiledName) + "(") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(");" true)
      }
    }
    wr.indent(-1)
    wr.indent(-1)
    wr.out("};" true)
    ; wr.out("#endif " true)
  }

  fn CreateUnions (parser:RangerFlowParser ctx:RangerAppWriterContext wr:CodeWriter) {
    def root (ctx.getRoot())
    root.definedClasses.forEach({
      ; index == name
      ; item == class description
      if(item.is_union) {
        this.compiler.installFile( "variant.hpp" ctx wr)
        ; TODO: implement system class unions too...
        wr.out("typedef mpark::variant<" false)
        wr.indent(1)
          def cnt 0
          item.is_union_of.forEach({
            if (ctx.isDefinedClass(item)) {
              def cl (ctx.findClass(item))
              if( false == (cl.isNormalClass() ) ) {
                return
              }
              if( cnt > 0 ) {
                wr.out(", " false)
              }
              wr.out( (this.getObjectTypeString( item ctx ) ) false ) 
              cnt = cnt + 1
            } {
              if( cnt > 0 ) {
                wr.out(", " false)
              }
              wr.out( (this.getObjectTypeString( item ctx ) ) false ) 
              cnt = cnt + 1
            }
          })
        wr.indent(-1)
        wr.out(">  r_union_" + index + ";" , true)
        wr.addImport("\"variant.hpp\"")
      }
    })
  }


  fn writeClass:void  (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {

    def cl:RangerAppClassDesc node.clDesc
    def wr:CodeWriter orig_wr
    if (null? cl) {
      return
    }

    this.import_lib("<memory>" ctx wr)

    for cl.capturedLocals dd@(lives):RangerAppParamDesc i {
      if(dd.is_class_variable == false ) {
        if ( dd.set_cnt > 0 ) {
          if( ctx.hasCompilerFlag("dont-allow-mutate")) {
            ctx.addError( (unwrap dd.nameNode) "Mutating captured variable is not allowed")
            return
          } 
        }
      }
    }        

    if( header_created == false) {
      wr.createTag("c++Imports")
      wr.out("" true)
      wr.out("// define classes here to avoid compiler errors" true)
      wr.createTag("c++ClassDefs")
      wr.out("" true)
      wr.createTag("c++unions")
      wr.createTag("utilities")
      wr.out("" true)
      wr.out("// header definitions" true)      
      wr.createTag("c++Header")
      wr.out("" true)

      wr.out("int __g_argc;" true)
      wr.out("char **__g_argv;" true)

      this.CreateUnions( (unwrap this.compiler.parser) ctx (wr.getTag("c++unions")))
      
      header_created = true
    }
    def classWriter:CodeWriter (orig_wr.getTag("c++ClassDefs"))
    def headerWriter:CodeWriter (orig_wr.getTag("c++Header"))
    def projectName:string "project"

    ; for cl.capturedLocals dd@(lives):RangerAppParamDesc i {
    ;  if(dd.is_class_variable == false ) {
    ;    wr.out("// local captured " + dd.name , true)
    ;    ;print "C++ captured"
    ;    ;print (dd.node.getLineAsString())
    ;    dd.node.disabled_node = true
    ;    cl.addVariable(dd)
    ;    def csubCtx:RangerAppWriterContext cl.ctx
    ;    csubCtx.defineVariable(dd.name dd)
    ;    dd.is_class_variable = true
    ;  }
    ; }      

    classWriter.out("class " + cl.name + ";" , true)

    this.writeClassHeader(node ctx headerWriter)

    wr.out((((cl.name + "::") + cl.name) + "(") false)
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc cl.constructor_fn
      this.writeArgsDef( (unwrap constr) ctx wr)
    }
    wr.out(" ) " false )
    
    if ( ( array_length cl.extends_classes ) > 0 ) { 
      
      ; wr.out(" public std::enable_shared_from_this<" + cl.name +  "> " , false)
      for cl.extends_classes pName:string i {
        def pcc (ctx.findClass(pName))
        if pcc.has_constructor {
          wr.out(" : " + pcc.name +"(" , false)
          def constr:RangerAppFunctionDesc cl.constructor_fn
          for constr.params arg:RangerAppParamDesc i {
            if (i > 0) {
              wr.out("," false)
            }
            wr.out(" " false)
            wr.out(((" " + arg.name) + " ") false)
          }
          wr.out(")" false)
        }        
      }
    }

    wr.out("{" true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
      def nn:CodeNode (unwrap pvar.node)
;      if(pvar.is_captured) {
;        continue
;      }
      if ((array_length nn.children) > 2) {
        def valueNode:CodeNode (itemAt nn.children 2)
        wr.out((("this->" + pvar.compiledName) + " = ") false)
        this.WalkNode(valueNode ctx wr)
        wr.out(";" true)
      }
      ; if (nn.hasFlag("optional")) {
    }
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc (unwrap cl.constructor_fn)
      wr.newline()
      def subCtx:RangerAppWriterContext (unwrap constr.fnCtx)
      subCtx.is_function = true
      this.WalkNode( (unwrap constr.fnBody) subCtx wr)
      wr.newline()
    }
    wr.indent(-1)
    wr.out("}" true)
    for cl.static_methods variant:RangerAppFunctionDesc i {

      if (variant.nameNode.hasFlag("main")) {
        continue _
      }
      ; wr.out("static " false)
      this.writeTypeDef( (unwrap variant.nameNode ) ctx wr)
      wr.out(" " false)
      wr.out(((" " + cl.name) + "::") false)
      wr.out((variant.compiledName + "(") false)
      this.writeArgsDef(variant ctx wr)
      wr.out(") {" true)
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext (unwrap variant.fnCtx)
      subCtx.is_function = true
      this.WalkNode( (unwrap variant.fnBody ) subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    for cl.defined_variants fnVar:string i {
      def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
      for mVs.variants variant:RangerAppFunctionDesc i {
        this.writeTypeDef((unwrap variant.nameNode )ctx wr)
        ;this.writePtr((unwrap variant.nameNode ) ctx wr)
        wr.out(" " false)
        wr.out(((" " + cl.name) + "::") false)
        wr.out((variant.compiledName + "(") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") {" true)
        wr.indent(1)
        wr.newline()
        def subCtx:RangerAppWriterContext (unwrap variant.fnCtx )
        subCtx.is_function = true
        this.WalkNode( (unwrap variant.fnBody ) subCtx wr)
        wr.newline()
        wr.indent(-1)
        wr.out("}" true)
      }
    }
    ; wr.addImport(((("\"" + projectName) + ".hpp") + "\""))

    ;def import_list:[string] (wr.getImports())
    ;for import_list codeStr:string i {
    ;  importFork.out(("#include " + codeStr + "") true)
    ;}

    for cl.static_methods variant:RangerAppFunctionDesc i {
      if ( (variant.nameNode.hasFlag("main")) && (variant.nameNode.code.filename == (ctx.getRootFile()))) {
        wr.out("int main(int argc, char* argv[]) {" true)
        wr.indent(1)

        wr.out("__g_argc = argc;" true)
        wr.out("__g_argv = argv;" true)
        
        def subCtx:RangerAppWriterContext (unwrap variant.fnCtx)
        subCtx.in_main = true
        subCtx.is_function = true
        this.WalkNode( (unwrap variant.fnBody ) subCtx wr)
        wr.newline()
        wr.out("return 0;" true)
        wr.indent(-1)
        wr.out("}" true)
      }
    }

  }
}

