
; ---- App1.csproj file has this kind of meta information, which could be updated...
;  <ItemGroup>
;    <Compile Include="App.xaml.cs">
;      <DependentUpon>App.xaml</DependentUpon>
;    </Compile>
;    <Compile Include="MainPage.xaml.cs">
;      <DependentUpon>MainPage.xaml</DependentUpon>
;    </Compile>
;    <Compile Include="Properties\AssemblyInfo.cs" />
;    <Compile Include="V2.cs" />
;  </ItemGroup>


class RangerCSharpClassWriter {
  Extends (RangerGenericClassWriter)
  def compiler:LiveCompiler
  fn adjustType:string (tn:string) {
    if (tn == "this") {
      return "this"
    }
    return tn
  }
  fn getObjectTypeString:string (type_string:string ctx:RangerAppWriterContext) {

    if(ctx.isDefinedClass(type_string)) {
      def cc (ctx.findClass(type_string))
      if(cc.is_union) {
        return "dynamic"
      }

      if(cc.is_system) {
        def sysName (get cc.systemNames "csharp")
        if(!null? sysName) {
          return (unwrap sysName)
        } {
          def node (new CodeNode( (new SourceCode("")) 0 0 ))
          ctx.addError(node ( "No system class " + type_string +  "defined for C# "))
        }
      }      
    }
    
    switch type_string {
      case "int" {
        return "int"
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
        return "bool"
      }
      case "double" {
        return "double"
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
      case "chararray" {
        return "byte[]"
      }
      case "char" {
        return "byte"
      }
      case "boolean" {
        return "bool"
      }
      case "double" {
        return "double"
      }
    }
    return type_string
  }

  fn writeLambdaType (expression_value:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    def rv:CodeNode (itemAt expression_value.children 0)
    def sec:CodeNode (itemAt expression_value.children 1)
    def fc:CodeNode (sec.getFirst())
;        this.import_lib("<functional>" ctx wr)
    def is_void false
    if(rv.type_name == "void" || rv.eval_type_name == "void") {
      is_void = true
    }
    if is_void {
      wr.out("Action" false)
      if( (array_length sec.children) > 0 ) {
        wr.out("<" false)
      }
    } {
      wr.out("Func<" false)
    }
    for sec.children arg:CodeNode i {
      if( i > 0 ) {
        wr.out(", " false)
      }
      this.writeTypeDef( arg ctx wr)
    }
    if( is_void == false ) {
      if( (array_length sec.children) > 0 ) {
        wr.out(", " false)
      }
      this.writeTypeDef( rv ctx wr)
    }
    if is_void {
      if( (array_length sec.children) > 0 ) {
        wr.out(">" false)
      }
    } {
      wr.out(">" false)
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

    switch v_type {

      case RangerNodeType.ExpressionType {
        this.writeLambdaType( (unwrap node.expression_value) ctx wr)
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
        wr.out("bool" false)
      }
      case RangerNodeType.Hash {
        wr.out((((("Dictionary<" + (this.getObjectTypeString(k_name ctx))) + ",") + (this.getObjectTypeString(a_name ctx))) + ">") false)
        wr.addImport("System.Collections")
        wr.addImport("System.Collections.Generic")
      }
      case RangerNodeType.Array {
        wr.out((("List<" + (this.getObjectTypeString(a_name ctx))) + ">") false)
        wr.addImport("System.Collections")
        wr.addImport("System.Collections.Generic")
      }
      default {
        if (node.type_name == "void") {
          wr.out("void" false)
          return
        }

        if(ctx.isDefinedClass(t_name)) {
          def cc (ctx.findClass(t_name))
          if(cc.is_union) {
            wr.out("dynamic" false)
            ;if (node.hasFlag("optional")) {
            ;  wr.out("?" false)
            ;}            
            return
          }
          if(cc.is_system) {
            def sysName (get cc.systemNames "csharp")
            if(!null? sysName) {
              wr.out( (unwrap sysName) false)
            } {
              ctx.addError(node ( "No system class " + t_name +  "defined for C# "))
            }
            return
          }      
        }        
        wr.out((this.getTypeString(node.type_name)) false)
      }
    }

    ; if (node.hasFlag("optional")) {
    ;   wr.out("?" false)
    ; }
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
          def part:string (itemAt node.ns 0)
          if(part == "this") {
            if( ctx.inLambda() ) {
              wr.out("this" false)
              ; def currC (ctx.getCurrentClass())
              ; wr.out( (currC.name + ".this") false)
            } {
              wr.out("this" false)
            }            
            continue
          } 
        }

        if (i == 0) {
          if (p.nameNode.hasFlag("optional")) {
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
        wr.out("" false)
      } {
        ; const could be set here, if detected correctly
        wr.out("" false)
      }
      this.writeTypeDef(( unwrap p.nameNode ) ctx wr)
      wr.out(" " false)
      wr.out(p.compiledName false)
      if ((array_length node.children) > 2) {
        wr.out(" = " false)
        ctx.setInExpr()
        def value:CodeNode (node.getThird())
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      } {
        if (nn.value_type == RangerNodeType.Array) {
          wr.out(" = new " false)
          this.writeTypeDef(( unwrap p.nameNode ) ctx wr)
          wr.out("()" false)
        }
        if (nn.value_type == RangerNodeType.Hash) {
          wr.out(" = new " false)
          this.writeTypeDef(( unwrap p.nameNode ) ctx wr)
          wr.out("()" false)
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

  fn CreateLambda:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    ;         this.writeLambdaType( (unwrap node.expression_value) ctx wr)

    def lambdaCtx (unwrap node.lambda_ctx)
    def fName:CodeNode (itemAt node.children 1)
    def body:CodeNode (itemAt node.children 2)
    def args:CodeNode (itemAt node.children 1)
    
    wr.out('(' false)
    wr.out('(' false)
    this.writeLambdaType( node ctx wr)
    wr.out(')' false)

    wr.out('(' false)
;    this.WalkNode(fName ctx wr)
    wr.out("(" false)
    for args.children arg:CodeNode i {
      if (i > 0) {
        wr.out(', ' false)
      }
      if(arg.flow_done == false) {
        this.compiler.parser.WalkNode( arg lambdaCtx wr)  
      }
      this.WalkNode(arg lambdaCtx wr)
    }
    wr.out(')' false)
    wr.out(' => { ' true)
    wr.indent(1)
    lambdaCtx.restartExpressionLevel()
    for body.children item:CodeNode i {
      this.WalkNode(item lambdaCtx wr)
    }
    wr.newline()
    wr.indent(-1)
    wr.out("}" false)
    wr.out('))' false)

    if ((ctx.expressionLevel()) == 0) {
      wr.out(';' true)
    }

  }


  fn writeArgsDef:void (fnDesc:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter) {
    for fnDesc.params arg:RangerAppParamDesc i {
      if (i > 0) {
        wr.out("," false)
      }
      wr.out(" " false)
      this.writeTypeDef( (unwrap arg.nameNode ) ctx wr)
      wr.out(((" " + arg.compiledName) + " ") false)
    }
  }

  fn writeArrayLiteral( node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    wr.out("new List<" false)
    wr.out( (this.getObjectTypeString( node.eval_array_type ctx )) false )
    wr.out("> {" false)
    node.children.forEach({
      if( index > 0 ) {
        wr.out(", " false)
      }
      this.WalkNode( item ctx wr )
    })
    wr.out("}" false)
  }

  fn writeClass:void (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def cl:RangerAppClassDesc node.clDesc
    if (null? cl) {
      return
    }

    def wr orig_wr

    ; def wr:CodeWriter (orig_wr.getFileWriter("." (cl.name + ".cs")))
    ; def importFork:CodeWriter (wr.fork())
    
    this.import_lib("System" ctx wr)

    wr.createTag("utilities")
    wr.out(("class " + cl.name + " ") false )
    if ( ( array_length cl.extends_classes ) > 0 ) { 
      wr.out(" : " false)
      for cl.extends_classes pName:string i {
        wr.out(pName false)
;        parentClass = (ctx.findClass(pName))
      }
    }    
      
    wr.out(  " {" true)
    wr.indent(1)
    for cl.variables pvar:RangerAppParamDesc i {
      wr.out("public " false)
      this.writeVarDef( (unwrap pvar.node) ctx wr)
    }
    if cl.has_constructor {
      def constr:RangerAppFunctionDesc (unwrap cl.constructor_fn)
      wr.out((cl.name + "(") false)
      this.writeArgsDef(constr ctx wr)
      wr.out(" ) {" true)
      wr.indent(1)
      wr.newline()
      def subCtx:RangerAppWriterContext (unwrap constr.fnCtx )
      subCtx.is_function = true
      this.WalkNode( (unwrap constr.fnBody ) subCtx wr)
      wr.newline()
      wr.indent(-1)
      wr.out("}" true)
    }
    for cl.static_methods variant:RangerAppFunctionDesc i {
      if ( (variant.nameNode.hasFlag("main")) && (variant.nameNode.code.filename != (ctx.getRootFile()))) {
        continue
      }
      if (variant.nameNode.hasFlag("main")) {
        wr.out("static void Main( string [] args ) {" true)
      } {
        wr.out("public static " false)
        this.writeTypeDef( (unwrap variant.nameNode ) ctx wr)
        wr.out(" " false)
        wr.out((variant.name + "(") false)
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
        wr.out("public " false)
        this.writeTypeDef( (unwrap variant.nameNode) ctx wr)
        wr.out(" " false)
        wr.out((variant.name + "(") false)
        this.writeArgsDef(variant ctx wr)
        wr.out(") {" true)
        wr.indent(1)
        def subCtx:RangerAppWriterContext (unwrap variant.fnCtx)
        subCtx.is_function = true
        this.WalkNode((unwrap variant.fnBody) subCtx wr)
        wr.indent(-1)
        wr.out("}" true)
      }
    }
    wr.indent(-1)
    wr.out("}" true)
  }
}

