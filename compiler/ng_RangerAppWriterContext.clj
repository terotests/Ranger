
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
    ;---
    if(!null? operators) {
      def op (unwrap operators)
      return (op.getOperators(name))
    }
    if(!null? parent) {
      return (parent.getOperators(name))
    }
    print " - no operators found ! - "
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
  fn transformWord:string (input_word:string) {
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
  fn createOperator:void (fromNode@(strong):CodeNode) {
    def root:RangerAppWriterContext (this.getRoot())
    if (root.initStdCommands()) {
      push root.stdCommands.children fromNode
      def fc:CodeNode (itemAt fromNode.children 0)
    }
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
      if (name == "len") {
        desc.compiledName = "__len"
      } {
        desc.compiledName = name
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

