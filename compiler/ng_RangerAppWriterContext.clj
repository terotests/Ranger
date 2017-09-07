
class RangerNodeValue {
  def double_value:double
  def string_value:string
  def int_value:int
  def boolean_value:boolean
  def expression_value:CodeNode
}
class RangerBackReference {
  def from_class:string
  def var_name:string
  def ref_type:string
}
class RangerAppEnum {
  def name:string ""
  def cnt:int 0
  def values:[string:int]
  def node:CodeNode
  fn add:void (n:string) {
    set values n cnt
    cnt = (cnt + 1)
  }
}
class OpFindResult {
  def did_find:boolean false
  def node:CodeNode
}
class RangerAppWriterContext {
  def langOperators:CodeNode
  def stdCommands:CodeNode 
  def operators:RangerActiveOperators
  def reservedWords:CodeNode 
  def intRootCounter:int 1
  def targetLangName:string ""
  def parent:RangerAppWriterContext
  def defined_imports:[string]
  def already_imported:[string:boolean]
  def fileSystem:CodeFileSystem
  def is_function:boolean false
  def class_level_context:boolean false
  def function_level_context:boolean false
  def in_main:boolean false
  def is_block:boolean false
  def is_lambda:boolean false
  def is_capturing:boolean false
  def captured_variables:[string]
  def has_block_exited:boolean false
  def in_expression:boolean false
  def expr_stack:[boolean]
  def expr_restart:boolean false
  def in_method:boolean false
  def method_stack:[boolean]
  def typeNames:[string]
  def typeClasses:[string:RangerTypeClass]
  def currentClassName:string
  def in_class:boolean false
  def in_static_method:boolean false
  def currentClass@(weak):RangerAppClassDesc
  def currentMethod:RangerAppFunctionDesc
  def thisName:string "this"
  def definedEnums:[string:RangerAppEnum]
  def definedInterfaces:[string:RangerAppClassDesc]
  def definedInterfaceList:[string]
  def definedClasses:[string:RangerAppClassDesc]
  def definedClassList:[string]
  def templateClassNodes@(weak):[string:CodeNode]
  def templateClassList:[string]
  def classSignatures:[string:string]
  def classToSignature:[string:string]
  def templateClasses:[string:RangerAppClassDesc]
  def classStaticWriters@(weak):[string:CodeWriter]
  def localVariables:[string:RangerAppParamDesc]
  def localVarNames:[string]
  def compilerFlags:[string:boolean]
  def compilerSettings:[string:string]
  def parserErrors:[RangerCompilerMessage]
  def compilerErrors:[RangerCompilerMessage]
  def compilerMessages:[RangerCompilerMessage]
  def compilerLog:[string:RangerCompilerMessage]
  def todoList:[RangerAppTodo]
  def definedMacro:[string:boolean]
  def defCounts:[string:int]
  def refTransform:[string:string]
  def staticClassBodies:[CodeNode]

  def opNs:[string]

  def langFilePath:string ""
  def libraryPaths:[string]
  def outputPath ""

  fn addOpNs ( n:string ) {
    push opNs n
  }

  fn removeOpNs ( n:string ) {
    def idx (indexOf opNs n )
    if( idx >= 0 ) {
      remove_index opNs idx
    }
  }  

  fn inLambda:boolean () {
    if( is_lambda ) {
      return true
    }
    if( !null? parent ) {
      return (parent.inLambda())
    }
    return false
  }

  fn writeContextVars( wr:CodeWriter ) {
    localVariables.forEach({
      ; item, index
      wr.out( ("def " + index + ":" ) false)
      if(!null? item.nameNode) {
        def r (new RangerRangerClassWriter)
        r.writeTypeDef( (unwrap item.nameNode) this wr)
      }
      wr.out( ( "(" + item.compiledName + ")" ) false )
      wr.out("" true)
    })
  }
  
  fn writeContextInfo( wr:CodeWriter) {
    def cList@(weak):[RangerAppWriterContext]
    def c@(lives) (this)
  
    cList.push(c)
    while( (!null? c.parent) ) {
      c = (unwrap c.parent)
      cList.push(c)
    }

    def idx (array_length cList)
    def cnt idx
    while( idx > 0) {
      idx = idx - 1
      wr.out("{" true)
      wr.indent(1)
      def cc ( itemAt cList idx)
      cc.writeContextVars( wr )
    }
    while (cnt > 0 ) {
      wr.indent(-1)
      wr.out("}" true)     
      cnt = cnt - 1 
    }
  }

  fn getContextInfo:string () {
    def wr (new CodeWriter)
    this.writeContextInfo( wr )
    return (wr.getCode())
  }

  fn isCapturing:boolean () {
    if(is_capturing) {
      return true
    }
    if parent {
      return (parent.isCapturing())
    }
    return false
  }
  fn forkWithOps:RangerAppWriterContext (opNode:CodeNode) {
    def ops (this.getOperatorDef())
    def new_ops (ops.fork(opNode))
    def new_ctx (this.fork())
    new_ctx.operators = new_ops
    return new_ctx
  }

  fn getOperatorDef:RangerActiveOperators () {
    if(!null? operators) {
      return (unwrap operators)
    }
    if(!null? parent) {
      return (parent.getOperatorDef())
    }
    def nothingFound:RangerActiveOperators (new RangerActiveOperators)
    return nothingFound
  }  

  fn getOperators:[CodeNode] (name:string) {
    def root (this.getRoot())
    def cc this
    def opNamespace:[string]
    if( (array_length opNs) > 0) {
      for opNs nsName:string i {
        push opNamespace nsName
      }
    }
    while (!null? cc.parent) {
      cc = (unwrap cc.parent)
      if( (array_length cc.opNs) > 0) {
        for cc.opNs nsName:string i {
          push opNamespace nsName
        }
      }  
    }
    if(!null? root.operators) {
      def op (unwrap root.operators)
      def listOfOps:[CodeNode]
      def handled:[string:boolean]
      for opNamespace ss:string i {
        if( has handled ss ) {
          continue
        }
        set handled ss true
        def nsOps (op.getOperators(ss + "." + name))
        for nsOps ns_op:CodeNode i {
          push listOfOps ns_op
        }
      }
      def plainOps (op.getOperators(name))
      for plainOps ppn@(lives):CodeNode i {
        push listOfOps ppn
      }
      return listOfOps
    }
    def nothingFound:[CodeNode]
    return nothingFound
  }
  ; 1. isVarDefined
  ; 2. isLocalToCapture, if false
  ; 3. addCapturedVariable
  fn isLocalToCapture:boolean (name:string) {
    if( (has localVariables name) ) {
      return true
    }
    ; not local, because this context is capturing
    if(is_capturing) {
      return false
    }
    if(parent) {
      return (parent.isLocalToCapture(name))
    }
    return false
  }
  fn addCapturedVariable:void (name:string) {

    if(is_capturing) {
      if ( (indexOf captured_variables name) < 0 ) {
        push captured_variables name
      }      
      return
    }
    if(parent) {
      parent.addCapturedVariable( name )
    }
  }
  fn getCapturedVariables@(weak):[string] () {
    if(is_capturing) {
      return captured_variables
    }
    if(parent) {
      def r@(weak):[string] ( parent.getCapturedVariables() )
      return r
    }
    def res:[string]
    return res
  }  
  fn transformOpNameWord:string (input_word:string) {
     def len (strlen input_word)
    def i 0
    def res ""
    while (i < len) {
      def cc (charAt input_word i)
      if ( ((cc >= (ccode "a")) && (cc <= (ccode "z")) )  || ( ((cc >= (ccode "A")) && (cc <= (ccode "Y")) ) )) {
        res = res + (strfromcode cc)
      } {
        res = res + "c"+ (cc)
      }
      i = i + 1
    }
    return res
  }
  fn transformWord:string (input_word:string) {
    switch input_word {
        case "map" {
          return "_map"
        }
        default {

        }
    }
    def root (this.getRoot())
    root.initReservedWords()
    if(has refTransform input_word) {
      return (unwrap (get refTransform input_word))
    }
    return input_word
  }
  fn initReservedWords:boolean () {
    ; reserved_word_transformations
    if(!null? reservedWords) {
      return true
    }
    def main:CodeNode langOperators
    def lang:CodeNode
    for main.children m:CodeNode i {
      def fc:CodeNode (m.getFirst())
      if (fc.vref == "language") {
        lang = m
      }
    }
    def cmds:CodeNode
    def langNodes:CodeNode (itemAt lang.children 1)
    for langNodes.children lch:CodeNode i {
      def fc:CodeNode (lch.getFirst())
      if (fc.vref == "reserved_words") {
        def n:CodeNode (lch.getSecond())
        reservedWords = (lch.getSecond())
        for reservedWords.children ch:CodeNode i {
          def word (ch.getFirst())
          def transform (ch.getSecond())
          set refTransform word.vref transform.vref
        }
      }
    }
    return true
  }
  fn initStdCommands:boolean () {
    if (!null? stdCommands) {
      return true
    }
    if (null? langOperators) {
      return true
    }
    def main:CodeNode langOperators
    def lang:CodeNode
    for main.children m:CodeNode i {
      def fc:CodeNode (m.getFirst())
      if (fc.vref == "language") {
        lang = m
      }
    }
    def cmds:CodeNode
    def langNodes:CodeNode (itemAt lang.children 1)
    for langNodes.children lch:CodeNode i {
      def fc:CodeNode (lch.getFirst())
      if (fc.vref == "commands") {

        def n:CodeNode (lch.getSecond())
        stdCommands = (lch.getSecond())

      }
    }
    return true
  }
  fn transformTypeName:string (typeName:string) {
    if (this.isPrimitiveType(typeName)) {
      return typeName
    }
    if (this.isEnumDefined(typeName)) {
      return typeName
    }
    if (this.isDefinedClass(typeName)) {
      def cl:RangerAppClassDesc (this.findClass(typeName))
      if cl.is_system {
        return (unwrap (get cl.systemNames (this.getTargetLang())))
      }
    }
    return typeName
  }
  fn isPrimitiveType:boolean (typeName:string) {
    if ((((((typeName == "double") || (typeName == "string")) || (typeName == "int")) || (typeName == "char")) || (typeName == "charbuffer")) || (typeName == "boolean")) {
      return true
    }
    return false
  }
  fn isDefinedType:boolean (typeName:string) {
    if ((((((typeName == "double") || (typeName == "string")) || (typeName == "int")) || (typeName == "char")) || (typeName == "charbuffer")) || (typeName == "boolean")) {
      return true
    }
    if (this.isEnumDefined(typeName)) {
      return true
    }
    if (this.isDefinedClass(typeName)) {
      return true
    }
    return false
  }
  fn hadValidType:boolean (node@(weak):CodeNode) {
    if ((node.isPrimitiveType()) || (node.isPrimitive())) {
      return true
    }
    if(node.value_type == RangerNodeType.Array) {
      if (this.isDefinedType(node.array_type)) {
        return true
      } {
        this.addError(node ("Unknown type for array values: " + node.array_type))        
        return false        
      }
    }
    if(node.value_type == RangerNodeType.Hash) {
      if ( (this.isDefinedType(node.array_type)) && (this.isPrimitiveType(node.key_type)) ) {
        return true
      } {
        if( (this.isDefinedType(node.array_type)) == false) {
          this.addError(node ("Unknown type for map values: " + node.array_type))          
        }
        if( (this.isDefinedType(node.array_type)) == false) {
          this.addError(node ("Unknown type for map keys: " + node.key_type))          
        }
        return false
      }
    }
    if (this.isEnumDefined(node.type_name)) {
      return true
    }
    if (this.isDefinedType(node.type_name)) {
      return true
    } {
      if (node.value_type == RangerNodeType.ExpressionType) {
        ; def sec:CodeNode (itemAt node.expression_value.children 1)
        ; def fc:CodeNode (sec.getFirst())
      } {
        this.addError(node ("Unknown type: " + node.type_name + " type ID : " + node.value_type))    
      }
    }
;    this.addError(node ((((("Invalid or missing type definition: " + node.type_name) + " ") + node.key_type) + " ") + node.array_type))
    return false
  }
  fn getTargetLang:string () {
    if( (strlen targetLangName) > 0) {
       return targetLangName
    }
    if(parent) {
      return (parent.getTargetLang())
    }
    return "ranger"
  }
  fn findOperator:CodeNode (node:CodeNode) {
    def root:RangerAppWriterContext (this.getRoot())
    root.initStdCommands()
    if(!null? node.operator_node) {
      return (unwrap node.operator_node)
    }
    return (itemAt root.stdCommands.children node.op_index)
  }
  fn getStdCommands@(weak):CodeNode () {
    def root:RangerAppWriterContext (this.getRoot())
    root.initStdCommands()
    return (unwrap root.stdCommands)
  }
  fn findClassWithSign:RangerAppClassDesc (node:CodeNode) {
    def root:RangerAppWriterContext (this.getRoot())
    def tplArgs:CodeNode node.vref_annotation
    def sign:string (node.vref + (tplArgs.getCode()))
    def theName:string (get root.classSignatures sign)
    return (this.findClass((unwrap theName)))
  }
  fn createSignature:string (origClass:string classSig:string) {
    if (has classSignatures classSig) {
      return (unwrap (get classSignatures classSig))
    }
    def ii:int 1
    def sigName:string ((origClass + "V") + ii)
    while (has classToSignature sigName) {
      ii = (ii + 1)
      sigName = ((origClass + "V") + ii)
    }
    set classToSignature sigName classSig
    set classSignatures classSig sigName
    return sigName
  }

  fn createStaticMethod:RangerAppFunctionDesc (withName:string currC:RangerAppClassDesc nameNode:CodeNode argsNode:CodeNode fnBody:CodeNode parser:RangerFlowParser ) {
    def s:string withName
    def m@(lives):RangerAppFunctionDesc (new RangerAppFunctionDesc ())

    ;print "createStaticMethod -> name " + withName + "namenode type == " + nameNode.type_name
    ;print "body of the static method ==> " + (fnBody.getCode())
    ;print "arguments of static => " + (argsNode.getCode())

    m.name = s
    m.compiledName = (this.transformWord(s))
    m.node = nameNode
    m.nameNode = nameNode
    def rCtx (this.getRoot())
    m.fnCtx = (rCtx.fork())
    m.is_static = true
    m.nameNode.ifNoTypeSetToVoid()
    def args:CodeNode argsNode
    m.fnBody = fnBody
    def wr (new CodeWriter)
    ; --> 
    parser.CheckTypeAnnotationOf( (unwrap m.nameNode) rCtx wr )

    for args.children arg@(lives):CodeNode ii {

      if(arg.hasFlag("noeval")) {
        continue
      }

      def p@(lives temp):RangerAppParamDesc (new RangerAppParamDesc ())
      p.name = arg.vref
      if(p.name == "self") {
        p.compiledName = "__self"
      }
      p.value_type = arg.value_type
      p.node = arg
      p.init_cnt = 1
      p.nameNode = arg

      parser.CheckTypeAnnotationOf( arg rCtx wr )
      
      p.refType = RangerNodeRefType.Weak
      p.varType = RangerContextVarType.FunctionParameter
      push m.params p
      arg.hasParamDesc = true
      arg.paramDesc = p
      arg.eval_type = arg.value_type
      arg.eval_type_name = arg.type_name
      if (arg.hasFlag("strong")) {
        p.changeStrength(1 1 (unwrap p.nameNode))
      } {
        arg.setFlag("lives")
        p.changeStrength(0 1 (unwrap p.nameNode))
      }        
      ;m.fnCtx.defineVariable( arg.vref p)   
    }
    currC.addStaticMethod(m)
    return m
  }

  fn createOpStaticClass@(weak):RangerAppClassDesc (name:string) {
    def nameWillBe ("operatorsOf" + name)
    def str ""
    def i 0
    def len (strlen nameWillBe)
    while( i < len ) {
      def c (charAt nameWillBe i)
      if(c == (charcode ".")) {
        str = str + "_"  
      } {
        str = str + (substring nameWillBe i (i + 1))
      }
      i = i + 1
    }
    if(this.isDefinedClass(str)) {
      return (this.findClass(str))
    }
;     return 

    def tpl_code ("class " + str + " {
}")

    def code:SourceCode (new SourceCode ( tpl_code ))
    code.filename = str + ".ranger"
    def parser:RangerLispParser (new RangerLispParser (code))
    parser.parse()

    ; this.CheckTypeAnnotationOf( (unwrap m.nameNode) ctx wr )

    def classRoot@(lives) (itemAt parser.rootNode.children 0)
    def classNameNode@(lives) (classRoot.getSecond())
    classNameNode.vref = str
    def new_class@(lives):RangerAppClassDesc (new RangerAppClassDesc ())
    new_class.name = str
    new_class.is_operator_class = true
    new_class.nameNode = classNameNode
    new_class.classNode = classRoot

    def subCtx@(lives):RangerAppWriterContext (this.fork())
    subCtx.setCurrentClass(new_class)
    new_class.ctx = subCtx

    def root (this.getRoot())
    root.addClass(str new_class)
    classNameNode.clDesc = new_class
    push staticClassBodies classRoot
    return new_class
  }

  fn createTraitInstanceClass@(optional weak):RangerAppClassDesc ( traitName:string instanceName:string initParams:CodeNode flowParser:RangerFlowParser ) {
    def res@(optional weak):RangerAppClassDesc
    def ctx (this.fork())
    def wr (new CodeWriter)
    if(this.isDefinedClass( instanceName) ) {
      return res
    }
    if( (this.isDefinedClass( traitName )) == false) {
      this.addError( initParams ( "Could not find the trait " + traitName ) )
      return res
    }

    ; 1. create the base class
    def tpl_code ("class " + instanceName + " {
}")

    def code:SourceCode (new SourceCode ( tpl_code ))
    code.filename = instanceName + ".ranger"
    def parser:RangerLispParser (new RangerLispParser (code))
    parser.parse()

    def classRoot@(lives) (itemAt parser.rootNode.children 0)
    def classNameNode@(lives) (classRoot.getSecond())
    classNameNode.vref = instanceName
    def new_class@(lives):RangerAppClassDesc (new RangerAppClassDesc ())
    new_class.name = instanceName
    new_class.nameNode = classNameNode
    new_class.node = classRoot
    new_class.classNode = classRoot   
    new_class.is_generic_instance = true
    push new_class.consumes_traits traitName
    def root (this.getRoot())

    new_class.ctx = (root.fork())
    root.addClass(instanceName new_class)
    classNameNode.clDesc = new_class    

    def cl:RangerAppClassDesc new_class
    def t:RangerAppClassDesc (this.findClass(traitName))

    def traitClassDef@(lives):CodeNode (unwrap t.node)
    def name:string t.name

    ; print "creating a new trait " + name + " to class " + cl.name
    def t:RangerAppClassDesc (ctx.findClass(name))
    if( (array_length t.extends_classes) > 0 ) {
      ctx.addError( traitClassDef ("Can not join trait " + name + " because it is inherited. Currently on base classes can be used as traits." ))
      return res
    }
    if(t.has_constructor) {
      ctx.addError( traitClassDef ("Can not join trait " + name + " because it has a constructor function" ))
    } {
      def origBody:CodeNode (itemAt cl.node.children 2)
      def match:RangerArgMatch (new RangerArgMatch ())

      def params (t.node.getExpressionProperty("params"))
      def traitParams (new RangerTraitParams)

      if( (!null? params) ) {
        for params.children typeName:CodeNode i {
          def set_value ""
          if( ( array_length initParams.children) > i ) {
            def pArg (itemAt initParams.children i)
            match.add(typeName.vref pArg.vref ctx)
            ;print "- match " + typeName.vref + " -> " + pArg.vref
            set_value = pArg.vref
          } {
            match.add(typeName.vref instanceName ctx)
            ;print "- match " + typeName.vref + " -> " + instanceName
            set_value = instanceName
          }
          push traitParams.param_names typeName.vref
          set traitParams.values typeName.vref set_value
        }
        set cl.trait_params name traitParams
      } {
        match.add("T" cl.name ctx)
      }

      ctx.setCurrentClass( cl )          

      def traitClass t
      for traitClass.variables pvar:RangerAppParamDesc i {
        def ccopy:CodeNode (pvar.node.rebuildWithType(match true))      
        flowParser.WalkCollectMethods( ccopy ctx wr )
        push origBody.children ccopy
      }
      for traitClass.defined_variants fnVar:string i {
        def mVs:RangerAppMethodVariants (get traitClass.method_variants fnVar)
        for mVs.variants variant:RangerAppFunctionDesc i {
          def ccopy:CodeNode (variant.node.rebuildWithType(match true))      
          flowParser.WalkCollectMethods( ccopy ctx wr )
          push origBody.children ccopy
        }            
      }
      res = new_class
      push flowParser.walkAlso new_class.node
    }      
    return res
  }

  fn createOperator:void (fromNode@(strong):CodeNode) {
    def root:RangerAppWriterContext (this.getRoot())
    if (root.initStdCommands()) {
      push root.stdCommands.children fromNode
      def fc:CodeNode (itemAt fromNode.children 0)
    }
  }
  fn findClassMethod@(weak optional):RangerAppFunctionDesc (cname:string fname:string) {
    def res:RangerAppFunctionDesc
    if(this.isDefinedClass(cname)) {
      def cl (this.findClass(cname))
      for cl.defined_variants fnVar:string i {
          if(fnVar == fname) {
            def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
            for mVs.variants variant:RangerAppFunctionDesc i {
              res = variant
              return res
            }
          }
      }
    }
    return res
  }

  fn getFileWriter:CodeWriter (path:string fileName:string) {
    def root:RangerAppWriterContext (this.getRoot())
    def fs:CodeFileSystem root.fileSystem
    def file:CodeFile (fs.getFile(path fileName))
    def wr:CodeWriter 
    wr = (file.getWriter())
    return (unwrap wr)
  }
  fn addTodo:void (node@(lives):CodeNode descr:string) {
    def e:RangerAppTodo (new RangerAppTodo ())
    e.description = descr
    e.todonode = node
    def root:RangerAppWriterContext (this.getRoot())
    push root.todoList e
  }
  fn setThisName:void (the_name:string) {
    def root:RangerAppWriterContext (this.getRoot())
    root.thisName = the_name
  }
  fn getThisName:string () {
    def root:RangerAppWriterContext (this.getRoot())
    return root.thisName
  }
  fn printLogs:void (logName:string) {

  }
  fn log:void (node:CodeNode logName:string descr:string) {

  }
  fn addMessage:void (node@(lives):CodeNode descr:string) {
    def e:RangerCompilerMessage (new RangerCompilerMessage ())
    e.description = descr
    e.node = node
    def root:RangerAppWriterContext (this.getRoot())
    push root.compilerMessages e
  }
  fn addError:void (targetnode@(weak lives):CodeNode descr:string) {
    def e:RangerCompilerMessage (new RangerCompilerMessage ())
    e.description = descr
    e.node = targetnode
    def root:RangerAppWriterContext (this.getRoot())
    push root.compilerErrors e
  }
  fn addParserError:void (targetnode@(weak lives):CodeNode descr:string) {
    def e:RangerCompilerMessage (new RangerCompilerMessage ())
    e.description = descr
    e.node = targetnode
    def root:RangerAppWriterContext (this.getRoot())
    push root.parserErrors e
  }
  fn addTemplateClass:void (name:string node@(lives):CodeNode) {
    def root:RangerAppWriterContext (this.getRoot())
    push root.templateClassList name
    set root.templateClassNodes name node
  }
  fn hasTemplateNode:boolean (name:string) {
    def root:RangerAppWriterContext (this.getRoot())
    return (has root.templateClassNodes name)
  }
  fn findTemplateNode:CodeNode (name:string) {
    def root:RangerAppWriterContext (this.getRoot())
    return (unwrap (get root.templateClassNodes name))
  }
  fn setStaticWriter:void (className:string writer@(lives):CodeWriter) {
    def root:RangerAppWriterContext (this.getRoot())
    set root.classStaticWriters className writer
  }
  fn getStaticWriter:CodeWriter (className:string) {
    def root:RangerAppWriterContext (this.getRoot())
    return (unwrap (get root.classStaticWriters className))
  }
  fn isEnumDefined:boolean (n:string) {
    if (has definedEnums n) {
      return true
    }
    if (null? parent) {
      return false
    }
    return (parent.isEnumDefined(n))
  }
  fn getEnum@(optional weak):RangerAppEnum (n:string) {
    def res@(optional):RangerAppEnum
    if (has definedEnums n) {
      res = (get definedEnums n)
      return res
    }
    if (!null? parent) {
      return (parent.getEnum(n))
    }    
    return res
  }
  fn isVarDefined:boolean (name:string) {
    if (has localVariables name) {
      return true
    }
    if (null? parent) {
      return false
    }
    return (parent.isVarDefined(name))
  }
  fn setCompilerFlag:void (name:string value:boolean) {
    set compilerFlags name value
  }
  fn hasCompilerFlag:boolean (s_name:string) {
    if (has compilerFlags s_name) {
      return ( unwrap (get compilerFlags s_name) )
    }
    if (null? parent) {
      return false
    }
    return (parent.hasCompilerFlag(s_name))
  }
  fn getCompilerSetting:string (s_name:string) {
    if (has compilerSettings s_name) {
      return (unwrap (get compilerSettings s_name) )
    }
    if (null? parent) {
      return ""
    }
    return (parent.getCompilerSetting(s_name))
  }
  fn hasCompilerSetting:boolean (s_name:string) {
    if (has compilerSettings s_name) {
      return true
    }
    if (null? parent) {
      return false
    }
    return (parent.hasCompilerSetting(s_name))
  }
  
  fn getVariableDef:RangerAppParamDesc (name:string) {
    if (has localVariables name) {
      return (unwrap (get localVariables name))
    }
    if (null? parent) {
      def tmp:RangerAppParamDesc (new RangerAppParamDesc ())
      return tmp
    }
    return (parent.getVariableDef(name))
  }
  fn findFunctionCtx:RangerAppWriterContext () {
    if is_function {
      return this
    }
    if (null? parent) {
      return this
    }
    return (parent.findFunctionCtx())
  }
  fn getFnVarCnt:int (name:string) {
    def fnCtx:RangerAppWriterContext (this.findFunctionCtx())
    def ii:int 0
    if (has fnCtx.defCounts name) {
      ii = (unwrap (get fnCtx.defCounts name))
      ii = (1 + ii)
    } {
      set fnCtx.defCounts name ii
      return 0
    }
    def scope_has:boolean (this.isVarDefined((name + "_" + ii)))
    while scope_has {
      ii = (1 + ii)
      scope_has = (this.isVarDefined((name + "_" + ii)))
    }
    set fnCtx.defCounts name ii
    return ii
  }
  fn debugVars:void () {
    print "--- context vars ---"
    for localVarNames na:string i {
      print ("var => " + na)
    }
    if (!null? parent) {
      parent.debugVars()
    }
  }
  fn getVarTotalCnt:int (name:string) {
    def fnCtx:RangerAppWriterContext this
    def ii:int 0
    if (has fnCtx.defCounts name) {
      ii = (unwrap (get fnCtx.defCounts name))
    }
    if (!null? fnCtx.parent) {
      ii = (ii + (fnCtx.parent.getVarTotalCnt(name)))
    }
    if (this.isVarDefined(name )) {
        ii = ii + 1
    }
    return ii
  }
  fn getFnVarCnt2:int (name:string) {
    def fnCtx:RangerAppWriterContext this
    def ii:int 0
    if (has fnCtx.defCounts name) {
      ii = (unwrap (get fnCtx.defCounts name))
      ii = (1 + ii)
      set fnCtx.defCounts name ii
    } {
      set fnCtx.defCounts name 1
    }
    if (!null? fnCtx.parent) {
      ii = (ii + (fnCtx.parent.getFnVarCnt2(name)))
    }

    def scope_has:boolean (this.isVarDefined(name ))
    if scope_has {
      ii = (1 + ii)
    }

    def scope_has:boolean (this.isVarDefined((name + "_" + ii)))
    while scope_has {
      ii = (1 + ii)
      scope_has = (this.isVarDefined((name + "_" + ii)))
    }
    return ii
  }
  fn getFnVarCnt3:int (name:string) {
    def classLevel (this.findMethodLevelContext())    
    def fnCtx:RangerAppWriterContext this
    def ii:int 0
    if (has fnCtx.defCounts name) {
      ii = (unwrap (get fnCtx.defCounts name))
      set fnCtx.defCounts name ( ii + 1)
    } {
      set fnCtx.defCounts name 1
    }
    if(classLevel.isVarDefined(name)) {
      ii = ii + 1
    }
    def scope_has:boolean (this.isVarDefined((name + "_" + ii)))
    while scope_has {
      ii = (1 + ii)
      scope_has = (this.isVarDefined((name + "_" + ii)))
    }
    return ii
  }
  fn isMemberVariable:boolean (name:string) {
    if (this.isVarDefined(name)) {
      def vDef:RangerAppParamDesc (this.getVariableDef(name))
      if (vDef.varType == RangerContextVarType.Property) {
        return true
      }
    }
    return false
  }
  fn defineVariable:void (name:string desc@(strong):RangerAppParamDesc) {
    def cnt:int 0
    def fnLevel (this.findMethodLevelContext())
    if (false == ((desc.varType == RangerContextVarType.Property) || (desc.varType == RangerContextVarType.FunctionParameter) || (desc.varType == RangerContextVarType.Function))) {
      cnt = (fnLevel.getFnVarCnt3(name))
    }
    if (0 == cnt) {
      switch name {
        case "self" {
          desc.compiledName = "__self"
        }
        case "process" {
          desc.compiledName = "_process"
        }
        case "len" {
          desc.compiledName = "__len"
        }
        default {
          desc.compiledName = name
        }
      }
    } {
      desc.compiledName = (name + "_" + cnt)
    }
    set localVariables name desc
    push localVarNames name
  }
  fn isDefinedClass:boolean (name:string) {
    if (has definedClasses name) {
      return true
    } {
      if (!null? parent) {
        return (parent.isDefinedClass(name))
      }
    }
    return false
  }
  fn getRoot:RangerAppWriterContext () {
    if (null? parent) {
      return this
    } 
    return (parent.getRoot())    
  }
  fn getClasses:[RangerAppClassDesc] () {
    def list:[RangerAppClassDesc]
    for definedClassList n:string i  {
      push list (unwrap (get definedClasses n))
    }
    return list
  }
  fn addClass:void (name:string desc@(strong):RangerAppClassDesc) {
    def root:RangerAppWriterContext (this.getRoot())
    if (has root.definedClasses name) {
      ; skip definition...
    } {
      set root.definedClasses name desc
      push root.definedClassList name
    }
  }
  fn findClass:RangerAppClassDesc (name:string) {
    def root:RangerAppWriterContext (this.getRoot())
    return (unwrap (get root.definedClasses name))
  }
  fn hasClass:boolean (name:string) {
    def root:RangerAppWriterContext (this.getRoot())
    return (has root.definedClasses name)
  }
  fn getCurrentMethod@(weak):RangerAppFunctionDesc () {
    if (!null? currentMethod) {
      return (unwrap currentMethod)
    }
    if (!null? parent) {
      return (parent.getCurrentMethod())
    }
    return (new RangerAppFunctionDesc ())
  }
  fn setCurrentClass:void (cc@(lives):RangerAppClassDesc) {
    in_class = true
    currentClass = cc
  }
  fn disableCurrentClass:void () {
    if in_class {
      in_class = false
    }
    if (!null? parent) {
      parent.disableCurrentClass()
    }
  }
  fn hasCurrentClass:boolean () {
    if (in_class && (!null? currentClass)) {
      return true
    }
    if (!null? parent) {
      return (parent.hasCurrentClass())
    }
    return false
  }
  fn getCurrentClass@(optional weak):RangerAppClassDesc () {
    def non:RangerAppClassDesc currentClass
    if (in_class && (!null? non)) {
      return non
    }
    if (!null? parent) {
      return (parent.getCurrentClass())
    }    
    return non
  }
  fn restartExpressionLevel:void () {
    expr_restart = true
  }
  fn isInExpression:boolean () {
    if ((array_length expr_stack) > 0) {
      return true
    }
    if ((!null? parent) && (expr_restart == false)) {
      return (parent.isInExpression())
    }
    return false
  }
  fn expressionLevel:int () {
    def level:int (array_length expr_stack)
    if ((!null? parent) && (expr_restart == false)) {
      return (level + (parent.expressionLevel()))
    }
    return level
  }
  fn setInExpr:void () {
    push expr_stack true
  }
  fn unsetInExpr:void () {
    removeLast expr_stack
  }
  fn getErrorCount:int () {
    def cnt:int (array_length compilerErrors)
    if parent {
      cnt = cnt + (parent.getErrorCount())
    }
    return cnt
  }
  fn isInStatic:boolean() {
    if in_static_method {
      return true
    }
    if parent {
      return (parent.isInStatic())
    }
    return false
  }
  fn isInMain:boolean() {
    if in_main {
      return true
    }
    if parent {
      return (parent.isInMain())
    }
    return false
  }  
  fn isInMethod:boolean () {
    if ((array_length method_stack) > 0) {
      return true
    }
    if (!null? parent) {
      return (parent.isInMethod())
    }
    return false
  }
  fn setInMethod:void () {
    push method_stack true
  }
  fn unsetInMethod:void () {
    removeLast method_stack
  }
  fn findMethodLevelContext@(weak optional):RangerAppWriterContext () {
    def res@(weak optional):RangerAppWriterContext
    if function_level_context  {
      res = this
      return res
    }
    if(parent) {
      return (parent.findMethodLevelContext())
    }
    res = this
    return res
  }
  fn findClassLevelContext@(weak optional):RangerAppWriterContext () {
    def res@(weak optional):RangerAppWriterContext
    if class_level_context  {
      res = this
      return res
    }
    if(parent) {
      return (parent.findClassLevelContext())
    }
    res = this
    return res
  }
  fn fork:RangerAppWriterContext () {
    def new_ctx:RangerAppWriterContext (new RangerAppWriterContext ())
    new_ctx.parent = this
    return new_ctx
  }


}

