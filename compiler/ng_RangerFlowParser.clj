
Import "stdlib.clj"
Import "ng_RangerAppMessages.clj"
Import "ng_RangerAppParamDesc.clj"
Import "ng_RangerAppFunctionDesc.clj"
Import "ng_RangerAppClassDesc.clj"
Import "ng_RangerTypeClass.clj"
Import "ng_CodeNode.clj"
Import "ng_RangerAppWriterContext.clj"
Import "ng_writer.clj"
Import "ng_parser_v2.clj"
Import "ng_RangerArgMatch.clj"
Import "ng_DictNode.clj"
Import "ng_RangerSerializeClass.clj"
Import "ng_RangerImmutableExtension.clj"
Import "ng_RangerServiceBuilder.clj"
Import "ng_RangerAppOperatorDesc.clj"

Import "TFiles.clj"
Import "TTypes.clj"

Import "FlowEnterVarDef.clj"

; -------- developer documentation part comes over here --------------

plugin.md "developer.md" {
  h1 Flow Parser Developer Docs

  h2 'Overview of the parsing'

  p 'The parsing process has broadly following stages'

  ul {
    li 'Parse the root document using RangerLispParser'
    li 'Create root context'
    li 'Parse basic operators and initialize active `operators` from Lang.clj in the context'
    li 'Merge imported documents into the main AST'
    li 'Call plugins generate_ast method for additional declarations'
    li 'Collect operators, classes, methods, extensions, unions, system classes from files'
    li 'Do static analysis of the code using ' (b 'RangerFlowParser')
    li 'Call preprocess plugins'
    li 'Compile the source code into virtual filesystem'
    li 'Call postprocess plugins'
    li 'If no errors, save the results into real filesystem'
  }
}

operator type:void all {
  fn r.func:RangerAppFunctionDesc ( node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter ) {
    def parser (new RangerFlowParser)
    return (parser.CreateFunctionObject(node ctx wr))
  }
}

class ClassJoinPoint {
  def class_def:RangerAppClassDesc
  def node@(weak):CodeNode
}

class WalkLater {
  def arg@(weak):CodeNode
  def callArg@(weak):CodeNode
}

class RangerFlowParser {

  def hasRootPath false
  def rootPath:string ""
  def _debug false
  ; def is_chaining false
  ; def chainRoot:CodeNode

  def stdCommands@(optional):CodeNode
  def lastProcessedNode@(weak):CodeNode
  def collectWalkAtEnd:[CodeNode]
  def walkAlso@(weak):[CodeNode]
  def serializedClasses@(weak):[RangerAppClassDesc]
  def immutableClasses@(weak):[RangerAppClassDesc]
  def classesWithTraits:[ClassJoinPoint]
  def collectedIntefaces:[RangerAppClassDesc]
  def definedInterfaces:[string:boolean]

  def signatureCnt 0
  def argSignatureCnt 0
  def mainCnt 0
  def isDefinedSignature:[string:int]
  def isDefinedArgSignature:[string:int]

  def extendedClasses:[string:string]

  def allNewRNodes:[CodeNode]

  fn WalkNodeChildren:void (node@(lives):CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.hasStringProperty("todo")) {
      ctx.addTodo(node (node.getStringProperty("todo")))
    }
    if node.expression {
      def is_chaining false
      def last_is_assign false
      def chainRoot@(weak):CodeNode
      def innerNode@(weak):CodeNode
      def assignNode@(weak):CodeNode
      def newNode:CodeNode
      
      def ch_len (size node.children)
      for node.children item:CodeNode i {
        def did_find false
        if(has item.children) {
          def fc (item.getFirst())
          def name (fc.vref)
          
          if( ( (strlen name) > 0 ) && ( ( charAt name 0) == (charcode ".")) ) {
            did_find = true
            if(i>0) {
              def last_line (at node.children (i - 1))
              if (is_chaining == false ) {
                last_line.createChainTarget()
                is_chaining = true
                if(!null? last_line.chainTarget) {
                  chainRoot = last_line.chainTarget
                  innerNode = last_line.chainTarget
                  assignNode = last_line
                  last_is_assign = true
                } {
                  chainRoot = last_line
                  innerNode = last_line
                }
              }
              def method_name (substring name 1 (strlen name))
              def mArgs (item.getSecond())
              if(last_is_assign) {
                push assignNode.children (fc.copy())
                push assignNode.children (mArgs.copy())
              } {
                newNode = (node.newExpressionNode())
                newNode.add( (node.newVRefNode("call") ) ) 
                newNode.add( (innerNode.copy() ) )
                newNode.add( (node.newVRefNode(method_name)) )
                newNode.add( (mArgs.copy()) )
                innerNode = newNode
              }
              item.is_part_of_chain = true
            }
          } 
        }
        if(did_find == false || (i == (ch_len - 1) ) ) {
          if( is_chaining && (last_is_assign == false)) {
            chainRoot.getChildrenFrom( (unwrap innerNode ) )
            chainRoot.tag = "chainroot"
          }
          is_chaining = false
          last_is_assign = false
        }
      }
      for node.children item@(lives):CodeNode i {

        if( (ctx.expressionLevel()) == 0 ) {
          ctx.lastBlockOp = item
        }
        item.parent = node
        this.WalkNode(item ctx wr)
        node.copyEvalResFrom(item)
      }      
    }
  }

  fn WalkNode:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
    def line_index:int (node.getLine())
    if node.flow_done {
      return true
    }
    if( ctx.isPluginOp(node)) {
      return true
    }
    node.flow_ctx = ctx
    node.flow_done = true
    

    this.lastProcessedNode = node
    if (node.hasStringProperty("todo")) {
      ctx.addTodo(node (node.getStringProperty("todo")))
    }
    ; currently skip...
    if(node.is_part_of_chain) {
      return true
    }
    if (node.isPrimitive()) {
      if ((ctx.expressionLevel()) == 0) {
        if! (ctx.hasCompilerFlag('voidexpr'))  {
          ctx.addError( node "Primitive element at top level!")
        }
      }
      this.WriteScalarValue(node ctx wr)
      return true
    }
    if (node.value_type == RangerNodeType.VRef || node.value_type == RangerNodeType.Hash || node.value_type == RangerNodeType.Array) { 
      this.WriteVRef(node ctx wr)
      return true
    }
    if (node.value_type == RangerNodeType.Comment) {
      return true
    }

    ; if node is defined from register, get the value from the register...
    if( (has node.register_name)) {
      if( ctx.isVarDefined( node.register_name )) {
        def regInfo (ctx.getVariableDef(node.register_name))
        if(!null? regInfo.nameNode ) {
          node.copyEvalResFrom( (unwrap regInfo.nameNode) )
          return true
        } {
          ; ctx.addError( node ('compiler error: could not find temporary register ' + node.register_name) )
        }
      } {
        ; ctx.addError( node ('compiler error: could not find temporary register ' + node.register_name) )
      }
      return true
    }

    ; if(node.expression && ((size node.children) > 0)) {
    if(node.value_type == RangerNodeType.XMLNode) {

      def fc node

      if(fc.value_type == RangerNodeType.XMLNode) {

        ; operator function...
        def opBody (r.block)
        def opTpl (r.expression (r.vref 'defn') (r.vref 'tmp_create') (r.expression) )
        
        def currCnt 1

        def walk_xml (fn:void (xmlNode:CodeNode regName:string) {

        })

        walk_xml = (fn:void (xmlNode:CodeNode regName:string) {


          def rootClassDef (ctx.findClass(xmlNode.vref))

          if rootClassDef.is_system {
            push opBody.children (r.expression (r.vref 'def') (r.vref regName) (r.expression (r.vref 'create') (r.vref xmlNode.vref)))
            xmlNode.attrs.forEach({
              if( (size item.children) > 0) {
                def fc (at item.children 0)
                ; print " - attr expression for " + item.vref +   " " + (fc.getCode())
                push opBody.children (r.expression (r.vref 'attr') (r.vref regName)  (r.vref item.vref) (fc.copy()) )
                return
              }
              if(has item.string_value) {
                push opBody.children (r.expression (r.vref 'attr') (r.vref regName)  (r.vref item.vref) (r.value item.string_value) )
              }
            })

            ; -- walk the children...
            xmlNode.children.forEach({
              if(item.value_type != RangerNodeType.XMLNode) {
                if( item.expression ) {
                  ; for example maps
                  def itemCopy (item.copy())
                  def theNode item
                  ctx.setTestCompile()
                  this.WalkNode( itemCopy ctx wr )
                  ctx.unsetTestCompile()
                  if(ctx.hasClass(itemCopy.eval_array_type)) {
                    def paramClassDef (ctx.findClass(itemCopy.eval_array_type))
                    def chNode item
                    def t (r.vref 'tmp')
                    t.setFlag('temp')
                    push opBody.children (r.expression (r.vref 'forEach' ) (theNode.copy()) 
                      (r.block 
                        (r.expression (r.vref 'def') t (r.vref 'item') )
                        (r.expression (r.vref 'push') (r.vref regName) (r.vref 'tmp'))
                      )
                    )
                  } {
                    if(ctx.hasClass(itemCopy.eval_type_name)) {
                      push opBody.children (r.expression (r.vref 'push') (r.vref regName) (theNode.copy()))
                    }
                  }
                } {
                  ; print "--> not expression, vref -->  " + (item.vref) 
                  ; if(ctx.hasClass(itemCopy.eval_type)) {
                  ;  push opBody.children (r.expression (r.vref 'push') (r.vref regName) (item.copy()))
                  ; }
                }
              }
              if(item.value_type == RangerNodeType.XMLNode) {
                if(ctx.hasClass(item.vref)) {
                  def paramClassDef (ctx.findClass(item.vref))
                  def chNode item
                  currCnt = currCnt + 1
                  def regN ('r' + currCnt)
                  walk_xml ( chNode regN )
                  push opBody.children (r.expression (r.vref 'push') (r.vref regName) (r.vref regN) )
                }
              }
            })
            ; ***** system class ends ****
          } {

            def match (new RangerArgMatch)
;   fn areEqualATypes:boolean (type1:string type2:string ctx:RangerAppWriterContext) {

            ; areEqualATypes

            push opBody.children (r.expression (r.vref 'def') (r.vref regName) (r.expression (r.vref 'new') (r.vref xmlNode.vref)))
            ; print "XML node " + xmlNode.vref
            xmlNode.attrs.forEach({
              ; print "attr " + item.vref + " str val -> " + item.string_value
              if( (size item.children) > 0) {
                def fc (at item.children 0)
                ; print " - attr expression for " + item.vref +   " " + (fc.getCode())
                push opBody.children (r.expression (r.vref '=') (r.vref (regName + '.' + item.vref)) (fc.copy()) )
                return
              }
              if(has item.string_value) {
                push opBody.children (r.expression (r.vref '=') (r.vref (regName + '.' + item.vref)) (r.value item.string_value) )
              }
              if(item.parsed_type == RangerNodeType.Integer) {
                push opBody.children (r.expression (r.vref '=') (r.vref (regName + '.' + item.vref)) (r.value item.int_value) )
              }
            })
            ; -- walk the children...
            xmlNode.children.forEach({
              if(item.value_type != RangerNodeType.XMLNode) {

                if( item.expression ) {
                  ; for example maps
                  def itemCopy (item.copy())
                  def theNode item

                  ctx.setTestCompile()
                  this.WalkNode( itemCopy ctx wr )
                  ctx.unsetTestCompile()

                  if(ctx.hasClass(itemCopy.eval_array_type)) {
                    def paramClassDef (ctx.findClass(itemCopy.eval_array_type))
                    def chNode item
                    rootClassDef.variables.forEach({
                      ; --> comparing, are the same class ?? 
                      if( match.areEqualATypes(item.nameNode.array_type itemCopy.eval_array_type ctx)) {                      ; if(item.nameNode.array_type == itemCopy.eval_array_type) {
                        def t (r.vref 'tmp')
                        t.setFlag('temp')
                        push opBody.children (r.expression (r.vref 'forEach' ) (theNode.copy()) 
                          (r.block 
                            (r.expression (r.vref 'def') t (r.vref 'item') )
                            (r.expression (r.vref 'push') (r.vref (regName +'.' +item.name)) (r.vref 'tmp'))
                          )
                        )
                      }
                    })
                  } {
                    print "could not find class" + itemCopy.eval_array_type
                  }
                }
              }
              if(item.value_type == RangerNodeType.XMLNode) {
                if(ctx.hasClass(item.vref)) {
                  def paramClassDef (ctx.findClass(item.vref))
                  def chNode item
                  ; find the variable which has this class as array...
                  rootClassDef.variables.forEach({
                    if( match.areEqualATypes(item.nameNode.array_type chNode.vref ctx)) {                      
                      ; if(item.nameNode.array_type == itemCopy.eval_array_type) {
                    ; if(item.nameNode.array_type == chNode.vref) {
                      ; found the variable...
                      currCnt = currCnt + 1
                      def regN ('r' + currCnt)
                      walk_xml ( chNode regN )
                      if paramClassDef.is_immutable {
                        ; if Immutable should first walk the children and only after that add..
                        ;   r1_5 = (r1_5).set_children(operatorsOfVector.push_3(r1_5.children, (r7_1)));

                        push opBody.children (r.expression (r.vref '=') 
                                                  (r.vref (regName +'.' +item.name)) 
                                                  (r.expression (r.vref 'push') 
                                                    (r.vref (regName +'.' +item.name)) (r.vref regN) ) )

                      } {
                        push opBody.children (r.expression (r.vref 'push') (r.vref (regName +'.' +item.name)) (r.vref regN) )
                      }
                    }
                  })
                }
              }
            })
          }
          
        })

        walk_xml( fc 'r1' )

        push opBody.children (r.expression (r.vref 'ret') (r.vref 'r1'))
        push opTpl.children opBody

        node.value_type = RangerNodeType.NoType
        node.getChildrenFrom( (r.expression (r.vref 'tmp_create')))

        node.value_type = RangerNodeType.NoType
        node.expression = true

        this.TransformOpFn( ([] opTpl) node ctx wr)
        return true
      }

    }
    

    if( (size node.children) > 0) {
      def fc (node.getFirst())
      if( (size fc.ns) > 1) {
        if( (at fc.ns 0) == "plugin" ) {
          if(node.is_plugin) {
            return true
          }
          node.is_plugin = true
          def pName (at fc.ns 1)
          ctx.addPluginNode( pName node )
          return true
        }
      }
    }    

    if( (size node.children) == 1 ) {
      def fc (first node.children)
      if( ctx.isVarDefined( fc.vref )) {
        fc.parent = node
        if(!null? fc.evalCtx) {
          this.WalkNode(fc (unwrap fc.evalCtx) wr)
        } {
          this.WalkNode(fc ctx wr)
        }
        node.copyEvalResFrom(fc)
        return true        
      }
    }

    def skip_if ([] "Extends" "operator" "extends" "operators" "systemclass" "systemunion" "union" "flag" "trait" "enum" "Import")
    if( has node.children ) {

      def fc (first node.children)
      if( (indexOf skip_if fc.vref ) >= 0) {
        return true
      }      

      ; _1 _2 _3 _4 _5 _6 

      ; createNewOpFnName
      ; ("" + (_ * 10))
      ; (=> "" + (_ * 10))
      ; defn tmp_anon1 (v1) ("" + (v1 * 10))
      ; (=> "" + (_ * 10)) --> tmp_anon1
      ; map items (# print '' + _)

      ; (# _ > 10) item

      if(fc.vref == '#') {

        ; print "--> arrow op " + (node.getCode()) + " err cnt " + (ctx.errCnt())

        def fnCtx (ctx.findFunctionCtx())
        this.DefineArrowOpFn( node fnCtx wr)

        node.value_type = RangerNodeType.VRef
        node.expression = false
        node.is_block_node = false
        ; node.vref = ''
        clear node.ns
        push node.ns node.vref

        clear node.children
        nullify node.paramDesc
        node.hasParamDesc = false
        return true
      } {
        if(fc.expression  && (has fc.children)) {
          def exprFc (first fc.children)
          if(exprFc.vref == '#') {
            ; def opFnName ( ctx.createNewOpFnName() )
            this.DefineArrowOpFn( fc ctx wr)
          }
        }        
      }
      

      def b_found true
      def opFn (ctx.getOpFns(fc.vref))
      if(has opFn) {
        this.TransformOpFn( opFn node ctx wr)
        return true
      }
      
      switch fc.vref {
        case 'page' {
          def sc (node.getSecond())
          ctx.addPage( sc.vref node )
        }
        case 'def' { 
          EnterVarDef this node ctx wr
        }
        case 'var' {
          EnterVarDef this node ctx wr
        }
        case 'let' {
          EnterVarDef this node ctx wr
        }
        case 'property' {
          this.GetProperty(node ctx wr)
        }
        case 'CreateClass' {
          this.EnterClass(node ctx wr)
        }
        case 'class' {
          this.EnterClass(node ctx wr)
        }
        case 'defn' {
          this.DefineOpFn(node ctx wr)
        }
        case 'fn' {
          if(ctx.isInMethod()) {    
            this.EnterLambdaMethod( node ctx wr )
          } {
            this.EnterMethod(node ctx wr)
          }      
        }
        case 'sfn' {
          this.EnterStaticMethod(node ctx wr)
        }
        case 'static' {
          this.EnterStaticMethod(node ctx wr)
        }
        case '=' {
          this.cmdAssign(node ctx wr)
        }
        case 'constructor' {
          this.Constructor(node ctx wr)
        }
        case 'Constructor' {
          this.Constructor(node ctx wr)
        }
        case 'new' {
          this.cmdNew(node ctx wr)
        }
        case '[]' {
          this.cmdArray( node ctx wr )      
        }
        case 'call' {
          this.cmdCall( node ctx wr )      
        }
        case 'fun' {
          this.EnterLambdaMethod( node ctx wr )      
        }
        case 'extension' {
          this.EnterClass(node ctx wr)
        }
        case 'service' {
          try {
            def sc (node.getSecond())
            def params (node.getThird())
            ctx.addService( sc.vref node )
            def paramClass (params.getFirst())
            def rvClassDef (ctx.findClass(sc.type_name))
            def paramClassDef (ctx.findClass(paramClass.type_name))
            node.appGUID = sc.vref+"_"+(sha256 ( (rvClassDef.node.getCode()) + (paramClassDef.node.getCode()) ) )

          } {
            ctx.addError(node "invalid service definition")
          }          
        }
        default {
          b_found = false
        }
      }
      if b_found {
        return true
      }
    }    

    if (this.matchNode(node ctx wr)) {
      return true
    }

    if ((size node.children) > 0) {
      
      def fc:CodeNode (at node.children 0)

      ; (  (someObject) '.someProperty' )
      if( fc.expression && ( ( size node.children ) == 2) ) {
        def sec (node.getSecond())
        if( (has sec.vref) && (first sec.vref) == '.' ) {


          ; TODO: implement also pure property access...
;          print "Possible property access " + (node.getCode()) + " : " + (substring sec.vref 1)
;          print "--> Walking "
          this.WalkNode( fc ctx wr )
;          print "<-- returned from walk of Possible property access " + (node.getCode()) + " : " + (substring sec.vref 1)
;          print "<-- type == " + fc.eval_type_name
          
          if( (has fc.eval_type_name) && (ctx.isDefinedClass(fc.eval_type_name)) ) {
            
            def parts (strsplit (substring sec.vref 1) ".")
            def method_name (first parts)
            def classDesc (ctx.findClass(fc.eval_type_name))

            def objExpr (fc.copy()) 
            def calledItem (r.expression 
                            (r.vref 'property')
                            (fc.copy())
                            (r.vref method_name)
                          )
            parts.forEach({
              if(index > 0) {
                  try {
                    def p (classDesc.findVariable(method_name))
                    classDesc = (ctx.findClass(p.nameNode.type_name))
                    calledItem = (r.expression 
                                    (r.vref 'property')
                                    (calledItem.copy())
                                    (r.vref item)
                                )
                    method_name = item
                  } {
                    ctx.addError(sec ('invalid property'))
                  }
              }
            })

            def m (classDesc.findVariable(method_name))
            if (!null? m) {
                node.getChildrenFrom( calledItem )
                node.flow_done = false
                this.WalkNode( node ctx wr)
                return true
            }

            def m (classDesc.findMethod(method_name))
            if (!null? m) {
                ; ( (<something>) .someMethod )
                node.getChildrenFrom( calledItem )
                node.flow_done = false
                this.transformMethodToLambda( node (unwrap m) ctx wr )
                return true
            }
          }
        }
      } 

      ; (  (someObject) '.methodName' (<arguments>) )
      if( fc.expression && ( ( size node.children ) == 3) ) {

        ; print ""
        ; print ""

        def sec (node.getSecond())
        def third (node.getThird())
        if( (has sec.vref) && (first sec.vref) == '.' ) {

          this.WalkNode( fc ctx wr )
          def parts (strsplit (substring sec.vref 1) ".")
          def method_name (last parts)
          def classDesc (ctx.findClass(fc.eval_type_name))
          def objExpr (fc.copy()) 
          def calledItem (fc.copy())

          parts.forEach({
            if(index < ((size parts) - 1) ) {
                try {
                  calledItem = (r.expression 
                                  (r.vref 'property')
                                  (calledItem.copy())
                                  (r.vref item)
                              )
                  def p (classDesc.findVariable(item))
                  classDesc = (ctx.findClass(p.nameNode.type_name))
                } {
                  ctx.addError(sec ('invalid property ' + item ))
                }
            }
          })


          def calledItem (r.expression 
                          (r.vref 'call')
                          calledItem
                          (r.vref method_name)
                          (third.copy())
                         )
          node.getChildrenFrom( calledItem )
          node.flow_done = false
          this.WalkNode( node ctx wr)
          return true
        }
      } 
      
      if (fc.value_type == RangerNodeType.VRef) {
        def was_called:boolean true
        switch fc.vref {
          case "Enum" {
            ; this.cmdEnum(node ctx wr)
            was_called = true
          }
          default {
            was_called = false
          }
        }
        if was_called {
          return true
        }
        if ((size node.children) > 1) {
          if (this.cmdLocalCall(node ctx wr)) {
            return true
          }
        }
      } 
    }
    if node.expression {
      for node.children item@(lives):CodeNode i {

        if( (ctx.expressionLevel()) == 0 ) {
          ctx.lastBlockOp = item
        }
        
        item.parent = node
        if(!null? item.evalCtx) {
          this.WalkNode(item (unwrap item.evalCtx) wr)
        } {
          this.WalkNode(item ctx wr)
        }
        node.copyEvalResFrom(item)

        if( (i == 0) && ( (size node.children ) == 2) ) {
          
          if(item.eval_type == RangerNodeType.Method && (!null? item.paramDesc) ) {
            
            def pDesc (unwrap item.paramDesc)
            def mDesc (cast pDesc to:RangerAppFunctionDesc)

            node.eval_type = mDesc.nameNode.value_type
            node.eval_type_name = mDesc.nameNode.type_name
            node.eval_array_type = mDesc.nameNode.array_type
            node.eval_key_type = mDesc.nameNode.eval_key_type

            node.is_direct_method_call = true
            return true

          }
        }

        ; the first node could be lambda expression, which transforms to lambda call ...
        if( (!null? item.expression_value) || item.value_type == RangerNodeType.ExpressionType || item.eval_type == RangerNodeType.ExpressionType ) {
          
          ; localLambdaCall
          if( (i == 0) && ( (size node.children ) == 2) ) {
            
            node.has_lambda_call = true            
            def second ( at node.children 1)
            ctx.setInExpr()
            this.WalkNode( second ctx wr)
            ctx.unsetInExpr()

            ; set the lambda expression return value as the value of the current node...
            if(!null? item.expression_value) {
              def lambdaNode (unwrap item.expression_value)

              def nn:CodeNode (at lambdaNode.children 0)
              node.eval_type = (nn.typeNameAsType(ctx))
              node.eval_type_name = nn.type_name
              node.eval_array_type = nn.array_type
              node.eval_key_type = nn.key_type
              if(node.eval_type == RangerNodeType.ExpressionType) {
                node.expression_value = (nn.expression_value.copy())
              }
              if(nn.hasFlag("optional")) {
                node.setFlag("optional")
              }
              this.testLambdaCallArgs( lambdaNode second ctx wr )
            }
            break
          }
        }
      }
      ; ctx.addError(node "Could not understand this part")
      return true
    }

    ctx.addError(node "Could not understand this part")

    return true
  }



  fn getVoidNameSignature:string () {
      def s "void"
      if(has isDefinedSignature s) {
        def cc (unwrap (get isDefinedSignature s))
        return ("void_" + cc)
      }
      signatureCnt = signatureCnt + 1
      set isDefinedSignature s signatureCnt
      return ( "void_" + signatureCnt )
  }  

  fn getNameSignature:string (node:CodeNode) {
      def s ( (node.type_name) + (node.buildTypeSignature()) )
      if(has isDefinedSignature s) {
        def cc (unwrap (get isDefinedSignature s))
        if(cc == 1) {
          return node.type_name
        }        
        return ("_" + cc)
      }
      signatureCnt = signatureCnt + 1
      set isDefinedSignature s signatureCnt
      if(signatureCnt == 1) {
        return node.type_name
      }
      return ( node.type_name + "_" + signatureCnt )
  }  

  fn getArgsSignature:string (node:CodeNode) {
      def exp_s ""
      for node.children arg:CodeNode i {
        exp_s = exp_s + (arg.buildTypeSignature())
        exp_s = exp_s + ","
      }
      if(has isDefinedArgSignature exp_s) {
        def cc (unwrap (get isDefinedArgSignature exp_s))
        if(cc == 1) {
          return ""
        }       
        return ("_" + cc)
      }
      signatureCnt = signatureCnt + 1
      set isDefinedArgSignature exp_s signatureCnt
      if(signatureCnt == 1) {
        return ""
      }      
      return ( "_" + signatureCnt )
  }    
  fn getThisName:string () {
    return "this"
  }

  ; (property obj someProperty)
  ; (property obj x)
  fn GetProperty:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if( (size node.children ) != 3) {
      ctx.addError(node 'Invalid property descriptor')
      return
    }
    def obj (node.getSecond())
    def prop (node.getThird())
    this.WalkNode( obj ctx wr )
    
    if( ctx.isDefinedClass(obj.eval_type_name) ) {
      try {
        def currC ( ctx.findClass(obj.eval_type_name) )
        def varDef (currC.findVariable(prop.vref))
        if(!null? varDef) {

          prop.flow_done = true
          prop.eval_type = RangerNodeType.VRef

          node.hasParamDesc = true
          node.ownParamDesc = varDef
          node.paramDesc = varDef
          varDef.ref_cnt = (1 + varDef.ref_cnt)
          def vNameNode:CodeNode varDef.nameNode
          if (!null? vNameNode)  {
            if (vNameNode.hasFlag("optional")) {
              node.setFlag("optional")
            }
            node.eval_type = (vNameNode.typeNameAsType(ctx))
            node.eval_type_name = vNameNode.type_name
            if (vNameNode.value_type == RangerNodeType.Array) {
              node.eval_type = RangerNodeType.Array
              node.eval_array_type = vNameNode.array_type
            }
            if (vNameNode.value_type == RangerNodeType.Hash) {
              node.eval_type = RangerNodeType.Hash
              node.eval_key_type = vNameNode.key_type
              node.eval_array_type = vNameNode.array_type
            }
          }
          return
        } 
        def mDef (currC.findMethod(prop.vref))
        if(!null? mDef) {
          ; node.flow_done = true
          node.eval_type = RangerNodeType.Method
          node.hasParamDesc = true
          node.ownParamDesc = mDef
          node.paramDesc = mDef
          mDef.ref_cnt = (1 + mDef.ref_cnt)
          return
        } 
        ctx.addError(node ('Did not find property from class ' + currC.name))        
      } {
        ctx.addError(node 'Not valid property access')
      }

    } {
      ctx.addError(obj 'Can not access property of a non-class value')
    }

  }

  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.vref == "_") {
      return
    }
    if (node.vref == "#") {
      return
    }

    def rootObjName:string (at node.ns 0)
    if (ctx.isInStatic()) {
      if(rootObjName == "this") {
        ctx.addError(node "This can not be used in static context")
      }
    }
    if (ctx.isEnumDefined(rootObjName)) {
      def enumName:string (at node.ns 1)
      def ee@(optional):RangerAppEnum (ctx.getEnum(rootObjName))
      def e:RangerAppEnum (unwrap ee)
      if (has e.values enumName) {
        node.eval_type = RangerNodeType.Enum
        node.eval_type_name = rootObjName
        node.int_value = (unwrap (get e.values enumName))
      } {
        ctx.addError(node ('Undefined Enum ' + rootObjName + '.' + enumName))
        node.eval_type = RangerNodeType.InvalidType
      }
      return 
    }
    if (node.vref == (this.getThisName())) {
      def cd@(optional):RangerAppClassDesc (ctx.getCurrentClass())
      def thisClassDesc:RangerAppClassDesc cd
      node.eval_type = RangerNodeType.Object
      node.eval_type_name = thisClassDesc.name
      node.ref_type = RangerNodeRefType.StrongImmutable
      ; def ts:RangerTypeClass (thisClassDesc.nameNode.createTypeSignature(ctx))
      ;node.typeClass = ts
      return
    }

    if( ctx.isCapturing()) {
      if( (ctx.isVarDefined(rootObjName)) ) {
        if ( (ctx.isLocalToCapture(rootObjName)) == false ) {
          ; is_captured
          def captDef@(lives):RangerAppParamDesc (ctx.getVariableDef(rootObjName))
          def cd@(optional):RangerAppClassDesc (ctx.getCurrentClass())
          ; capturedLocals
          push cd.capturedLocals captDef

          captDef.is_captured = true
          ctx.addCapturedVariable(  rootObjName) 
        }    
      }
    }
    if ( rootObjName == "this" || (ctx.isVarDefined(rootObjName)) ) {

      def vDef2:RangerAppParamDesc (ctx.getVariableDef(rootObjName))
      def activeFn:RangerAppFunctionDesc (ctx.getCurrentMethod())
      def vDef@(optional):RangerAppParamDesc (this.findParamDesc(node ctx wr))

      if(!null? vDef) {
        node.hasParamDesc = true
        node.ownParamDesc = vDef
        node.paramDesc = vDef
        vDef.ref_cnt = (1 + vDef.ref_cnt)
        def vNameNode:CodeNode vDef.nameNode

        if( ctx.isDefinedClass( node.type_name)) {
          def m (ctx.getCurrentMethod())
          m.addClassUsage( (ctx.findClass(node.type_name)) ctx)
        }
        if( ctx.isDefinedClass( node.eval_type_name)) {
          def m (ctx.getCurrentMethod())
          m.addClassUsage( (ctx.findClass(node.eval_type_name)) ctx)
        }

        if (!null? vNameNode)  {
          if (vNameNode.hasFlag("optional")) {
            node.setFlag("optional")
          }
          ;def ts:RangerTypeClass (vNameNode.createTypeSignature(ctx))
          ;node.typeClass = ts
          node.eval_type = (vNameNode.typeNameAsType(ctx))
          node.eval_type_name = vNameNode.type_name
          if (vNameNode.value_type == RangerNodeType.Array) {
            node.eval_type = RangerNodeType.Array
            node.eval_array_type = vNameNode.array_type
          }
          if (vNameNode.value_type == RangerNodeType.Hash) {
            node.eval_type = RangerNodeType.Hash
            node.eval_key_type = vNameNode.key_type
            node.eval_array_type = vNameNode.array_type
          }
        }
      } {
        ctx.addError( node 'Undefined variable')
      }
    } {
      def class_or_this:boolean (rootObjName == (this.getThisName()))
      if (ctx.isDefinedClass(rootObjName)) {
        class_or_this = true
        node.eval_type = RangerNodeType.Class
        node.eval_type_name = rootObjName
        def m (ctx.getCurrentMethod())
        m.addClassUsage( (ctx.findClass(rootObjName)) ctx)
      }
      if (ctx.hasTemplateNode(rootObjName)) {
        class_or_this = true
      }
      if (false == class_or_this) {
        def udesc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
        def desc:RangerAppClassDesc (unwrap udesc)

        def opList (ctx.getOpFns(node.vref))
        ; if {

        if( (has opList) || node.vref == "fun" || node.vref == "fn" || (node.hasFlag('keyword'))) {
          ; print "TODO: fix the 'fun'"
        } {

          ctx.addError(node ('WriteVREF -> Undefined variable ' + node.vref + ' in class ' + desc.name + ' node : ' + (node.getCode())))
          ctx.addError(node ('WriteVREF -> Undefined variable ' + rootObjName + ' in class ' + desc.name + ' node : ' + (node.parent.getCode())))
          if(!null? node.parent.parent) {
            ctx.addError(node ('WriteVREF -> Undefined variable ' + rootObjName + ' in class ' + desc.name + ' node : ' + (node.parent.parent.getCode())))
          }
        }


      }
      return
    }
  }

  fn EnterFn (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter 
                callback:(fn:void ( node:CodeNode 
                                    ctx:RangerAppWriterContext 
                                    wr:CodeWriter 
                                    nameNode:CodeNode             ; node defining the function name 
                                    fnArgs:CodeNode               ; arguments list
                                    fnBody:CodeNode               ; function body
                                    desc:RangerAppClassDesc       ; class description
                                  ))) {

    try {
      if( (size node.children ) < 4) {
        ctx.addError( node 'Function has too few arguments')
        return
      }
      def nameNode:CodeNode 
      def idx 0
      node.children.forEach({
        if(item.vref == 'static') {
          idx = idx + 1
        }
      })
      def currClass (ctx.getCurrentClass())
      if(null? currClass) {
        ctx.addError( node 'Current class was not defined when entering method')
        return
      }
      callback( node ctx wr 
                  (at node.children (idx + 1))
                  (at node.children (idx + 2))
                  (at node.children (idx + 3))
                  (unwrap currClass)
              )
    } {
      ctx.addError( node ('Error parsing function ' + (error_msg)))
    }
  }

  fn Constructor:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    this.shouldHaveChildCnt(3 node ctx "Method expexts four arguments")
    def cn:CodeNode (at node.children 1)
    def fnBody:CodeNode (at node.children 2)
    def udesc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
    def desc:RangerAppClassDesc (unwrap udesc)
    def m@(lives):RangerAppFunctionDesc desc.constructor_fn
    def subCtx:RangerAppWriterContext (unwrap m.fnCtx)
    
    subCtx.is_function = true
    subCtx.currentMethod = m
    subCtx.setInMethod()
    for m.params v@(lives):RangerAppParamDesc i {
      subCtx.defineVariable(v.name v)
    }
    this.WalkNodeChildren(fnBody subCtx wr)
    subCtx.unsetInMethod()
    if (fnBody.didReturnAtIndex >= 0) {
      ctx.addError(node "constructor should not return any values!")
    }
    for subCtx.localVarNames n:string i {
      def p:RangerAppParamDesc (get subCtx.localVariables n)
      if (p.set_cnt > 0) {
        if(p.is_immutable) {
          ctx.addError( node "Immutable variable was assigned a value")
        }        
        def defNode:CodeNode p.node
        defNode.setFlag("mutable")
        def nNode:CodeNode p.nameNode
        nNode.setFlag("mutable")
      }
    }
  }
  fn WriteScalarValue:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    TTypes.baseTypeAsEval( node ctx wr )
    node.evalTypeClass = (TFactory.new_scalar_signature( node ctx wr ))
  }
 
  fn cmdNew:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if ((size node.children) < 2) {
      ctx.addError(node "the new operator expects at lest two arguments")
      return
    }
    if ((size node.children) < 3) {
      def expr (new CodeNode ( (unwrap node.code) node.sp node.ep))
      expr.expression = true
      push node.children expr
;      ctx.addError(node "the new operator expects at lest two arguments")
;      return
    }
    def obj:CodeNode (node.getSecond())
    def params:CodeNode (node.getThird())
    def currC@(lives):RangerAppClassDesc
    def b_template:boolean false

    def expects_error:boolean false
    def err_cnt:int (ctx.getErrorCount())
    if( node.hasBooleanProperty("error")) {
      expects_error = true
    } 

    ; transform generic trait into a class if necessary
    if(obj.has_vref_annotation) {
      this.CheckVRefTypeAnnotationOf( obj ctx wr )
    }    
    this.WalkNode(obj ctx wr)
    for params.children arg:CodeNode i {
      ctx.setInExpr()
      this.WalkNode(arg ctx wr)
      ctx.unsetInExpr()
    }
    node.eval_type = RangerNodeType.Object
    node.eval_type_name = obj.vref
    if (b_template == false) {
      currC = (ctx.findClass(obj.vref))
      def currM (ctx.getCurrentMethod())
      currM.addClassUsage( (unwrap currC) ctx )
    }
    node.hasNewOper = true
    node.clDesc = currC
    def fnDescr:RangerAppFunctionDesc currC.constructor_fn
    if (!null? fnDescr) {
      if( (size fnDescr.params) > (size params.children)) {
        ctx.addError(node 'Not enough arguments for class constructor ' + (fnDescr.node.getLineAsString()))
        return
      }
      for fnDescr.params param:RangerAppParamDesc i {
        def has_default:boolean false
        if (param.nameNode.hasFlag('default')) {
          has_default = true
        }

        if( param.nameNode.hasFlag('keyword')) {
          continue
        }

        if( (size params.children) <= i) {
          if has_default {
            continue _
          }
          ctx.addError(node 'Missing arguments for function')
          ctx.addError( (unwrap param.nameNode) 'To fix the previous error: Check original function declaration')
        }

        def argNode:CodeNode (at params.children i)

        if (false == (this.areEqualTypes( (unwrap param.nameNode) argNode ctx wr))) {
          ctx.addError(argNode ('ERROR, invalid argument type for ' + currC.name + ' constructor '))
        }

        def pNode:CodeNode (unwrap param.nameNode)
        if( pNode.hasFlag("optional")) {
          if ( false == (argNode.hasFlag("optional")) ) {
              ctx.addError(node ( 'new parameter optionality does not match, expected optional parameter' + (argNode.getCode())) )          
          }
        }
        if( argNode.hasFlag('optional')) {
          if ( false == (pNode.hasFlag('optional')) ) {
              ctx.addError(node ( 'new parameter optionality does not match, expected non-optional, optional given' + (argNode.getCode())) )          
          }
        }
      }
    }

    if(expects_error) {
      def cnt_now:int (ctx.getErrorCount())
      if (cnt_now == err_cnt) {
        ctx.addParserError( node "LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt + " : " +cnt_now)
      }
    } {
      def cnt_now:int (ctx.getErrorCount())
      if (cnt_now > err_cnt) {
        ctx.addParserError( node "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt + " : " +cnt_now)
      }      
    }
  }

  fn transformParams:[CodeNode] ( list:[CodeNode] fnArgs:[RangerAppParamDesc] ctx:RangerAppWriterContext) {
    def res:[CodeNode]
    for list item:CodeNode i {
      if(item.is_block_node) {
        def newNode:CodeNode (new CodeNode ( (unwrap item.code) item.sp item.ep))
        def fnArg:RangerAppParamDesc (at fnArgs i)
        def nn:CodeNode (fnArg.nameNode)
        if(null? nn.expression_value) {
          ctx.addError( item "Parameter is not lambda expression")
          break
        }
        def fnDef:CodeNode (unwrap nn.expression_value)
        def match:RangerArgMatch (new RangerArgMatch ())
        def copyOf:CodeNode (fnDef.rebuildWithType( match false ))
        ; example:
        ;     fn  mapToStrings:[string] ( callback:( f:string (item:T))  ) {
        def fc:CodeNode (at copyOf.children 0)
        fc.vref = "fun"
        ; then add the block as the last children
        def itemCopy:CodeNode (item.rebuildWithType (match false))
        push copyOf.children itemCopy
        def cnt:int ( size item.children )
        while( cnt > 0) {
          removeLast item.children
          cnt = cnt - 1
        }
        for copyOf.children ch@(lives):CodeNode i {
          ; ch.flow_done = false
          push item.children ch
        }
      } 
      push res item
    } 
    return res
  }

  fn transformParams2:[CodeNode] ( list:[CodeNode] fnArgs:[CodeNode] ctx:RangerAppWriterContext) {
    def res:[CodeNode]
    for list item:CodeNode i {
      if(item.is_block_node) {
        print "Transforming --> " + (item.getCode())
        def newNode:CodeNode (new CodeNode ( (unwrap item.code) item.sp item.ep))
        def nn:CodeNode (at fnArgs i)
        if(null? nn.expression_value) {
          ctx.addError( item "Parameter is not lambda expression")
          break
        }
        def fnDef:CodeNode (unwrap nn.expression_value)
        def match:RangerArgMatch (new RangerArgMatch ())
        def copyOf:CodeNode (fnDef.rebuildWithType( match false ))
        ; example:
        ;     fn  mapToStrings:[string] ( callback:( f:string (item:T))  ) {
        def fc:CodeNode (at copyOf.children 0)
        fc.vref = "fun"
        ; then add the block as the last children
        def itemCopy:CodeNode (item.rebuildWithType (match false))
        push copyOf.children itemCopy
        def cnt:int ( size item.children )
        while( cnt > 0) {
          removeLast item.children
          cnt = cnt - 1
        }
        for copyOf.children ch@(lives):CodeNode i {
          ; ch.flow_done = false
          push item.children ch
        }
      } 
      push res item
    } 
    return res
  }

  ; compile time type information
  fn CreateCTTI (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {
    def root (ctx.getRoot())    
    def wr (new CodeWriter)

    root.definedClasses.forEach({
      if(item.isNormalClass()) {
          wr.raw(`
      operators {
        class_name _:string ( ` + item.name + `@(keyword) ) {
          templates {
            * ( '\"` + item.name + `\"' )
          }
        }
      }    
          ` , true)
      }
    })
    root.pushAndCollectCode( (wr.getCode()) orig_wr )
  }

  ; run-time type information ... 
  fn CreateRTTI (node:CodeNode ctx:RangerAppWriterContext orig_wr:CodeWriter) {

    def root (ctx.getRoot())    
    def wr (new CodeWriter)



    wr.out('operator type:void all {' true)
    wr.indent(1)
    wr.out('fn rtti_get_classes:[string] () {' true)
      wr.indent(1)    
      wr.out('return ([] ' false)
      root.definedClasses.forEach({
        if(item.isNormalClass()) {
          wr.out( `'` + item.name +  `' ` , false )
        }
      })
      wr.out(')' true)
    wr.indent(-1)
    wr.out('}' true)


    wr.out('fn rtti_get_fields:[RTTIClassField] (className:string) {' true)
      wr.indent(1)   
      wr.out(`def fields:[RTTIClassField]` true)
      root.definedClasses.forEach({
        if(item.isNormalClass()) {
          wr.out(`if(className == '` + item.name +`') {` , true)
          wr.indent(1)
          item.variables.forEach({
            wr.out('def f (new RTTIClassField)' true)
            wr.out('f.name = `' + item.compiledName +  '`' , true)
            wr.out('f.type_name = `' + item.nameNode.type_name +  '`' , true)
            wr.out('push fields f' true)
          })
            ; -->
          wr.indent(-1)
          wr.out(`}` true)
        }
      })
      wr.out('return fields' true)
      wr.indent(-1)
      wr.out('}' true)
    wr.indent(-1)
    wr.out('}' true)

    ; print (wr.getCode())

    root.pushAndCollectCode( (wr.getCode()) orig_wr )
  }
  

  fn SolveAsyncFuncs (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    def root (ctx.getRoot())
    root.definedClasses.forEach({

      item.static_methods.forEach({
          def thisFn (item)
          def set_async (fn:void (f:RangerAppFunctionDesc) {

          })
          def visited@(weak):[RangerAppFunctionDesc]
          set_async = (fn:void (f:RangerAppFunctionDesc) {
            if( (indexOf visited f ) >= 0 ) {
              return
            }
            push visited f
            if( (!null? f.nameNode) ) {
              f.nameNode.setFlag('async')
            }
            f.isCalledBy.forEach({
              set_async( item )
            })            
            if( !null? f.insideFn) {
              set_async( (unwrap f.insideFn ))
            }
          })
          if( (!null? item.nameNode) ) {
            if(item.nameNode.hasFlag("async")) {
              item.isCalledBy.forEach({
                set_async( item )
              })
              item.forOtherVersions( ctx {
                set_async(item)
              })
              if( !null? item.insideFn) {
                set_async( (unwrap item.insideFn ))
              }
            }
          }
          item.myLambdas.forEach({
            if( (!null? item.nameNode) ) {
              if(item.nameNode.hasFlag("async")) {
                item.isCalledBy.forEach({
                  set_async( item )
                })
                if( !null? item.insideFn) {
                  set_async( (unwrap item.insideFn ))
                }
              }
            }
          })            
      })
      
      item.method_variants.forEach({
        item.variants.forEach({

          def thisFn (item)
          def set_async (fn:void (f:RangerAppFunctionDesc) {

          })
          def visited@(weak):[RangerAppFunctionDesc]
          set_async = (fn:void (f:RangerAppFunctionDesc) {
            if( (indexOf visited f ) >= 0 ) {
              return
            }
            push visited f
            ; TODO: must also iterate all the inherited class functions...
            if( (!null? f.nameNode) ) {
              f.nameNode.setFlag('async')
            }
            f.forOtherVersions( ctx {
              set_async(item)
            })
            f.isCalledBy.forEach({
              set_async( item )
            })            
            if( !null? f.insideFn) {
              set_async( (unwrap f.insideFn ))
            }
          })
          if( (!null? item.nameNode) ) {
            if(item.nameNode.hasFlag("async")) {
              item.isCalledBy.forEach({
                set_async( item )
              })
              item.forOtherVersions( ctx {
                set_async(item)
              })
              if( !null? item.insideFn) {
                set_async( (unwrap item.insideFn ))
              }
            }
          }
          item.myLambdas.forEach({
            if( (!null? item.nameNode) ) {
              if(item.nameNode.hasFlag("async")) {
                item.isCalledBy.forEach({
                  set_async( item )
                })
                if( !null? item.insideFn) {
                  set_async( (unwrap item.insideFn ))
                }
              }
            }            
          })
        })
      })
    })

    def notUsedFunctionCnt 0

    root.definedClasses.forEach({
      item.method_variants.forEach({
        item.variants.forEach({
          if( (size item.isCalledBy ) == 0 ) {
            if( !null? item.container_class) {
              def cc (unwrap item.container_class)
              if( (has cc.extends_classes ) || cc.is_inherited )  {
                def eC (at cc.extends_classes 0)
                ctx.findClass( eC )
                ; not sure if this function is necessary or not...
              } {
                ; print " unused function " + item.name + " in class " + item.container_class.name
                notUsedFunctionCnt = notUsedFunctionCnt + 1
                item.is_unsed = true
              }
            } 
          }
        })
      })
    })

    def add_dce_fn (fn:void (theFn:RangerAppFunctionDesc) {
      def set_called (fn:void (f:RangerAppFunctionDesc) {

      })
      set_called = (fn:void (f:RangerAppFunctionDesc) {
        if(f.is_called_from_main) {
          return
        }
        f.is_called_from_main = true
        f.isUsingClasses.forEach({
          item.is_used_by_main = true
          if(!null? item.constructor_fn) {
            set_called( (unwrap item.constructor_fn))
          }          
        })
        f.forOtherVersions( ctx {
          set_called(item)
        })
        f.isCalling.forEach({
          set_called( item )
        })
        f.myLambdas.forEach({
          set_called( item )
        })
        if( !null? f.container_class) {
          if(!null? f.container_class.constructor_fn) {
            set_called( (unwrap f.container_class.constructor_fn))
          }                      
        }          
      })
      set_called(theFn)
    }) 

    def use_dce false
    if(ctx.hasCompilerFlag('dead4main')) {
      def mainFn:RangerAppFunctionDesc
      root.definedClasses.forEach({
        def cl item
        for cl.static_methods variant@(lives):RangerAppFunctionDesc i {
          ctx.disableCurrentClass()
          if ( (variant.nameNode.hasFlag("main")) && (variant.nameNode.code.filename == (ctx.getRootFile()))) {  
            mainFn = variant
            mainFn.addClassUsage( cl ctx )
          }
        }
      })
      if(!null? mainFn) {
        add_dce_fn( (unwrap mainFn))
        use_dce = true
      }
    }
    if(ctx.hasCompilerSetting('dceclass')) {
      def dc (ctx.getCompilerSetting('dceclass'))
      print "DCE : " + dc
      root.definedClasses.forEach({
        def cl item
        if(cl.name == dc) {
          use_dce = true
          cl.is_used_by_main = true
          for cl.static_methods variant@(lives):RangerAppFunctionDesc i {
            add_dce_fn( variant )
          }
          item.method_variants.forEach({
            item.variants.forEach({
              add_dce_fn(item)
            })
          })          
        }
      })
    }

    if use_dce {
      def verbose (ctx.hasCompilerFlag('verbose'))
      root.definedClasses.forEach({
        if( item.is_used_by_main == false && verbose ) {
          print "class not used by main : " + item.name
        }
        item.static_methods = (filter item.static_methods {
          def cc (unwrap item.container_class)
          if( item.is_called_from_main == false ) {
            if verbose {
              print "removing as dead " + item.name + " from " + cc.name
            }
          }
          return item.is_called_from_main
        })        
        item.method_variants.forEach({
          item.variants = (filter item.variants {
            def cc (unwrap item.container_class)
            if( item.is_called_from_main == false ) {
              if verbose {
                print "removing as dead " + item.name + " from " + cc.name
              }
            }
            return item.is_called_from_main
          })
        })
      })      
    }
    
    if(ctx.hasCompilerFlag('deadcode')) {
      root.definedClasses.forEach({
        item.method_variants.forEach({
          item.variants = (filter item.variants {
            return (item.is_unsed == false)
          })
        })
      })
    }
  }

  fn cmdCall:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
    def obj (node.getSecond())
    def method (node.getThird())
    def callArgs (at node.children 3)

;    print "PARAMS : " + (callArgs.getCode())
;    this.ModernSyntax( callArgs ctx wr true)
;    print "AFTER WALK : " + (callArgs.getCode())
;    this.WalkNode( callParams subCtx wr)

    ; test if the method could be operator
    ; (call 4 + (5))
    def possible_cmd method.vref
    ; def op_list (ctx.getOperators(possible_cmd))
    ; for op_list cmd:CodeNode i {

      def altVersion ( node.newExpressionNode() )
      def origCopy  ( node.copy() )

      altVersion.add( (node.newVRefNode( possible_cmd)) )
      altVersion.add( (obj.copy()) )      
      for callArgs.children ca:CodeNode i {
        altVersion.add( (ca.copy()) )
      }
      altVersion.parent = node
      node.getChildrenFrom( altVersion )
      if ( this.stdParamMatch(node ctx wr false) ) {
        return true
      } {
        ; no match
        node.getChildrenFrom( origCopy )
      }
    ; }

    ; refresh the variables...
    def obj (node.getSecond())
    def method (node.getThird())
    def callArgs (at node.children 3)

    this.WalkNode( obj ctx wr ) 

    if(ctx.isDefinedClass(obj.eval_type_name)) {
      def cl (ctx.findClass(obj.eval_type_name))
      def m (cl.findMethod(method.vref))
      if(!null? m) {
        node.has_call = true

        def currM (ctx.getCurrentMethod())
        currM.addCallTo( (unwrap m) )

        ctx.setInExpr()
        for callArgs.children callArg:CodeNode i {
          this.WalkNode( callArg ctx wr)
        }
        ctx.unsetInExpr()
        def nn:CodeNode m.nameNode
        node.eval_type = (nn.typeNameAsType(ctx))
        node.eval_type_name = nn.type_name
        node.eval_array_type = nn.array_type
        node.eval_key_type = nn.key_type
        if(m.nameNode.hasFlag("throws")) {
          if(false == (ctx.isTryBlock()) ) {
            ctx.addError(obj ('The method ' + m.name + " potentially throws an exception, try { } block is required"))
          }
        }              
        if(nn.value_type == RangerNodeType.ExpressionType) {
          node.expression_value = (nn.expression_value.copy())
        }
        if(nn.hasFlag("optional")) {
          node.setFlag("optional")
        }        
        return true
      } {
        ctx.addError(node ('Class ' + obj.eval_type_name + ' does not have method ' + method.vref))
        return false
      }
    } {
      ctx.addError( node ('can not call non-class type'))
    }
    return true
  }  
 
  ; getAnon:(_:string ( n:string )) () 
  ; (fn:string (nn:string) {
  fn matchLambdaArgs:boolean (n1:CodeNode n2:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def chLen1 (size n1.children)
    def chLen2 (size n2.children)
    if(chLen1 < 2) {
      ctx.addError(n1 "Invalid Lambda definition, missing args or return value")
      ctx.addError(n2 "^ Invalid Lambda definition, missing args or return value")
      return false
    }
    if(chLen2 < 2) {
      ctx.addError(n1 "Invalid Lambda definition, missing args or return value")
      ctx.addError(n2 "^ Invalid Lambda definition, missing args or return value")
      ; print "--> error " + (n1.getCode()) + ", " + (n2.getCode())
      return false
    }
    ; create copies, just in case...
    def rv1 (n1.getFirst())
    def args1 (n1.getSecond())
    def rv2 (n2.getFirst())
    def args2 (n2.getSecond())

    def rvExpr1 (n1.newExpressionNode())
    rvExpr1.push( (rv1.copy()) )
    def rvExpr2 (n2.newExpressionNode())
    rvExpr2.push( (rv2.copy()) )

    def argsExpr1 (args1.copy())
    def argsExpr2 (args2.copy())

    def all_matched true

    if( (size argsExpr1.children) != (size argsExpr2.children) ) {
      ctx.addError(n2 "Invalid parameter count for the lambda expression")
      return false
    }

    argsExpr1.children.forEach({
      def item2 (at argsExpr2.children index)
      if ( item2.value_type != item.value_type ) {
        all_matched = false
      }
      if ( item2.type_name != item.type_name ) {
        all_matched = false
      }
      if ( item2.array_type != item.array_type ) {
        all_matched = false
      }
      if ( item2.key_type != item.key_type ) {
        all_matched = false
      }
      if ( all_matched && item.value_type == RangerNodeType.ExpressionType ) {
       if( false == (this.matchLambdaArgs( (unwrap item.expression_value) (unwrap item2.expression_value) ctx wr) ) ) {
         all_matched = false
       }
      }
    })
    if( all_matched == false) {
      ctx.addError(n2 "Invalid lambda argument types")
      return false
    }

    rvExpr1.children.forEach({
      def item2 (at rvExpr2.children index)
      if ( item2.value_type != item.value_type ) {
        all_matched = false
      }
      if ( item2.type_name != item.type_name ) {
        all_matched = false
      }
      if ( item2.array_type != item.array_type ) {
        all_matched = false
      }
      if ( item2.key_type != item.key_type ) {
        all_matched = false
      }
      if ( all_matched && item.value_type == RangerNodeType.ExpressionType ) {
       if( false == (this.matchLambdaArgs( (unwrap item.expression_value) (unwrap item2.expression_value) ctx wr) ) ) {
         all_matched = false
       }
      }
    })

    if( all_matched == false) {
      ctx.addError(n2 "Invalid lambda return value type")
      return false
    }     
    return true
  }

  fn testLambdaCallArgs:boolean ( lambda_expression:CodeNode callParams:CodeNode ctx:RangerAppWriterContext wr:CodeWriter ) {
    def lambdaDef (at lambda_expression.children 0)
    def lambdaArgs (at lambda_expression.children 1)
    def all_matched true
    if( (size callParams.children) != (size lambdaArgs.children) ) {
      ctx.addError(callParams "Invalid parameter count for the lambda expression " )
      ctx.addError(callParams (' ^ expected : ' + (lambdaArgs.getCode()) ) )
;      ctx.addError(node (' ^ definition : ' + (d.nameNode.getParsedString()) ) )
      all_matched = false
    }
    lambdaArgs.children.forEach({
      def item2 (at callParams.children index)
      if ( item2.eval_type_name != item.type_name ) {
        ; missing: union types handling
        if( item.type_name != 'Any' ) {
          ctx.addError( item2 ( 'Argument of wrong type given for the lambda parameter ' + index))
          all_matched = false
        }
      }
      if ( item2.eval_array_type != item.array_type ) {
        ctx.addError( item2 ( 'Argument of wrong type given for the lambda parameter ' + index))
        all_matched = false
      }
      if ( item2.eval_key_type != item.key_type ) {
        ctx.addError( item2 ( 'Argument of wrong type given for the lambda parameter ' + index))
        all_matched = false
      }
    })
    if( all_matched == false) {
      ctx.addError(callParams "Invalid types for lambda call")
    }
    return all_matched
  }

  fn cmdLocalCall:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def fnNode@(lives):CodeNode (node.getFirst())
    def udesc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
    def desc:RangerAppClassDesc (unwrap udesc)
    def expects_error:boolean false
    def err_cnt:int (ctx.getErrorCount())
    if( node.hasBooleanProperty("error")) {
      expects_error = true
    } 
    ; print "childnode count : " + (size node.children)
    ; collect also the chain here..

    ; obj.foo() .bar() .foor2()
    ; --> obj.foo() will be the innerNode...


    def chlen (size node.children)

    if( chlen > 2) {
      def i 2
      def chainRoot:CodeNode (node)
      def innerNode@(weak):CodeNode
      def newNode (node.newExpressionNode())
      def sc (node.getSecond())
      newNode.add( (fnNode.copy()) )
      newNode.add( (sc.copy()) )
      innerNode = newNode

;       print "Chaining " + (node.getCode())

      def chain_cnt 0
      def b_valid true
      ; push the first into bottom of stack
      ; obj.foo.something ()
      while ( i < (chlen - 1) ) {
        def fc (at node.children i)
        def args@(lives) (at node.children (i + 1))
        def name (fc.vref)
        if( ( (strlen name) > 0 ) && ( ( charAt name 0) == (charcode ".")) ) {
          def method_name (substring name 1 (strlen name))
          def newNode (node.newExpressionNode())
          newNode.add( (node.newVRefNode("call") ) ) 
          newNode.add( (innerNode.copy() ) )
          newNode.add( (node.newVRefNode(method_name)) )
          newNode.add( (args.copy()))
          innerNode = newNode
          chain_cnt = chain_cnt + 1
        } {
          b_valid = false
          ; ctx.addError(node "Invalid chaining op")
        }
        i = i + 2
      }
      if ( b_valid && (chain_cnt > 0 ) ) {
        node.getChildrenFrom( (unwrap innerNode ) )
        node.tag = "chainroot"
        node.flow_done = false
        this.WalkNode( node ctx wr)
        return true
      }
    }

    if ((size fnNode.ns) > 1) {

      def rootName (at fnNode.ns 0)
      def vDef2 (ctx.getVariableDef(rootName))
      if( (rootName != "this") && (vDef2.init_cnt == 0) && (vDef2.set_cnt == 0) ) {
        if( (vDef2.is_class_variable == false ) && ( (ctx.isDefinedClass(rootName)) == false ) ) {
          ctx.addError( node ('Call to uninitialized object ' + rootName) )
        }
      }
      def vFnDef@(optional):RangerAppFunctionDesc (this.findFunctionDesc(fnNode ctx wr))

      if (!null? vFnDef) {

        if(vFnDef.nameNode.hasFlag("throws")) {
          if(false == (ctx.isTryBlock()) ) {
            ctx.addError(node ('The method ' + vFnDef.name + " potentially throws an exception, try { } block is required"))
          }
        }

        def currM@(lives) (ctx.getCurrentMethod())
        currM.addCallTo( (unwrap vFnDef) )


        vFnDef.ref_cnt = (vFnDef.ref_cnt + 1)
        def subCtx:RangerAppWriterContext (ctx.fork())
        node.hasFnCall = true
        node.fnDesc = vFnDef
        def p@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
        p.name = fnNode.vref
        p.value_type = fnNode.value_type
        p.node = fnNode
        p.nameNode = fnNode
        p.varType = RangerContextVarType.Function
        subCtx.defineVariable(p.name p)
        this.WalkNode(fnNode subCtx wr)
        def callParams:CodeNode (at node.children 1)
        def keyword_cnt 0 
        vFnDef.params.forEach({
          if(item.nameNode.hasFlag('keyword')) {
            keyword_cnt = keyword_cnt + 1
            ( (at callParams.children index) .setFlag('keyword'))
          }
        })
        def nodeList:[CodeNode] (this.transformParams( callParams.children vFnDef.params subCtx))
        if(ctx.hasCompilerFlag('dbg')) {
          print "Local: " + vFnDef.name
        }
              
        for nodeList arg:CodeNode i {
          ; expression as parameter is a lambda 
          ctx.setInExpr()
          def was_lambda false
          if(arg.isFirstVref("fun")) {
            arg.flow_done = false
            arg.forTree({
              item.flow_done = false
            })
            was_lambda = true
          }       
          this.WalkNode(arg subCtx wr)

          if was_lambda {
            def currM@(lives) (ctx.getCurrentMethod())
            if(!null? arg.lambdaFnDesc) {
              vFnDef.addCallTo( (unwrap arg.lambdaFnDesc))
              currM.addCallTo( (unwrap vFnDef ) )
              push currM.myLambdas (unwrap arg.lambdaFnDesc)
              push vFnDef.myLambdas (unwrap arg.lambdaFnDesc)
            }
            arg.forTree({
              if(!null? item.lambdaFnDesc) {
                item.lambdaFnDesc.insideFn = currM
              }
              if(!null? item.fnDesc) {
                if(!null? arg.lambdaFnDesc) {
                  arg.lambdaFnDesc.addCallTo( (unwrap item.fnDesc) )
                } 
                vFnDef.addCallTo( (unwrap item.fnDesc ) )
              }
            })
          }       
          ctx.unsetInExpr()
          if( (size vFnDef.params) > i) {
            def fnArg:RangerAppParamDesc (at vFnDef.params i)
            def callArgP:RangerAppParamDesc arg.paramDesc
            if (!null? callArgP) {
              callArgP.moveRefTo(node fnArg ctx)
            }
          }
        }
        def cp_len:int ( (size callParams.children) - keyword_cnt )
        if( cp_len > ( size vFnDef.params )) {
          def lastCallParam:CodeNode (at callParams.children (cp_len - 1))
          ctx.addError( lastCallParam "Too many arguments for function")
          ctx.addError( (unwrap vFnDef.nameNode) "NOTE: To fix the previous error: Check original function declaration which was")
        }
        for vFnDef.params param:RangerAppParamDesc i {
          if( (size callParams.children) <= i) {
            if (param.nameNode.hasFlag("default")) {
              continue 
            }
            ctx.addError(node "Missing arguments for function")
            ctx.addError( (unwrap param.nameNode) "NOTE: To fix the previous error: Check original function declaration which was")
            break
          }
          if( param.nameNode.hasFlag('keyword')) {
            continue
          }
          def argNode:CodeNode (at callParams.children i)
          if (false == (this.areEqualTypes( (unwrap param.nameNode) argNode ctx wr))) {
            ctx.addError(argNode ('ERROR, invalid argument type for method ' + vFnDef.name))
          }
          def pNode:CodeNode (unwrap param.nameNode)
          if( pNode.hasFlag('optional')) {
            if ( false == (argNode.hasFlag('optional')) ) {
               ctx.addError(node ( 'function parameter optionality does not match, consider making parameter optional ' + (argNode.getCode())) )          
            }
          }
          if( argNode.hasFlag('optional')) {
            if ( false == (pNode.hasFlag('optional')) ) {
               ctx.addError(node ( 'function parameter optionality does not match, consider unwrapping ' + (argNode.getCode())) )          
            }
          }
        }
        def nn:CodeNode vFnDef.nameNode
        node.eval_type = (nn.typeNameAsType(ctx))
        node.eval_type_name = nn.type_name
        node.eval_array_type = nn.array_type
        node.eval_key_type = nn.key_type

        if(node.eval_type == RangerNodeType.ExpressionType) {
          node.expression_value = (nn.expression_value.copy())
        }

        if(nn.hasFlag("optional")) {
          node.setFlag("optional")
        }

        if(expects_error) {
          def cnt_now:int (ctx.getErrorCount())
          if (cnt_now == err_cnt) {
            ctx.addParserError( node "LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt + " : " +cnt_now)
          }
        } {
          def cnt_now:int (ctx.getErrorCount())
          if (cnt_now > err_cnt) {
            ctx.addParserError( node "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt + " : " +cnt_now)
          }      
        }
        return true
      } {
        ctx.addError(node "Called Object or Property was not defined")
      }
    }
    if (desc.hasMethod(fnNode.vref)) {
      def fnDescr@(optional):RangerAppFunctionDesc (desc.findMethod(fnNode.vref))


      if(fnDescr.nameNode.hasFlag("throws")) {
        if(false == (ctx.isTryBlock()) ) {
          ctx.addError(node ('The method ' + fnDescr.name + " potentially throws an exception, try { } block is required"))
        }
      }

      def currM (ctx.getCurrentMethod())
      currM.addCallTo( (unwrap fnDescr) )

      if(ctx.hasCompilerFlag('dbg')) {
        print "Local 2 : " + fnDescr.name
      }


      def subCtx:RangerAppWriterContext (ctx.fork())
      node.hasFnCall = true
      node.fnDesc = fnDescr
      def p@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
      p.name = fnNode.vref
      p.value_type = fnNode.value_type
      p.node = fnNode
      p.nameNode = fnNode
      p.varType = RangerContextVarType.Function
      subCtx.defineVariable(p.name p)
      this.WalkNode(fnNode subCtx wr)
      for node.children arg:CodeNode i {
        if (i < 1) {
          continue _
        }
        ctx.setInExpr()
        this.WalkNode(arg subCtx wr)
        ctx.unsetInExpr()
      }
      for fnDescr.params param:RangerAppParamDesc i {
        if( (size node.children) <= (i + 1)) {
          ctx.addError(node "Argument was not defined")
          break
        }
                
        def argNode:CodeNode (at node.children (i + 1))
        if (false == (this.areEqualTypes( (unwrap param.nameNode) argNode ctx wr))) {
          ctx.addError(argNode ('ERROR, invalid argument type for ' + desc.name + ' method ' + fnDescr.name))
        }
      }
      def nn:CodeNode fnDescr.nameNode
      nn.defineNodeTypeTo(node ctx)
      if(expects_error) {
        def cnt_now:int (ctx.getErrorCount())
        if (cnt_now == err_cnt) {
          ctx.addParserError( node "LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt + " : " +cnt_now)
        }
      } {
        def cnt_now:int (ctx.getErrorCount())
        if (cnt_now > err_cnt) {
          ctx.addParserError( node "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt + " : " +cnt_now)
        }      
      }      
      return true
    } 

    ; TODO: first lambda call check comes here... continue to other variants later
    if (ctx.isVarDefined(fnNode.vref)) {
        def d (ctx.getVariableDef(fnNode.vref))

        d.ref_cnt = (1 + d.ref_cnt)

        if( d.nameNode.hasFlag('optional')) {
          ctx.addError( node 'Can not call optional lambda function, unwrap the function first!')
        }

        if(d.nameNode.value_type == RangerNodeType.ExpressionType) {

          def cnNode1 (at node.children 0)
          this.WalkNode(cnNode1 ctx wr)

          def lambdaDefArgs (at d.nameNode.expression_value.children 1)
          def callParams:CodeNode (at node.children 1)
          
          for callParams.children arg:CodeNode i {
            ctx.setInExpr()
            this.WalkNode(arg ctx wr)
            ctx.unsetInExpr()
          }

          this.testLambdaCallArgs( (unwrap d.nameNode.expression_value) callParams ctx wr)

          def lambdaDef (at d.nameNode.expression_value.children 0)
          node.has_lambda_call = true
          node.eval_type = (lambdaDef.typeNameAsType(ctx))
          node.eval_type_name = lambdaDef.type_name
          node.eval_array_type = lambdaDef.array_type
          node.eval_key_type = lambdaDef.key_type

          if(node.eval_type == RangerNodeType.ExpressionType) {
            if(!null? lambdaDef.expression_value) {
              node.expression_value = (lambdaDef.expression_value.copy())
            }
          }
        
          return true
        })
    }
    return false
; -------------------------------------------------
    ctx.addError(node ('ERROR, could not find class ' + desc.name + ' method ' + fnNode.vref))
    ctx.addError(node ('definition : ' + (node.getCode())))
    if(expects_error) {
      def cnt_now:int (ctx.getErrorCount())
      if (cnt_now == err_cnt) {
        ctx.addParserError( node "LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt + " : " +cnt_now)
      }
    } {
      def cnt_now:int (ctx.getErrorCount())
      if (cnt_now > err_cnt) {
        ctx.addParserError( node "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt + " : " +cnt_now)
      }      
    }      
    return false
  }

  ; obj.firstChild.name = "name of firstChild"
  ; obj = (call obj set_firstChild ( (call obj.firstChild set_name ("name of firstChild")) ))
  fn transformImmutableAssigment:CodeNode (node:CodeNode) {

    def target (node.getSecond())         ;  obj.firstChild.name
    def assign_value (node.getThird())    ; "name of firstChild"
    def root (node.newExpressionNode())

    root.add( (node.newVRefNode("=")))
    root.add( (node.newVRefNode( (at target.ns 0)  ))) ; obj

    def i 1
    def cnt (size target.ns)
    def valueExpression (node.newExpressionNode())
    def obj_ref (at target.ns 0)
    def currentParent@(weak temp) root
    while( i < cnt ) {
      def callExpr@(lives) (node.newExpressionNode())  
      callExpr.add( (node.newVRefNode("call")))
      callExpr.add( (node.newVRefNode(obj_ref)))
      def next_ref (at target.ns (i))
      def set_ref ("set_" + next_ref )
      callExpr.add( (node.newVRefNode(set_ref)))       
      i = i + 1
      if( i < cnt ) {
        obj_ref = obj_ref + "." + next_ref
        def paramsNode (node.newExpressionNode())
        paramsNode.add(callExpr)
        currentParent.add( paramsNode )  
        currentParent = callExpr      
      } {
        def callParams (node.newExpressionNode())
        callParams.add((assign_value.copy()))
        callExpr.add( callParams )
        def paramsNode (node.newExpressionNode())
        paramsNode.add( (callExpr.copy()) )
        currentParent.add( paramsNode )          
      }
    }
    return root
  }

  fn cmdAssign:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    def target:CodeNode (node.getSecond())
    this.WalkNode(target ctx wr)

    ; immutable check which denies assigent operation
    if(target.hasParamDesc) {
      if( !null? target.paramDesc.propertyClass) {
        def nn (unwrap target.paramDesc.propertyClass.nameNode)
        if(nn.hasFlag("immutable")) {

          def do_transform false
          def propC (target.paramDesc.propertyClass)
          def currC (ctx.getCurrentClass())
          if( (unwrap currC) == (unwrap propC) ) {
            if( (at target.ns 0) == "this" ) {
              ; ctx.addError( node "Assigment to immutable class this variable")            
              do_transform = true
            }
          } {
            ; ctx.addError( node "Assigment to immutable class node")
            do_transform = true
          }

          if do_transform {

            def n1:CodeNode (node.getSecond())
            def n2:CodeNode (node.getThird())
            this.WalkNode(n1 ctx wr)
            ctx.setInExpr()
            this.WalkNode(n2 ctx wr)
            ctx.unsetInExpr()

            this.convertToUnion( n1.eval_type_name n2 ctx wr) 
            ; --> should test here
            this.shouldBeEqualTypes( n1 n2 ctx "Can not assign variable.")

            def immAss (this.transformImmutableAssigment(node))
            ; print "immutable assigment => " + (immAss.getCode())
            node.getChildrenFrom( immAss )
            ; print "eventual assigment => " + (node.getCode())
            this.cmdAssign( node ctx wr)
            return
          } 
        }
      }
    }

    def chlen (size node.children)
    wr.newline()
    def n1:CodeNode (node.getSecond())
    def n2:CodeNode (node.getThird())
    this.WalkNode(n1 ctx wr)
    ctx.setInExpr()
    this.WalkNode(n2 ctx wr)
    ctx.unsetInExpr()
    if n1.hasParamDesc {
      n1.paramDesc.ref_cnt = (n1.paramDesc.ref_cnt + 1)
      n1.paramDesc.set_cnt = (n1.paramDesc.set_cnt + 1)
    }
    if n2.hasParamDesc {
      n2.paramDesc.ref_cnt = (n2.paramDesc.ref_cnt + 1)
    }
    if (n2.hasFlag("optional")) {
      if (false == (n1.hasFlag("optional"))) {
        ctx.addError(node "Can not assign optional to non-optional type")
      }
    }
    this.stdParamMatch(node ctx wr true)
    this.convertToUnion( n1.eval_type_name n2 ctx wr) 
    this.shouldBeEqualTypes( n1 n2 ctx "Can not assign variable.")
  }
  fn EnterTemplateClass:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  
  }

  fn EnterClass:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def body_index ( (node.chlen())  - 1)
    if( (size node.children) != 3) {
      if( (node.chlen()) == 5 ) {

      } {
        ctx.addError(node "Invalid class declaration")
        return
      }
    }
    if(node.hasBooleanProperty("trait")) {
      return
    }
    def cn:CodeNode (at node.children 1)
    def cBody:CodeNode (at node.children body_index)
    def desc@(lives):RangerAppClassDesc (ctx.findClass(cn.vref))
    def subCtx:RangerAppWriterContext (unwrap desc.ctx)

    subCtx.setCurrentClass(desc)
    subCtx.class_level_context = true
    for desc.variables p:RangerAppParamDesc i {
      def vNode:CodeNode p.node
      if ((size vNode.children) > 2) {
        def value:CodeNode (at vNode.children 2)
        ctx.setInExpr()
        this.WalkNode(value ctx wr)
        ctx.unsetInExpr()
      }
      p.is_class_variable = true
      p.nameNode.eval_type = (p.nameNode.typeNameAsType(ctx))
      p.nameNode.eval_type_name = p.nameNode.type_name
    }

    for cBody.children fNode:CodeNode i {
      if ((fNode.isFirstVref("fn")) || (fNode.isFirstVref("constructor")) || (fNode.isFirstVref("Constructor"))) {
        this.WalkNode(fNode subCtx wr)
      }
    }
    for cBody.children fNode:CodeNode i {
      if ((fNode.isFirstVref("fn")) || (fNode.isFirstVref("PublicMethod"))) {
        this.WalkNode(fNode subCtx wr)
      }
    }
    def staticCtx:RangerAppWriterContext (ctx.fork())
    staticCtx.setCurrentClass(desc)
    for cBody.children fNode:CodeNode i {
      if ((fNode.isFirstVref("sfn")) || (fNode.isFirstVref("StaticMethod")) || (fNode.isFirstVref("static"))) {
        this.WalkNode(fNode staticCtx wr)
      }
    }

    cBody.children.forEach({
      try {
        if( item.isFirstVref('doc')) {
          def sc (item.getSecond())
          def fndesc (desc.findMethod(sc.vref))
          if (fndesc) {
            def third (item.getThird())
            fndesc.git_doc = third.string_value
          }
        }
      } {

      }
    })
    node.hasClassDescription = true
    node.clDesc = desc
    desc.classNode = node
  }
  

  fn walkFunctionBody (m@(lives):RangerAppFunctionDesc fnBody:CodeNode ctx:RangerAppWriterContext subCtx:RangerAppWriterContext wr:CodeWriter) {
    def prev_fnc subCtx.function_level_context
    def prev_isfn subCtx.is_function 
    subCtx.function_level_context = true
    subCtx.is_function = true
    subCtx.currentMethod = m
    for m.params v@(lives):RangerAppParamDesc i {
      if( false == (subCtx.isVarDefined(v.name)) ) {
        subCtx.defineVariable(v.name v)
      }
      v.nameNode.eval_type = (v.nameNode.typeNameAsType(subCtx))
      v.nameNode.eval_type_name = v.nameNode.type_name
      ctx.hadValidType( (unwrap v.nameNode) )

      if( (ctx.isDefinedClass(v.nameNode.type_name)) ) {
        def cl (ctx.findClass(v.nameNode.type_name))
        m.addClassUsage( cl ctx )
      }
      if( (ctx.isDefinedClass(v.nameNode.array_type)) ) {
        def cl (ctx.findClass(v.nameNode.array_type))
        m.addClassUsage( cl ctx )
      }      
    }
    subCtx.setInMethod()
    this.WalkNodeChildren(fnBody subCtx wr)
    subCtx.unsetInMethod()
    if (fnBody.didReturnAtIndex == -1) {
      if (m.nameNode.type_name != "void") {
          if( false == (ctx.getFlag("in_task")) ) {
            ctx.addError( (unwrap m.nameNode) "Function does not return any values!")
          }
      }
    } {
      if( (m.nameNode.type_name == "void") || ( (has m.nameNode.type_name) == false ) && ( (has m.nameNode.array_type) == false )  ) {
        if( false == (ctx.getFlag("in_task")) ) {
          def rvNode ( at fnBody.children fnBody.didReturnAtIndex)
          if( (size rvNode.children ) > 1) {
            ctx.addError( (unwrap m.nameNode) "No return value type defined for a function which returns value")
            ctx.addError( rvNode "Returning value from a function without set return value")
          }
        }
      }      
    }
    for subCtx.localVarNames n:string i {
      def p:RangerAppParamDesc (get subCtx.localVariables n)
      if (p.set_cnt > 0) {
          if(p.is_immutable) {
            ctx.addError( (unwrap p.nameNode) "Immutable variable was assigned a value")
          }        
          def defNode:CodeNode p.node
          defNode.setFlag("mutable")
          def nNode:CodeNode p.nameNode
          nNode.setFlag("mutable")
      }
    }      
;    subCtx.function_level_context = prev_fnc
;    subCtx.is_function = prev_isfn
  }

  fn EnterMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    this.EnterFn(node ctx wr {
      def m@(lives) (unwrap (desc.findMethod(nameNode.vref)))
      def subCtx:RangerAppWriterContext (unwrap m.fnCtx)
      this.walkFunctionBody( m fnBody ctx subCtx wr)      
    })
  }
  fn EnterStaticMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    this.EnterFn(node ctx wr {
      def m@(lives) (unwrap (desc.findStaticMethod(nameNode.vref)))
      def subCtx (ctx.fork())
      m.fnCtx = subCtx
      subCtx.in_static_method = true
      this.walkFunctionBody( m fnBody ctx subCtx wr)
      subCtx.in_static_method = false
    })
  }

  ; (=> _ * 10)
  ; (=> _1 + _2 * 10)
  ; (=> () )
  ; --->? 

  fn DefineArrowOpFn:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
    ; (# print '' + _1)
    def myName (ctx.createNewOpFnName())
    def argsNode (r.expression)
    def fBody (node.copy())
    remove fBody.children 0
    def opNode@(lives) (r.expression (r.vref 'defn') (r.vref myName ) argsNode fBody )

    ; (_arg1 _arg2)
    def setArg (fn:void (idx:int) {
      def i (size argsNode.children )
      while( i <= idx ) {
        push argsNode.children (r.vref (myName + '_arg' + i) )
        i = i + 1
      }
    })
    fBody.forTree({

      ; note: should be recursive...
      item.attrs.forEach({
        item.forTree({
          if(has item.vref) {
            if(item.vref == '_') {
              setArg(0)
              item.vref = (myName + '_arg0')
            }
            def parts (strsplit item.vref '_')
            if( (size parts) == 2) {
              def rest (at parts 1)
              def nbr (to_int rest)
              if(!null? nbr) {
                def n (unwrap nbr)
                setArg( (n - 1))
                item.vref = (myName + '_arg' + (n - 1))  
              }
            }
          }
        })
      }))
      
      if(has item.vref) {
        if(item.vref == '_') {
          setArg(0)
          item.vref = (myName + '_arg0')
        }
        def parts (strsplit item.vref '_')
        if( (size parts) == 2) {
          def rest (at parts 1)
          def nbr (to_int rest)
          if(!null? nbr) {
            def n (unwrap nbr)
            setArg( (n - 1))
            item.vref = (myName + '_arg' + (n - 1))  
          }
        }
      }
    })
    ctx.addOpFn( myName opNode )
    clear node.children
    node.vref = myName
    node.expression = false
  }
  
  fn DefineOpFn:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    ; defn inc (x) (x + 1)
    if( (size node.children ) < 4) {
      ctx.addError(node 'invalid operator function')
      return
    }
    def fnName (at node.children 1)
    if(! (has fnName.vref)) {
      ctx.addError(node 'operator function has no name')
      return      
    }
    ; print "OP -> " + (node.getCode())
    ctx.addOpFn( fnName.vref node )
    ; set ctx.opFns fnName.vref node 
    node.disabled_node = true
    node.flow_done = true
  }

  ; returns the evaluated codenodes for the parameters in this compilation...
  fn testCompile@(weak):[string:CodeNode] (opFn:CodeNode node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
    def ok false
    def rootCtx (ctx.getRoot())
    def errCnt (size rootCtx.compilerErrors)

    def opParams (at opFn.children 2)
    def opBody (at opFn.children 3)
    def xValue (node.copy())
    remove xValue.children 0  ; (inc 1) -> (1)

    ; collect the actual function parameters so that they can be placed
    ; into registers...
    def regToArg@(weak lives):[string:CodeNode]
    def am@(lives) (new RangerArgMatch)
    opParams.parallelTree( xValue {
      if( (!null? left) && (!null? right) ) {
        if(has left.vref) {
          def v (unwrap right)
          if v.expression  {
            set regToArg left.vref (unwrap right) 
          }
          set am.nodes left.vref (unwrap right) 
        }
      }
    })

    ; print "xValue " + (xValue.getCode())
    ; print "params " + (opParams.getCode())
    def opParamSet:[string:boolean]
    def regParams:[string:boolean]
    def regNames:[string:string]
    ; IMPORTANT: do not process if this node has already been made to register
    if(! ( has node.register_name ) ) {
      opBody.forTree({
        if(has regToArg item.vref) {
          if(has opParamSet item.vref) {
            if(! (has regParams item.vref) ) {
              def realArg (unwrap (get regToArg item.vref))
              if( has realArg.register_name ) {

              } {
                def regName = (ctx.createNewRegName())
                set regNames item.vref regName
                def argCopy (realArg.copy())
                def regExpr (r.expression (r.vref 'def') (r.vref regName) argCopy)
                this.WalkNode( regExpr ctx wr )
                def regArg (at regExpr.children 1)
                def realRegName ( (at regExpr.children 1) .paramDesc.compiledName ) 
                regArg.paramDesc.set_cnt = 1
                regArg.paramDesc.ref_cnt = 1

                def BlockOP (ctx.getLastBlockOp())
                BlockOP.register_expressions.push( regExpr )

                ; realArg.register_expressions.push( regExpr )
                realArg.register_name = regName
                realArg.reg_compiled_name = realRegName            
              }

            }
            set regParams item.vref true
          }
          set opParamSet item.vref true
        }
      })
    }

    def bodyCopy (opBody.copy())

    def newNode (opBody.rebuildWithType(am true))

    clear node.children
    forEach newNode.children {
      def tmp@(lives) item
      push node.children tmp
    }
    ; node.getChildrenFrom( newNode )
    node.flow_done = false

    if(opBody.is_block_node) {
      print "Block -> " + (opBody.getCode())
      def blockCtx (ctx.fork())
      blockCtx.newBlock()
      this.WalkNode( node blockCtx wr )
    } {
      this.WalkNode( node ctx wr )
    }

    ;; -- test compile cutted part was here

    ; am.nodes.forEach({
    ;   print " - " + index + " --> " + item.eval_type
    ; })

    return am.builtNodes
  }

  ; transforms a node
  ; origNode has the syntax (opname x y z)
  ; against given operator definition nodes in opFnList in format
  ;   defn someOp (x) (x + 1)
  ; 
  def infinite_recursion false
  def match_types:[string:string]

  fn TransformOpFn:void (opFnList:[CodeNode] origNode:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
    if infinite_recursion {
      return
    }
    def ok false
    def rootCtx (ctx.getRoot())
    def errCnt (size rootCtx.compilerErrors)

    def use_delta true

    def least_err_cnt 99999
    def least_errs:[RangerCompilerMessage]

    def depth (transaction_depth 'TransformOpFn' ctx)

    if( depth > 20 ) {
      ctx.addError( origNode 'Error: recursive operator function detected')
      infinite_recursion = true
      return
    }

    ; print "Depth : " + (transaction_depth 'TransformOpFn' ctx)

    if( has origNode.register_name ) {
      if( ctx.isVarDefined( origNode.register_name )) {
        def regInfo (ctx.getVariableDef(origNode.register_name))
        if(!null? regInfo.nameNode ) {
          origNode.copyEvalResFrom( (unwrap regInfo.nameNode) )
          return
        } {
          ; ctx.addError( origNode ('compiler error: could not find temporary register ' + origNode.register_name) )
        }
      } {
        ; ctx.addError( origNode ('compiler error: could not find temporary register ' + origNode.register_name) )
      }
      ; return
    }

    def fc (at origNode.children 0)
    ; print "--> " + fc.vref + ", depth : " + (transaction_depth 'TransformOpFn' ctx)
    ; print (origNode.getCode())
    def myT (start_transaction 'TransformOpFn' fc.vref ctx) 

    def newOps:[CodeNode]

    def tryTypes ([] 'string' 'int' 'double' 'boolean')

    def codeStrHash (origNode.getSource())
    if( has match_types codeStrHash) {
      insert tryTypes 0 (unwrap (get match_types codeStrHash))    
    } 

    def cList (reverse ( (ctx.getRoot()) .getClasses()))
    cList.forEach({
      if( (item.isNormalClass()) || (item.is_system) ) {
        if( (indexOf codeStrHash item.name) >= 0) {
          insert tryTypes 0 item.name
        } {
          push tryTypes item.name
        }
      }
    })

    ; print codeStrHash
    ; print "try order : " + (join tryTypes ",")

    opFnList.forEach({
      def had_v false
      item.forTree({
        if(item.array_type == '?' || item.key_type == '?' || item.type_name == '?') {
          had_v = true
        }
      })
      if had_v {

        def opFn (item.copy())
        def opParams (at opFn.children 2)
        def opBody (at opFn.children 3)
        
        def typeName ""
        tryTypes.forEach({
          def copyOfFn (opFn.copy())
          typeName = item
          copyOfFn.forTree({
            if(item.array_type == '?') {
              item.array_type = typeName
            }
            if(item.key_type == '?') {
              item.key_type = typeName
            }
            if(item.type_name == '?') {
              item.type_name = typeName
            }
          })
          copyOfFn.matched_type = typeName
          push newOps copyOfFn
        })
      }

    })

    if( (size newOps) > 0) {
      ; print "now has " + (size newOps) + " variants "
      forEach newOps {
        def tmp@(temp) item
        push opFnList item
      }
    }

    def oNodeParams (size origNode.children)
    filter opFnList {
      def opParams (at item.children 2)
      return (oNodeParams == ( (size opParams.children) - 1) )
    }

    opFnList.forEach({
      if ok {
        return
      } {
        ; if last round did not work, try again...
        def currentErrCnt (size rootCtx.compilerErrors)
        def errDelta ( currentErrCnt - errCnt )
        if( errDelta > 0) {
          if( errDelta < least_err_cnt ) {
            least_err_cnt = errDelta
            def i errCnt 
            clear least_errs
            while( i < currentErrCnt) {
              def tmp@(temp) (at rootCtx.compilerErrors i)
              push least_errs tmp
              i = i + 1
            }
          }
          def i errCnt 
          while( i < currentErrCnt) {
            removeLast rootCtx.compilerErrors
            i = i + 1
          }
        }
      }

      def originalOpFn item
      def node (origNode.copy())
      def opFn item
      def opParams (at opFn.children 2)
      def opBody (at opFn.children 3)
      def xValue (node.copy())
      remove xValue.children 0  ; (inc 1) -> (1)

      opBody.forTree({
        if(item.vref == 'return') {
          ; ctx.addError( item 'Return keyword is not allowed in defn macros')
        }
      })

      ; collect the actual function parameters so that they can be placed
      ; into registers...
      def regToArg@(weak):[string:CodeNode]
      def am@(lives) (new RangerArgMatch)
      opParams.parallelTree( xValue {
        if( (!null? left) && (!null? right) ) {
          if(has left.vref) {
            def v (unwrap right)
            if v.expression  {
              set regToArg left.vref (unwrap right) 
            }
            set am.nodes left.vref (unwrap right) 
          }
        }
      })

      ; print "xValue " + (xValue.getCode())
      ; print "params " + (opParams.getCode())
      def opParamSet:[string:boolean]
      def regParams:[string:boolean]
      def regNames:[string:string]

      def BlockOP (ctx.getLastBlockOp())
      def newDefNodes:[CodeNode]
      def newRNodes:[CodeNode]

      ; IMPORTANT: do not process if this node has already been made to register
      if(! ( has node.register_name ) ) {
        opBody.forTree({
          if(has regToArg item.vref) {
            if(has opParamSet item.vref) {
              if(! (has regParams item.vref) ) {
                def realArg (unwrap (get regToArg item.vref))
                if( has realArg.register_name ) {

                } {
                  
                  def regName = (ctx.createNewRegName())
                  set regNames item.vref regName
                  def argCopy (realArg.copy())
                  def regExpr@(temp lives) (r.expression (r.vref 'def') (r.vref regName) argCopy)

                  ; *** Walk the Def and move expressions which are dynamically created into newRNodes
                  ; list so that we can decide if this compilation was a test run prevent those lines
                  ; to be added 
                  def cnt (size BlockOP.register_expressions)
                  ; ctx.setTestCompile()

                  this.WalkNode( regExpr ctx wr )
                  ; ctx.unsetTestCompile()
                  def opCntDelta ((size BlockOP.register_expressions) - cnt)

                  if(use_delta && opCntDelta > 0 ) {
                    def opCnt (size BlockOP.register_expressions)
                    def i cnt
                    while( i < opCnt ) {
                      def tmp@(temp) (at BlockOP.register_expressions i)
                      push newRNodes tmp
                      i = i + 1
                    }
                    i = cnt
                    while( i < opCnt ) {
                      removeLast BlockOP.register_expressions
                      i = i + 1
                    }
                  }

                  def regArg (at regExpr.children 1)
                  def realRegName ( (at regExpr.children 1) .paramDesc.compiledName ) 
                  regArg.paramDesc.set_cnt = 1
                  regArg.paramDesc.ref_cnt = 1
                  
                  if use_delta {
                    push newRNodes regExpr
                  } {
                    def BlockOP (ctx.getLastBlockOp())
                    BlockOP.register_expressions.push( regExpr )
                  }
                  realArg.register_name = regName
                  realArg.reg_compiled_name = realRegName            
                }

              }
              set regParams item.vref true
            }
            set opParamSet item.vref true
          }
        })
      }

      def newNode (opBody.rebuildWithType(am true))
      node.getChildrenFrom( newNode )
      node.flow_done = false

      ; if( (size xValue.children ) != (size opParams.children) ) {
      ;  ctx.addError( origNode 'Invalid arg count')
      ;}

      ctx.setTestCompile()

      if(opBody.is_block_node) {
        ; print "Block -> " + (opBody.getCode())
        def blockCtx (ctx.fork())
        blockCtx.newBlock()
        this.WalkNode( node blockCtx wr )
      } {
        this.WalkNode( node ctx wr )
      }

      if( errCnt == (size rootCtx.compilerErrors) ) {
        ctx.unsetTestCompile()

        if(has originalOpFn.matched_type) {
          set match_types codeStrHash originalOpFn.matched_type
          ; print "--> had matched type " + originalOpFn.matched_type
          ; origNode.matched_type = originalOpFn.matched_type
        }

        ; matched_type

        if(! (ctx.isTestCompile() ) ) {
          forEach newDefNodes {
            def tmp@(temp) item
            push BlockOP.register_expressions tmp
          }
          forEach newRNodes {
            def tmp@(temp) item
            push BlockOP.register_expressions tmp
          }
        }
        
        ok = true
        def newNode (opBody.rebuildWithType(am true))
        origNode.getChildrenFrom( newNode )
        origNode.flow_done = false
        if(opBody.is_block_node) {
          def blockCtx (ctx.fork())
          blockCtx.newBlock()
          this.WalkNode( origNode blockCtx wr )
          def lastLine (last origNode.children)

          if( (lastLine.isFirstVref('ret')) || (has lastLine.eval_array_type ) || ( (has lastLine.eval_type_name) && (lastLine.eval_type_name != 'void') ) ) {


            def argVal (at lastLine.children 1)

            this.WalkNode( argVal blockCtx wr )

            ; print "arg val --> " + (argVal.getCode()) + " reg " + argVal.register_name
            origNode.copyEvalResFrom( argVal )

            def regName = (ctx.createNewRegName())
            set regNames item.vref regName
            def argCopy (argVal.copy())
            def nameNode (r.vref regName)
            
            nameNode.value_type = origNode.eval_type 
            nameNode.type_name = origNode.eval_type_name
            nameNode.array_type = origNode.eval_array_type
            nameNode.key_type = origNode.eval_key_type 

            if(argVal.eval_type == RangerNodeType.ExpressionType) {
              if(!null? argVal.expression_value) {
                nameNode.expression_value = (argVal.expression_value.copy())
              } {
                nameNode.expression_value = (argVal.copy())
              }
            }
            ;if(!null? argVal.expression_value) {
            ;  nameNode.expression_value = (argVal.expression_value.copy())
            ;}

            ; note: must set this flag to force unwrap, otherwise the node will be optional
            nameNode.setFlag('unwrap')

            def regExpr (r.expression (r.vref 'def') nameNode)

            ; print "Defining " + (regExpr.getCode()) + " <- " + regName
            ; print "Depth : " + (transaction_depth 'TransformOpFn' ctx)
            
            this.WalkNode( regExpr ctx wr )
            def regArg (at regExpr.children 1)
            def realRegName ( (at regExpr.children 1) .paramDesc.compiledName ) 
            regArg.paramDesc.set_cnt = 1
            regArg.paramDesc.ref_cnt = 1

            def BlockOP (ctx.getLastBlockOp())
            if(! (ctx.isTestCompile() ) ) {
              ; print "adding regExpr to block " + (BlockOP.getCode())
            }

            ; realArg.register_expressions.push( regExpr )
            origNode.register_name = regName
            origNode.reg_compiled_name = realRegName            
            
            lastLine.flow_done = false
            clear lastLine.children
            lastLine.getChildrenFrom( (r.expression (r.vref '=') (r.vref regName) argCopy ) )

            def regE (at regExpr.children 1)
            ; print "Defining 'lastline' -> " + (lastLine.getCode()) + " <- " + regName
            
            this.WalkNode( lastLine blockCtx wr)

            ;; def nn (blockCtx.getVariableDef(regName))

            ;; print "regname --> " + (nn.getCode())


            def myBlock (r.expression)
            myBlock.getChildrenFrom( origNode )
            if(! (ctx.isTestCompile() ) ) {
              insert myBlock.children 0 regExpr
              ; push myBlock.register_expressions regExpr 
              push BlockOP.register_expressions myBlock
            }
            clear origNode.children
            origNode.flow_done = true
          }
        } {
          this.WalkNode( origNode ctx wr )
          origNode.flow_done = true
        }
      } {
        ctx.unsetTestCompile()
      }
 
    })

    def depth (transaction_depth 'TransformOpFn' ctx)

    def errDelta ( (size rootCtx.compilerErrors) - errCnt )
    def currentErrCnt (size rootCtx.compilerErrors)
    def errDelta ( currentErrCnt - errCnt )
    if( errDelta > 0 ) {
      if( errDelta < least_err_cnt ) {
        def i errCnt 
        clear least_errs
        while( i < currentErrCnt) {
          def tmp@(temp) (at rootCtx.compilerErrors i)
          push least_errs tmp
          i = i + 1
        }
      }
      def i errCnt 
      while( i < currentErrCnt) {
        removeLast rootCtx.compilerErrors
        i = i + 1
      }
    }

    if(errDelta > 0 ) {
      least_errs.forEach({
        def tmp@(temp) item
        push rootCtx.compilerErrors tmp
      })
      print "^ had errors..."
      ctx.addError( origNode 'Could not find suitable match for the operator node' )
    }

    if infinite_recursion {
      ctx.addError( origNode 'Error: max recursiion depth of > 20 for inline operators detected')
    }

    end_transaction myT
    
    
  }

  fn cmdArray:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    ; ([] _:int (2 3 4 5))
    if( (size node.children ) == 3 ) {
      def sc (node.getSecond())
      if(  ( (strlen sc.vref) > 0 )  && ( (strlen sc.type_name ) > 0 ) ) {
        node.eval_array_type = sc.type_name
        node.eval_type = RangerNodeType.Array
        def items (node.getThird())
        def b_union false
        def union_types@(weak temp):[string]
        if( ctx.isDefinedClass( sc.type_name)) {
          def cl (ctx.findClass( sc.type_name))
          if(cl.is_union) {
            b_union = true
            union_types = cl.is_union_of
          }
        }
        def arrayItems (node.newExpressionNode())
        for items.children it:CodeNode i {
          def itemCopy (it.copy())
          this.WalkNode( itemCopy ctx wr )
          if( itemCopy.eval_type_name != sc.type_name ) {
            if( b_union ) {
              if( (indexOf union_types itemCopy.eval_type_name) >= 0 ) {
                ; OK 
              } {
                ctx.addError( it ( itemCopy.eval_type_name + " is Not part of union " + sc.type_name ) )
                break                
              }
            } {
              ctx.addError( it ( 'The array type should be ' + sc.type_name ) )
              break
            }
          }
          push arrayItems.children itemCopy
        }
        node.getChildrenFrom( arrayItems )
        node.is_array_literal = true
        return
      }
    }
    
    def arrayItems (node.newExpressionNode())
    def types:[string]
    for node.children it:CodeNode i {
      if( i == 0 ) {
        continue
      }
      def itemCopy (it.copy())
      this.WalkNode( itemCopy ctx wr )

      if( (indexOf types itemCopy.eval_type_name) < 0 ) {
        push types itemCopy.eval_type_name
      }
      push arrayItems.children itemCopy
    }
    def typeCnt ( size types )
    if( typeCnt == 0 ) {
      ctx.addError( node "Invalid array types")
      return
    }
    node.eval_type = RangerNodeType.Array
    if( ( size types ) > 1 ) {
      node.eval_array_type = "Any"
    } {
      node.eval_array_type = (at types 0) 
    }
    node.is_array_literal = true
    node.getChildrenFrom( arrayItems )
  }

  fn EnterLambdaMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    def args:CodeNode (at node.children 1)
    def body@(lives):CodeNode (at node.children 2)
    def subCtx:RangerAppWriterContext (ctx.fork())

    if(! args.expression ) {
      ctx.addError(node 'Invalid anonymous function: second param should be an expression')
    }

    ctx.incLambdaCnt()
    subCtx.is_capturing = true

    node.evalTypeClass = (TFactory.new_lambda_signature(node ctx wr))

    def currM@(lives) (ctx.getCurrentMethod())

    def cn:CodeNode (at node.children 0)
    def m@(lives):RangerAppFunctionDesc (new RangerAppFunctionDesc ())
    m.name = "lambda"
    m.node = node
    m.is_lambda = true
    m.nameNode = (at node.children 0)
    m.insideFn = currM

    subCtx.newBlock()
    currM.myLambdas.push( m )

    subCtx.is_function = true
    subCtx.currentMethod = m
;      m.fnCtx = subCtx
    if (cn.hasFlag("weak")) {
      m.changeStrength(0 1 node)
    } {
      m.changeStrength(1 1 node)
    }
    m.fnBody = (at node.children 2)
    for args.children arg@(lives):CodeNode ii {

      this.CheckTypeAnnotationOf( arg subCtx wr )
      
      def p2@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
      
      p2.name = arg.vref
      p2.value_type = arg.value_type
      p2.node = arg
      p2.nameNode = arg
      p2.init_cnt = 1
      p2.refType = RangerNodeRefType.Weak
      p2.initRefType = RangerNodeRefType.Weak
      if (args.hasBooleanProperty("strong")) {
        p2.refType = RangerNodeRefType.Strong
        p2.initRefType = RangerNodeRefType.Strong
      }
      p2.varType = RangerContextVarType.FunctionParameter
      push m.params p2
      arg.hasParamDesc = true
      arg.paramDesc = p2
      arg.eval_type = arg.value_type
      arg.eval_type_name = arg.type_name 
      if (arg.hasFlag("strong")) {
        p2.changeStrength(1 1 (unwrap p2.nameNode))
      } {
        arg.setFlag("lives")
        p2.changeStrength(0 1 (unwrap p2.nameNode))
      }           
      ; subCtx.hadValidType(p2.nameNode)
      subCtx.defineVariable(p2.name p2)
    }

    def cnt:int ( size body.children )
    ; def activeFn:RangerAppFunctionDesc (ctx.getCurrentMethod())

    for body.children item:CodeNode i {
      def tmp@(lives) item
      subCtx.lastBlockOp = tmp
      this.WalkNode(item subCtx wr)
      if( i == ( (size body.children ) - 1) ) {
          if( (size item.children ) > 0) {
            def fc (item.getFirst())
            if(fc.vref != "return") {
              cn.type_name = "void"
            }
          }
      }      
    }
    node.has_lambda = true
    node.lambda_ctx = subCtx
    node.eval_type = RangerNodeType.ExpressionType
    node.eval_function = node
    node.expression_value = (node.copy())
    node.lambdaFnDesc = m
    ; capture 2nd tier
    if((ctx.isCapturing())) {
      node.lambda_ctx.captured_variables.forEach({
        if( (ctx.isVarDefined(item)) ) {
          if ( (ctx.isLocalToCapture(item)) == false ) {
            ctx.addCapturedVariable( item )
          }
        }
      })
    }
  }

  ; myClass@(xxx)
  fn CheckVRefTypeAnnotationOf:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if(node.has_vref_annotation) {
      def tAnn (node.vref_annotation)
      if(false == (ctx.isDefinedClass(node.vref))) {
        ctx.addError(node ('Trait class ' + node.vref + ' is not defined'))
      } {
        def testC (ctx.findClass(node.vref))
        if(testC.is_trait) {
          if (testC.node.hasExpressionProperty("params")) {
            def params (testC.node.getExpressionProperty("params"))

            def cnt (size tAnn.children)
            def tstr ""
            for tAnn.children ch:CodeNode i {
              this.CheckVRefTypeAnnotationOf( ch ctx wr ) 
              tstr = tstr + "_" + ch.vref
            }
            def my_class_name ( testC.name + tstr)
            def ann (unwrap tAnn)
            ctx.createTraitInstanceClass( testC.name my_class_name ann this wr )
            node.vref = my_class_name
            node.has_vref_annotation = false
            return true
          }
        }
      }
    }    
    return false
  }

  ; def xxx:vectorOf@(int)
  fn CheckTypeAnnotationOf:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if(node.has_type_annotation) {
      def tAnn (node.type_annotation)
      if(false == (ctx.isDefinedClass(node.type_name))) {
        ctx.addError(node ('Trait class ' + node.type_name + ' is not defined'))
      } {
        def testC (ctx.findClass(node.type_name))
        if(testC.is_trait) {
          if (testC.node.hasExpressionProperty("params")) {
            def params (testC.node.getExpressionProperty("params"))

            def cnt (size tAnn.children)
            def tstr ""
            for tAnn.children ch:CodeNode i {
              this.CheckVRefTypeAnnotationOf( ch ctx wr ) 
              tstr = tstr + "_" + ch.vref
            }
            def my_class_name ( testC.name + tstr)
            def ann (unwrap tAnn)
            ctx.createTraitInstanceClass( testC.name my_class_name ann this wr )
            node.type_name = my_class_name
            node.has_type_annotation = false
            return true
          }
        }
      }
    }    
    return false
  }


  fn matchNode:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (0 == (size node.children)) {
      return false
    }
    def fc:CodeNode (node.getFirst())
    stdCommands = (ctx.getStdCommands())
    def op_list (ctx.getOperators(fc.vref))
    for op_list cmd:CodeNode i {
      def cmdName:CodeNode (cmd.getFirst())
      if (cmdName.vref == fc.vref && (! (ctx.isVarDefined(cmdName.vref)))) {
        this.stdParamMatch(node ctx wr true)
        if (!null? node.parent) {
          ; node.parent.copyEvalResFrom(node)
        }
        return true
      }
    }
    ; convert into  a call because it handles the lambda functions correctly
    if( ( (size fc.ns) > 1 ) && ( ( size node.children) > 1) ) {
      def possible_cmd (last fc.ns)
      def op_list (ctx.getOperators(possible_cmd))

      if( (has op_list) ) {
;       for op_list cmd:CodeNode i {
        
        ;def m (new RangerArgMatch)        
        ;def altVersion ( node.rebuildWithType (m false) )
        ;def origCopy  ( node.rebuildWithType (m false) )

        def args (node.getSecond())
        def nn (fc.copy())
        removeLast nn.ns

        def objName (join nn.ns ".")

        def newNode (node.newExpressionNode())
        newNode.add( ( node.newVRefNode("call")) )
        newNode.add( ( node.newVRefNode(objName)) )
        newNode.add( ( node.newVRefNode(possible_cmd)))
        newNode.add( ( args.copy()))
        node.getChildrenFrom( newNode )

        if( ( (ctx.expressionLevel()) == 0 ) ) {
          ctx.lastBlockOp = node
        }

        node.flow_done = false
        this.WalkNode( node ctx wr)
        return true
     }
    }
    
    return false
  }
  fn StartWalk:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    ; walkAlso
    this.WalkNode(node ctx wr)
    for walkAlso ch:CodeNode i {
      this.WalkNode(ch ctx wr)
    }
  }
  

  fn clearImports:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    if (node.isFirstVref("Import")) {
      node.expression = true
      node.vref = ""
      removeLast node.children
      removeLast node.children
    } {
      for node.children item:CodeNode i {
        this.clearImports(item ctx wr)
      }
    }
  }

  fn mergeImports:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    def envOpt (ctx.getEnv())
    if(null? envOpt) {
      ctx.addError( node 'Environment not defined')
      return
    }
    def env (unwrap envOpt)
    
    if (node.isFirstVref("Import")) {
      def fNameNode:CodeNode (at node.children 1)
      def import_file:string fNameNode.string_value

      if (has ctx.already_imported import_file) {
        return
      }

      def source_code ""

      if_javascript {
        def ppList (ctx.findPluginsFor("import_loader"))
        if( has ppList ) {
          try {
            ppList.forEach({
              def plugin (load_compiler_plugin item)
              def ss ( call_plugin plugin "import_loader" node ctx wr )
              case ss str:string {
                print "--> import  " + str
                source_code = str
              }
            })
          } {

          }
        }
      }
      set ctx.already_imported import_file true
      def rootCtx (ctx.getRoot())
      
      if( (strlen source_code) == 0 ) {
        def filePathIs (TFiles.searchEnv( env rootCtx.libraryPaths import_file ))
        if( ( file_exists env filePathIs import_file ) == false ) {
          if(ctx.hasCompilerFlag("verbose")) {
            print "import did not find the file: " + import_file
          }
          ctx.addError(node ('Could not import file '  + import_file))
          return
        }
        if(ctx.hasCompilerFlag("verbose")) {
          print "importing " + import_file
        }
        def c:string (read_file env filePathIs import_file)
        source_code = (unwrap c)
      }
      def code:SourceCode (new SourceCode ( source_code ))
      code.filename = import_file
      def parser:RangerLispParser (new RangerLispParser (code))
      parser.parse((ctx.hasCompilerFlag("no-op-transform")))
      node.expression = true
      node.vref = ""
      removeLast node.children
      removeLast node.children

      if(ctx.hasCompilerFlag("copysrc")) {
        print "--> copying " + (import_file)
        def fileWr (wr.getFileWriter("." import_file))
        fileWr.raw( source_code false)
      }

      def rn:CodeNode (unwrap parser.rootNode)
      this.mergeImports( rn ctx wr)
      push node.children rn
    } {
      for node.children item:CodeNode i {
        this.mergeImports(item ctx wr)
      }
    }
  }

  ;       this.CollectMethods( (unwrap parser.rootNode ) ctx wr)
  fn CollectMethods:void (node@(lives):CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    this.WalkCollectMethods(node ctx wr)
    def allTypes:[string]

    def serviceBuilder (new RangerServiceBuilder)
    serviceBuilder.CreateServices( this ctx wr )

    extendedClasses.forEach({
      def ch (ctx.findClass(index))
      def parent (ctx.findClass(item))
      ch.addParentClass(item)
      parent.is_inherited = true

      parent.variables.forEach({
        ch.ctx.defineVariable(item.name item)
      })
    })

    for classesWithTraits point:ClassJoinPoint i {
      def cl:RangerAppClassDesc (unwrap point.class_def)
      def joinPoint:CodeNode (unwrap point.node)
      def traitClassDef@(lives):CodeNode (at point.node.children 1)
      def name:string (traitClassDef.vref)
      ; print "trait " + name + " to class " + cl.name
        def t:RangerAppClassDesc (ctx.findClass(name))
        if( (size t.extends_classes) > 0 ) {
          ctx.addError( (unwrap point.node) ('Can not join class ' + name + ' because it is inherited. Currently on base classes can be used as traits.' ))
          continue
        }
        if(t.has_constructor) {
          ctx.addError( (unwrap point.node) ('Can not join class ' + name + ' because it has a constructor function' ))
        } {
          ; def clBody:CodeNode (at t.node.children 2)
          def origBody:CodeNode (at cl.node.children 2)
          def match:RangerArgMatch (new RangerArgMatch ())
          def params (t.node.getExpressionProperty("params"))
          def initParams (point.node.getExpressionProperty("params"))
          def traitParams (new RangerTraitParams)

          ; print "building trait for class " + cl.name
          if( (!null? params) && (!null? initParams) ) {
            for params.children typeName:CodeNode i {
              def pArg (at initParams.children i)
              if ( 0 == (strlen pArg.vref) ) {
                match.addNode( typeName.vref pArg)
              } {
                match.add(typeName.vref pArg.vref ctx)
;                print "- add " + typeName.vref + " => " +pArg.vref
              }
              push traitParams.param_names typeName.vref
              set traitParams.values typeName.vref pArg.vref
            }
            set cl.trait_params name traitParams
          } {
            match.add("T" cl.name ctx)
          }

;           print "traitparam values == " + (keys traitParams.values)

          ctx.setCurrentClass( cl )          

          def traitClass (ctx.findClass(traitClassDef.vref))
          for traitClass.variables pvar:RangerAppParamDesc i {
            def ccopy:CodeNode (pvar.node.rebuildWithType(match true))      
            this.WalkCollectMethods( ccopy ctx wr )
            push origBody.children ccopy
          }
          for traitClass.defined_variants fnVar:string i {
            def mVs:RangerAppMethodVariants (get traitClass.method_variants fnVar)
            for mVs.variants variant:RangerAppFunctionDesc i {
              def ccopy:CodeNode (variant.node.rebuildWithType(match true))      
              this.WalkCollectMethods( ccopy ctx wr )
              push origBody.children ccopy
            }            
          }
          for traitClass.static_methods variant:RangerAppFunctionDesc i {
            def ccopy:CodeNode (variant.node.rebuildWithType(match true))      
            this.WalkCollectMethods( ccopy ctx wr )
            push origBody.children ccopy
          }            
          
          ; def copy_of_body:CodeNode (clBody.rebuildWithType(match true))      
          ;joinPoint.vref = "does"
          ;joinPoint.value_type = RangerNodeType.NoType
          ;joinPoint.expression = true
          ;def chCnt:int (size joinPoint.children)
          ;while( chCnt > 0 ) {
          ;  removeLast joinPoint.children
          ;  chCnt = chCnt - 1
          ;}

          ;ctx.setCurrentClass( cl )
          ;for copy_of_body.children ch:CodeNode i {
            ;push origBody.children ch
           ; this.WalkCollectMethods( ch ctx wr )
          ;}
        }      
    }

    def cClassList (sort serializedClasses {
      def left_had false
      def right_had false
      forEach left.variables {
        if(item.nameNode.type_name == right.name || item.nameNode.array_type == right.name) {
          left_had = true
        }
      } 
      forEach right.variables {
        if(item.nameNode.type_name == left.name || item.nameNode.array_type == left.name) {
          right_had = true
        }
      } 
      if(left_had) {
        return 1
      }
      if(right_had) {
        return -1
      }
      return 0
    })

    for cClassList cl:RangerAppClassDesc i {
      cl.is_serialized = true
      def ser:RangerSerializeClass (new RangerSerializeClass())
      def extWr:CodeWriter (new CodeWriter())
;      ser.createJSONSerializerFn( cl (unwrap cl.ctx) extWr )
      ser.createJSONSerializerFn2( cl (unwrap cl.ctx) extWr )
      def theCode:string (extWr.getCode())
      def code:SourceCode (new SourceCode ( theCode))
      code.filename = "extension " + (ctx.currentClass.name)
      def parser:RangerLispParser (new RangerLispParser (code))
      parser.parse((ctx.hasCompilerFlag("no-op-transform")))
      def rn@(lives):CodeNode (unwrap parser.rootNode)
      this.WalkCollectMethods( rn (unwrap cl.ctx) wr)
      push walkAlso rn
    }
    
    for immutableClasses cl:RangerAppClassDesc i {
      def ser (new RangerImmutableExtension)
      def extWr (new CodeWriter())
      ser.createImmutableExtension( cl (unwrap cl.ctx) extWr )
      def theCode (extWr.getCode())
      def code (new SourceCode ( theCode ))
      code.filename = "extension " + (cl.name)
      def parser (new RangerLispParser (code))
      parser.parse((ctx.hasCompilerFlag("no-op-transform")))
      def rn@(lives):CodeNode (unwrap parser.rootNode)
      this.WalkCollectMethods( rn (unwrap cl.ctx) wr)
      push walkAlso rn
    }
    ;       ctx.hadValidType( (unwrap v.nameNode) )
    for ctx.definedClassList cname:string i {
      push allTypes cname
      def c (unwrap (get ctx.definedClasses cname))
      if( c.is_system || c.is_interface || c.is_template || c.is_trait) {
        continue
      }
      def varNames:[string:boolean]
      for c.variables p:RangerAppParamDesc i {
        ctx.hadValidType( (unwrap p.nameNode) )
        set varNames p.name true
      }
      c.method_variants.forEach({
        item.variants.forEach({
          if(has varNames item.name) {
            ctx.addError( (unwrap item.nameNode) 'Class has defined method and variable of the same name.')
          }
        })
      })
      ; check that no double variables..

    }

    for ctx.definedClassList cname:string i {
      push allTypes cname
    }

    push allTypes "int"
    push allTypes "string"
    push allTypes "boolean"
    push allTypes "double"

    def Anynn@(lives) (node.newVRefNode("Any"))

    def rootCtx (ctx.getRoot())

    def new_class@(lives):RangerAppClassDesc (new RangerAppClassDesc ())
    new_class.name = "Any"
    new_class.nameNode = Anynn
    rootCtx.addClass("Any" new_class)
    new_class.is_union = true
    def did_push:[string:boolean]
    for allTypes typeName:string i {
      if( has did_push typeName) {
        continue
      }
      push new_class.is_union_of typeName
      set did_push typeName true
    }
    Anynn.clDesc = new_class

    
    ; initialize the operator root 
  }

  fn defineFunctionParam( method:RangerAppFunctionDesc arg:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
      this.CheckTypeAnnotationOf( arg ctx wr )
      def p@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
      p.name = arg.vref
      p.value_type = arg.value_type
      p.node = arg
      p.init_cnt = 1
      p.nameNode = arg
      p.refType = RangerNodeRefType.Weak
      p.varType = RangerContextVarType.FunctionParameter
      push method.params p
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
  }

  fn spliceFunctionBody:CodeNode ( startIndex:int node@(temp lives):CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def block_index startIndex ; fn foo () {}
    def ch_len ( ( size node.children ) - 1)
    if( ch_len == startIndex ) {
      return node
    }
    for node.children cb:CodeNode i {
      if( i > startIndex ) {
        if( (strlen cb.vref) > 0 ) {
          if( ( ctx.hasCompilerFlag(cb.vref) ) && ( i < ch_len ) ) {
            block_index = i + 1
          }
        }
      }
    }
    def copyOf (node.copy())
    while( (size node.children) > (startIndex + 1) ) {
      removeLast node.children
    }
    if( block_index > startIndex ) {
      def replacer (at copyOf.children block_index)
      removeLast node.children
      push node.children (replacer.copy())
    }
    return node
  }

  fn CreateFunctionObject:RangerAppFunctionDesc (orig_node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    plugin.md "developer.md" {
      h2 Creating new function objects
      p 'Implemented a new, perhaps shorter way for creating new ' (b 'RangerAppFunctionDesc') 'Objects'
      code 'RangerFlowParser::CreateFunctionObject(orig_node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)'
    }

    def subCtx (ctx.fork())
    def node (this.spliceFunctionBody( 3 orig_node subCtx wr ))    
    def cn:CodeNode (node.getSecond())
    def s:string (node.getVRefAt(1))
    cn.ifNoTypeSetToVoid()

    ; not automatically assigned to some class
    ; def currC:RangerAppClassDesc ctx.currentClass
    ; if( (currC.hasOwnMethod(s)) && (false == (cn.hasFlag("override"))) ) {
    ;  ctx.addError( node "Error: method of same name declared earlier. Overriding function declarations is not currently allowed!")
    ;  return
    ; }
    ; if(cn.hasFlag("main")) {
    ;  ctx.addError( node "Error: dynamic method declared as @(main). Use static 'sfn' instead of 'fn'.")
    ;  return        
    ; }      

    def m@(lives) (r.funcdesc node ctx)
    subCtx.is_function = true
    subCtx.currentMethod = m
    m.fnCtx = subCtx
    if (cn.hasFlag("weak")) {
      m.changeStrength(0 1 node)
    } {
      m.changeStrength(1 1 node)
    }
    def args:CodeNode (at node.children 2)
    m.fnBody = (at node.children 3)
    
    this.CheckTypeAnnotationOf( (unwrap m.nameNode) ctx wr )

    for args.children arg@(lives):CodeNode ii {

      this.CheckTypeAnnotationOf( arg subCtx wr )
      
      def p2@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
      p2.name = arg.vref
      p2.value_type = arg.value_type
      p2.node = arg
      p2.nameNode = arg
      p2.init_cnt = 1
      p2.refType = RangerNodeRefType.Weak
      p2.initRefType = RangerNodeRefType.Weak
      p2.debugString = "--> collected "
      if (args.hasBooleanProperty("strong")) {
        p2.refType = RangerNodeRefType.Strong
        p2.initRefType = RangerNodeRefType.Strong
      }
      p2.varType = RangerContextVarType.FunctionParameter
      push m.params p2
      arg.hasParamDesc = true
      arg.paramDesc = p2
      arg.eval_type = arg.value_type
      arg.eval_type_name = arg.type_name 
      if (arg.hasFlag("strong")) {
        p2.changeStrength(1 1 (unwrap p2.nameNode))
      } {
        arg.setFlag("lives")
        p2.changeStrength(0 1 (unwrap p2.nameNode))
      }           
      ; subCtx.hadValidType(p2.nameNode)
      subCtx.defineVariable(p2.name p2)
    }    
    return m
  }

  fn WalkCollectMethods:void (node@(lives):CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def find_more:boolean true

    if( (size node.children) > 0) {
      def fc (node.getFirst())
      if( (size fc.ns) > 1) {
        if( (at fc.ns 0) == "plugin" ) {
          if(node.is_plugin) {
            return
          }
          node.is_plugin = true
          def pName (at fc.ns 1)
          ctx.addPluginNode( pName node )
          return 
        }
      }
    }    
    if (node.isFirstVref("defn")) {
      return 
    }    
    if (node.isFirstVref("flag")) {
      return 
    }    
    if (node.isFirstVref("page")) {
      return 
    }    
    if (node.isFirstVref("service")) {
      return 
    }    

    if (node.isFirstVref("operator")) {

      def opRef (at node.children 0)
      def nameNode@(lives):CodeNode (node.getSecond())
      def opClassName (nameNode.vref)

      if (nameNode.vref == "class") {
        def new_class@(lives):RangerAppClassDesc (new RangerAppClassDesc ())
        new_class.name = nameNode.type_name
        new_class.nameNode = nameNode
        nameNode.vref = nameNode.type_name
        ctx.addClass(nameNode.vref new_class)
      
        ; TODO: this may be dangerous assumbtion, the 'class' type def could be removed 
        def cSig (TFactory.new_class_signature(nameNode ctx wr))
        cSig.is_system = true

        new_class.is_system = true
        nameNode.clDesc = new_class
      }


      def b_is_void ((nameNode.type_name == "void") || nameNode.is_block_node )
      def langRef (r.vref (ctx.getTargetLang()))
      if( has opRef.type_name ) {
        langRef.vref = opRef.type_name
        print 'OP type ' + opRef.type_name
      }
      def opLang (? ( (size node.children) > 2) (at node.children 2) langRef )
      def opsList (last node.children )

;      def listOf:CodeNode (node.getSecond())
;      for listOf.children item@(lives):CodeNode i {
;        ctx.createOperator(item)
;      }

      for opsList.children op:CodeNode i {
        def fc (op.getFirst())
        if( fc.vref == "fn") {
          def nn (op.getSecond())
          def args (op.getThird())
          def opCode (at op.children 3)

;          print ":: op :: " + nn.vref

          def opN@(lives) (new CodeNode ( (unwrap op.code) op.sp op.ep ) )

          def opName (nn.copy())
;          def opName (new CodeNode ( (unwrap op.code) op.sp op.ep ) )

          def opSig (nn.rebuildWithType( (new RangerArgMatch) false))
          def opArgs (args.rebuildWithType( (new RangerArgMatch) false))

          def opTpls (new CodeNode ( (unwrap op.code) op.sp op.ep ) )
          opTpls.is_block_node = true

          def opTemplatesMain (new CodeNode ( (unwrap op.code) op.sp op.ep ) )
          def opTemplatesVRef (new CodeNode ( (unwrap op.code) op.sp op.ep ) )
          def opTemplatesList (new CodeNode ( (unwrap op.code) op.sp op.ep ) )

          opTemplatesVRef.vref = "templates"
          push opTemplatesMain.children opTemplatesVRef
          push opTemplatesMain.children opTemplatesList
          push opTpls.children opTemplatesMain

          push opN.children opName
;          opName.vref = nn.vref
          if(nn.hasFlag("newcontext")) {
            opName.setFlag("newcontext")
          }
          opSig.vref = nn.vref
          push opN.children opSig

          ; op _:void ( this:myClass .... )
          ; nameNode
          def opThisNode (nameNode.rebuildWithType( (new RangerArgMatch) false))
          opThisNode.vref = "self"
          if(nameNode.hasFlag("mutates")) {
            opThisNode.setFlag("mutates")
          }
          if(nameNode.hasFlag("immutable")) {
            opThisNode.setFlag("immutable")
          }

          if b_is_void {
            ; --> basebones operator without the self argument
          } {
            insert opArgs.children 0 opThisNode
          }

          push opN.children opArgs
          push opN.children opTpls

          if( op.hasStringProperty("doc") ) {
              opN.setStringProperty( "doc" (op.getStringProperty("doc")) )
          }

          def opCodeNode (opCode.rebuildWithType( (new RangerArgMatch) false))
          def actualCode (new CodeNode ( (unwrap opCode.code) op.sp op.ep ) )
          def opLangDef (opLang.rebuildWithType( (new RangerArgMatch) false))

          if(opLangDef.vref == "all") {
              opLangDef.vref = "*"
          }

          push actualCode.children opLangDef
          push actualCode.children opCodeNode
          if(opLangDef.vref == "*") {
            if(opCode.is_block_node == false) {
              opSig.setFlag("macro")
            }
          }
          if(nameNode.hasFlag("macro")) {
            opSig.setFlag("macro")
          }
          if(nn.hasFlag("pure")) {
            opSig.setFlag("pure")
          }
          push opTemplatesList.children actualCode 
          ctx.createOperator(opN)
        }
      }

      return

      def instances:CodeNode (node.getThird())
      def new_class@(lives):RangerAppClassDesc (new RangerAppClassDesc ())
      new_class.name = nameNode.vref
      new_class.nameNode = nameNode
      ctx.addClass(nameNode.vref new_class)
      new_class.is_system_union = true
      for instances.children ch:CodeNode i {
        push new_class.is_union_of ch.vref
      }
      nameNode.clDesc = new_class
      return
    }

    if (node.isFirstVref("union")) {
      def nameNode@(lives):CodeNode (node.getSecond())
      def instances:CodeNode (node.getThird())
      def new_class@(lives):RangerAppClassDesc (new RangerAppClassDesc ())
      new_class.name = nameNode.vref
      new_class.nameNode = nameNode
      ctx.addClass(nameNode.vref new_class)
      new_class.is_union = true
      for instances.children ch:CodeNode i {
        push new_class.is_union_of ch.vref
      }
      nameNode.clDesc = new_class
      return
    }    

    if (node.isFirstVref("systemunion")) {

      def nameNode@(lives):CodeNode (node.getSecond())
      if(ctx.isDefinedClass(nameNode.vref)) {
        def cl (ctx.findClass(nameNode.vref))
        if( cl.is_system == false ) {
          ctx.addError(node "Only system classes can be systemunions")
        }
        cl.is_system_union = true
        def instances:CodeNode (node.getThird())
        for instances.children ch:CodeNode i {
          push cl.is_union_of ch.vref
        }
        return
      }

      def nameNode@(lives):CodeNode (node.getSecond())
      def instances:CodeNode (node.getThird())
      def new_class@(lives):RangerAppClassDesc (new RangerAppClassDesc ())
      new_class.name = nameNode.vref
      new_class.nameNode = nameNode
      ctx.addClass(nameNode.vref new_class)
      new_class.is_system_union = true
      for instances.children ch:CodeNode i {
        push new_class.is_union_of ch.vref
      }
      nameNode.clDesc = new_class
      return
    }
    if (node.isFirstVref("systemclass")) {
      def nameNode@(lives):CodeNode (node.getSecond())
      if(ctx.isDefinedClass(nameNode.vref)) {
        def cl (ctx.findClass(nameNode.vref))
        if( cl.is_system_union == false ) {
          ctx.addError(node "Class already defined and it was not a systemunion.")
        }
        cl.is_system = true
        def instances:CodeNode (node.getThird())
        for instances.children ch@(lives):CodeNode i {
          def langName:CodeNode (ch.getFirst())
          def langClassName:CodeNode (ch.getSecond())
          set cl.systemNodes langName.vref ch
          if( (strlen langClassName.vref ) > 0 ) {
            set cl.systemNames langName.vref langClassName.vref
          }
          if( (strlen langClassName.string_value ) > 0 ) {
            set cl.systemNames langName.vref langClassName.string_value
          }
        }
        return
      }
      def instances:CodeNode (node.getThird())
      def new_class@(lives):RangerAppClassDesc (new RangerAppClassDesc ())
      new_class.name = nameNode.vref
      new_class.nameNode = nameNode
      ctx.addClass(nameNode.vref new_class)
      new_class.is_system = true
      for instances.children ch@(lives):CodeNode i {
        def langName:CodeNode (ch.getFirst())
        def langClassName:CodeNode (ch.getSecond())
        set new_class.systemNodes langName.vref ch
        ; set new_class.systemNames langName.vref langClassName.vref
        if( (strlen langClassName.vref ) > 0 ) {
          set new_class.systemNames langName.vref langClassName.vref
        }
        if( (strlen langClassName.string_value ) > 0 ) {
          set new_class.systemNames langName.vref langClassName.string_value
        }

      }
      nameNode.is_system_class = true
      nameNode.clDesc = new_class
      return
    }
    if (node.isFirstVref("extends")) {
      if( ( size node.children ) > 1 ) {
        def ee (node.getSecond())
        def currC:RangerAppClassDesc ctx.currentClass
        currC.addParentClass(ee.vref)
        def ParentClass:RangerAppClassDesc (ctx.findClass(ee.vref))
        ParentClass.is_inherited = true
      }
      find_more = false
    }
    if (node.isFirstVref("Extends")) {
      def extList:CodeNode (at node.children 1)
      def currC:RangerAppClassDesc ctx.currentClass
      for extList.children ee:CodeNode ii {
        currC.addParentClass(ee.vref)
        def ParentClass:RangerAppClassDesc (ctx.findClass(ee.vref))
        ParentClass.is_inherited = true
      }
    }
    if ( (node.isFirstVref("constructor")) || (node.isFirstVref("Constructor"))) {

      def currC:RangerAppClassDesc ctx.currentClass
      def subCtx:RangerAppWriterContext (currC.ctx.fork())

      currC.has_constructor = true
      currC.constructor_node = node
      def m@(lives):RangerAppFunctionDesc (new RangerAppFunctionDesc ())
      m.name = "Constructor"
      m.node = node
      m.nameNode = (at node.children 0)
      m.fnBody = (at node.children 2)
      m.fnCtx = subCtx

      def args:CodeNode (at node.children 1)
      for args.children arg@(lives):CodeNode ii {
        def p:RangerAppParamDesc (new RangerAppParamDesc ())
        p.name = arg.vref
        p.value_type = arg.value_type
        p.node = arg
        p.nameNode = arg
        p.refType = RangerNodeRefType.Weak
        p.varType = RangerContextVarType.FunctionParameter

        push m.params p

        arg.hasParamDesc = true
        arg.paramDesc = p
        arg.eval_type = arg.value_type
        arg.eval_type_name = arg.type_name

        subCtx.defineVariable(p.name p)        
        
      }
      currC.constructor_fn = m
      find_more = false
    }
    if (node.isFirstVref("enum")) {
      def fNameNode:CodeNode (at node.children 1)
      def enumList:CodeNode (at node.children 2)
      def new_enum:RangerAppEnum (new RangerAppEnum ())
      for enumList.children item:CodeNode i {
        def fc (item.getFirst())
        new_enum.add(fc.vref)
      }
      set ctx.definedEnums fNameNode.vref new_enum      
      find_more = false
    }
    if (node.isFirstVref("Enum")) {
      def fNameNode:CodeNode (at node.children 1)
      def enumList:CodeNode (at node.children 2)
      def new_enum:RangerAppEnum (new RangerAppEnum ())
      for enumList.children item:CodeNode i {
        new_enum.add(item.vref)
      }
      set ctx.definedEnums fNameNode.vref new_enum      
      find_more = false
    }
    if (node.isFirstVref("trait")) {
      def s:string (node.getVRefAt(1))
      def classNameNode@(lives):CodeNode (node.getSecond())
      def new_class@(lives):RangerAppClassDesc (new RangerAppClassDesc ())
      new_class.name = s
      def subCtx@(lives):RangerAppWriterContext (ctx.fork())
      ctx.setCurrentClass(new_class)
      subCtx.setCurrentClass(new_class)
      new_class.ctx = subCtx
      new_class.nameNode = classNameNode
      ctx.addClass(s new_class)
      new_class.classNode = node
      new_class.node = node
      new_class.is_trait = true
    }

    if ((node.isFirstVref("CreateClass")) || (node.isFirstVref("class"))) {

      if( (size node.children) < 3) {
        ctx.addError(node "Not enough arguments for creating a class")
        return
      }

      def s:string (node.getVRefAt(1))
      def classNameNode@(lives):CodeNode (node.getSecond())
      def new_class@(lives):RangerAppClassDesc (new RangerAppClassDesc ())
      new_class.name = s
      new_class.compiledName = s

      classNameNode.evalTypeClass = (TFactory.new_class_signature(classNameNode ctx wr))
      def notOkNames ([] 'main')
      if( (indexOf notOkNames s) >= 0) {
        ctx.addError(classNameNode ( 'Unfortunately this class name not allowed: ' + s) )
      }

      ; illegal name check
      switch s {
        case "_" {
          new_class.compiledName = 'utiltyClass'
        }
      }

      def subCtx@(lives):RangerAppWriterContext (ctx.fork())
      ctx.setCurrentClass(new_class)
      subCtx.setCurrentClass(new_class)
      new_class.ctx = subCtx
      new_class.nameNode = classNameNode
      ctx.addClass(s new_class)
      new_class.classNode = node
      new_class.node = node
      if(node.hasBooleanProperty("trait")) {
        new_class.is_trait = true
      }
      if(classNameNode.hasFlag("immutable")) {
        push immutableClasses new_class
        new_class.is_immutable = true
      }
      def third (node.getThird())
      if(third.vref == "extends") {
        if( (node.chlen()) >= 4 ) {
          def extClass (at node.children 3)
          if( (strlen extClass.vref) > 0 ) {
            ; 
            set extendedClasses s extClass.vref
          } {
            ctx.addError( node "Invalid classname given for the extends keyword")
          }
        }
      }
      ; check for the extends keyword
    }

    if (node.isFirstVref("TemplateClass")) {
      def s:string (node.getVRefAt(1))
      ctx.addTemplateClass(s node)
      find_more = false
    }

    if((node.isFirstVref("Extends"))) {
      
      def list:CodeNode (at node.children 1)
      for list.children cname:CodeNode i {
        def extC:RangerAppClassDesc (ctx.findClass(cname.vref))
        for extC.variables vv@(lives):RangerAppParamDesc i {
          def currC:RangerAppClassDesc ctx.currentClass
          def subCtx:RangerAppWriterContext currC.ctx
          subCtx.defineVariable(vv.name vv)
        }
      }
      find_more = false
    }

    if ((node.isFirstVref("def")) || (node.isFirstVref("let"))) {
      def s:string (node.getVRefAt(1))
      def vDef@(lives):CodeNode (at node.children 1)
      def p:RangerAppParamDesc (new RangerAppParamDesc ())

      ; TODO: check also for new...
      ; TODO: may not work if trait has not been declared
      if(vDef.has_type_annotation) {
        this.CheckTypeAnnotationOf( vDef ctx wr )
      }
      if( s != ((ctx.transformWord(s)))) {
        ; ctx.addError( node "Can not use reserved word " + s + " as class propery")
      }
      def currC:RangerAppClassDesc ctx.currentClass

      ; immutable classes have only weak properties
      if currC.is_immutable {
        vDef.setFlag("weak")
        if( vDef.value_type == RangerNodeType.Array) {
          def initNode (node.newExpressionNode())
          initNode.push( (node.newVRefNode("new")) )
          def tDef (node.newVRefNode("Vector"))
          
          ; Vector@(string)
          def vAnn (node.newExpressionNode())
          vAnn.push( (node.newVRefNode(vDef.array_type)))
          tDef.has_vref_annotation = true
          tDef.vref_annotation = vAnn
          initNode.push(tDef)

          set node.children 2 (initNode)

          vDef.value_type = RangerNodeType.VRef
          vDef.type_name = "Vector"
          ; def obj:Vector@(string)
          def tAnn (node.newExpressionNode())
          tAnn.push( (node.newVRefNode(vDef.array_type)))
          vDef.has_type_annotation = true
          vDef.type_annotation = tAnn

          this.CheckTypeAnnotationOf( vDef ctx wr )
          this.CheckVRefTypeAnnotationOf( tDef ctx wr )
          
        }
        if( vDef.value_type == RangerNodeType.Hash) {
          def initNode (node.newExpressionNode())
          initNode.push( (node.newVRefNode("new")) )
          def tDef (node.newVRefNode("Map"))
          
          ; Vector@(string)
          def vAnn (node.newExpressionNode())
          vAnn.push( (node.newVRefNode(vDef.key_type)))
          vAnn.push( (node.newVRefNode(vDef.array_type)))
          tDef.has_vref_annotation = true
          tDef.vref_annotation = vAnn
          initNode.push(tDef)
          set node.children 2 (initNode)

          vDef.value_type = RangerNodeType.VRef
          vDef.type_name = "Map"
          ; def obj:Vector@(string)
          def tAnn (node.newExpressionNode())
          tAnn.push( (node.newVRefNode(vDef.key_type)))
          tAnn.push( (node.newVRefNode(vDef.array_type)))
          vDef.has_type_annotation = true
          vDef.type_annotation = tAnn

          this.CheckTypeAnnotationOf( vDef ctx wr )
          this.CheckVRefTypeAnnotationOf( tDef ctx wr )

        }
      }      

      ; transforming reserved words here 
      p.name = s
      p.value_type = vDef.value_type
      p.node = node
      p.is_class_variable = true
      p.varType = RangerContextVarType.Property
      p.node = node
      p.nameNode = vDef
      vDef.hasParamDesc = true
      vDef.ownParamDesc = p
      vDef.paramDesc = p
      node.hasParamDesc = true
      node.paramDesc = p

      if (vDef.hasFlag("weak")) {
          p.changeStrength(0 2 (unwrap p.nameNode))
      } {
          p.changeStrength(2 2 (unwrap p.nameNode))
      }    

      if ((size node.children) > 2) {
        p.set_cnt = 1
        p.init_cnt = 1
        p.def_value = (at node.children 2)
        p.is_optional = false
        if(p.def_value.value_type == RangerNodeType.String) {
          vDef.type_name = "string"
        }
        if(p.def_value.value_type == RangerNodeType.Integer) {
          vDef.type_name = "int"
        }
        if(p.def_value.value_type == RangerNodeType.Double) {
          vDef.type_name = "double"
        }
        if(p.def_value.value_type == RangerNodeType.Boolean) {
          vDef.type_name = "boolean"
        }
        def valueNode (at node.children 2)
        if( (size valueNode.children) > 0) {
          def fc (valueNode.getFirst())
          if(fc.vref == "new") {
            def second (valueNode.getSecond())
            this.CheckVRefTypeAnnotationOf( second ctx wr )
          }
        }
      } {
        p.is_optional = true
        if (false == ((vDef.value_type == RangerNodeType.Array) || (vDef.value_type == RangerNodeType.Hash))) {         
          vDef.setFlag("optional")
        }
      }
      currC.addVariable(p)

      def subCtx:RangerAppWriterContext currC.ctx
      subCtx.defineVariable(p.name p)
      p.is_class_variable = true

      find_more = false
    }
    if (node.isFirstVref("operators")) {
      def listOf:CodeNode (node.getSecond())
      for listOf.children item@(lives):CodeNode i {
        ctx.createOperator(item)
      }
      find_more = false
    }
    if ((node.isFirstVref("Import")) || (node.isFirstVref("import"))) {
      def fNameNode:CodeNode (at node.children 1)
      def import_file:string fNameNode.string_value
      if (has ctx.already_imported import_file) {
        return
      } {
        set ctx.already_imported import_file true
      }
      def envOpt (ctx.getEnv())
      if(null? envOpt) {
        ctx.addError( node 'Environment not defined')
        return
      }
      def env (unwrap envOpt)
      def rootCtx (ctx.getRoot())
      def filePathIs (TFiles.searchEnv( env rootCtx.libraryPaths import_file ))

      if( ( file_exists env filePathIs import_file ) == false ) {
        ctx.addError(node ('Could not import file '  + import_file))
        return
      }
      def c:string (read_file env filePathIs import_file)
      def code:SourceCode (new SourceCode ( (unwrap c)))
      code.filename = import_file
      def parser:RangerLispParser (new RangerLispParser (code))
      parser.parse((ctx.hasCompilerFlag("no-op-transform")))
      def rnode:CodeNode parser.rootNode
      this.WalkCollectMethods( (unwrap rnode) ctx wr)
      find_more = false
    }
    ; consumes_traits
    if (node.isFirstVref("does")) {
      def defName:CodeNode (node.getSecond())
      def currC@(lives):RangerAppClassDesc ctx.currentClass
      push currC.consumes_traits defName.vref
      def joinPoint@(lives):ClassJoinPoint (new ClassJoinPoint())
      joinPoint.class_def = currC
      joinPoint.node = node
      push classesWithTraits joinPoint
    } 

    def b_is_main false
    if ( node.code.filename == (ctx.getRootFile()) )  {
      b_is_main = true
    }

    if ((node.isFirstVref("static")) ) {
      ; static fn foo () {}
      if( (node.chlen()) < 5 ) {
        ctx.addError(node "Invalid static function declaration")
        return
      }
      ; static fn main () {}
      node = (this.spliceFunctionBody( 4 node ctx wr ))

      def s:string (node.getVRefAt(2))
      if( s == "main" ) {
        if b_is_main {
          this.mainCnt = this.mainCnt + 1
          if(this.mainCnt > 1) {
            ctx.addError( node "main function can be declared only once")
          }
        }
      }
      def currC:RangerAppClassDesc ctx.currentClass
      def m@(lives):RangerAppFunctionDesc (new RangerAppFunctionDesc ())
      m.name = s
      m.compiledName = (ctx.transformWord(s))
      m.node = node
      m.is_static = true
      m.nameNode = (at node.children 2)
      m.nameNode.ifNoTypeSetToVoid()
      def args:CodeNode (at node.children 3)
      m.fnBody = (at node.children 4)
;      m.fnCtx = (ctx.fork())
      this.CheckTypeAnnotationOf( (unwrap m.nameNode) ctx wr )
      args.children.forEach({
        this.defineFunctionParam( m item ctx wr)
      })      
      currC.addStaticMethod(m)
      find_more = false      
      return
    }
    if ((node.isFirstVref("StaticMethod")) || (node.isFirstVref("sfn"))) {

      ; static fn main () {}
      node = (this.spliceFunctionBody( 3 node ctx wr ))

      def s:string (node.getVRefAt(1))
      def currC:RangerAppClassDesc ctx.currentClass
      def m@(lives):RangerAppFunctionDesc (new RangerAppFunctionDesc ())
      m.name = s
      m.compiledName = (ctx.transformWord(s))
      m.node = node
      m.is_static = true
      m.nameNode = (at node.children 1)
      m.nameNode.ifNoTypeSetToVoid()
      def args:CodeNode (at node.children 2)
      m.fnBody = (at node.children 3)
;      m.fnCtx = (ctx.fork())
      this.CheckTypeAnnotationOf( (unwrap m.nameNode) ctx wr )
      args.children.forEach({
        this.defineFunctionParam( m item ctx wr)
      })      
      currC.addStaticMethod(m)
      find_more = false

      if( m.nameNode.hasFlag("main") ) {
        if b_is_main {
          this.mainCnt = this.mainCnt + 1
          if(this.mainCnt > 1) {
            ctx.addError( node "main function can be declared only once")
          }
        }
      }
      return
    }
    if (node.isFirstVref("extension")) {
      def s:string (node.getVRefAt(1))
      def old_class@(lives):RangerAppClassDesc (ctx.findClass(s))
      ctx.setCurrentClass( old_class )
      ; print "extension for " + s
    }
    
    if ((node.isFirstVref("PublicMethod")) || (node.isFirstVref("fn"))) {
      ; --> new shortcut for function creators
      def currC:RangerAppClassDesc ctx.currentClass
      def fnObj@(lives) (r.func node (unwrap currC.ctx) wr)
      def cn (fnObj.nameNode)
      if( (currC.hasOwnMethod(fnObj.name)) && (false == (cn.hasFlag("override"))) ) {
        ctx.addError( node "Error: method of same name declared earlier. Overriding function declarations is not currently allowed!")
        return
      }
      if(cn.hasFlag("main")) {
        ctx.addError( node "Error: dynamic method declared as @(main). Use static 'sfn' instead of 'fn'.")
        return        
      }      
      currC.addMethod(fnObj)
      find_more = false
      return
    }
    if find_more {
      for node.children item:CodeNode i {
        this.WalkCollectMethods(item ctx wr)
      }
    }

    if(node.hasBooleanProperty("serialize")) {
      push serializedClasses (unwrap ctx.currentClass)
    }

  }

  fn findFunctionDesc@(weak optional):RangerAppFunctionDesc (obj:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def varDesc:RangerAppParamDesc
    def varFnDesc:RangerAppFunctionDesc
    
    if (obj.vref != (this.getThisName())) {
      if ((size obj.ns) > 1) {
        def cnt:int (size obj.ns)
        def classRefDesc:RangerAppParamDesc
        def classDesc:RangerAppClassDesc
        for obj.ns strname:string i {
          if (i == 0) {
            
            if (strname == (this.getThisName())) {
              classDesc = (ctx.getCurrentClass())           
            } {
              if (ctx.isDefinedClass(strname)) {
                classDesc = (ctx.findClass(strname))
                continue _
              }
              classRefDesc = (ctx.getVariableDef(strname))
              if ( (null? classRefDesc) || (null? classRefDesc.nameNode) ) {
                ctx.addError(obj ('Error, no description for called object: ' + strname))
                break _
              }
              classRefDesc.ref_cnt = (1 + classRefDesc.ref_cnt)
              classDesc = (ctx.findClass(classRefDesc.nameNode.type_name))
              if(null? classDesc) {
                return varFnDesc
              }
            }
          } {

            if(null? classDesc) {
              return varFnDesc
            }            
            if (i < (cnt - 1)) {
              varDesc = (classDesc.findVariable(strname))
              if (null? varDesc) {
                ctx.addError(obj ('Error, no description for refenced obj: ' + strname))
              }
              def subClass:string (varDesc.getTypeName())
              classDesc = (ctx.findClass(subClass))
              continue _
            }
            if (!null? classDesc) {
              varFnDesc = (classDesc.findMethod(strname))
              if (null? varFnDesc) {
                varFnDesc = (classDesc.findStaticMethod(strname))
                if (null? varFnDesc) {
                  ctx.addError(obj (' function variable not found ' + strname))
                }
              }
            }
          }
        }
        return varFnDesc
      }

      def udesc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
      def currClass:RangerAppClassDesc (unwrap udesc)         

      varFnDesc = (currClass.findMethod(obj.vref))
      if(!null? varFnDesc) {
        if (!null? varFnDesc.nameNode) {
        } {
          ctx.addError(obj ('Error, no description for called function: ' + obj.vref))
        }
      }
      return varFnDesc
    }
    return varFnDesc
  }
  fn findParamDesc@(weak optional):RangerAppParamDesc (obj:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    def varDesc@(lives):RangerAppParamDesc
    def set_nsp:boolean false
    def classDesc@(lives):RangerAppClassDesc
    if (0 == (size obj.nsp)) {
      set_nsp = true
    }
    if (obj.vref != (this.getThisName())) {
      if ((size obj.ns) > 1) {
        def cnt:int (size obj.ns)
        def classRefDesc@(lives):RangerAppParamDesc
        for obj.ns strname:string i {
          if (i == 0) {
            if (strname == (this.getThisName())) {
              classDesc = (ctx.getCurrentClass())                      
              if set_nsp {
                push obj.nsp (unwrap classDesc)
              }
            } {
              if (ctx.isDefinedClass(strname)) {
                classDesc = (ctx.findClass(strname))
                if set_nsp {
                  push obj.nsp (unwrap classDesc)
                }
                continue _
              }
              classRefDesc = (ctx.getVariableDef(strname))
              if (null? classRefDesc) {
                ctx.addError(obj ('Error, no description for called object: ' + strname))
                break _
              }
              if set_nsp {
                push obj.nsp (unwrap classRefDesc)
              }

              ; --> if the call is optional
              ; 
              ; o.foo.x --> optional always ...

              if(classRefDesc.nameNode.hasFlag("optional")) {
                if(ctx.hasCompilerFlag('strict')) {
                  if(false == (ctx.isTryBlock())) {
                    ctx.addError( obj "Optional automatically unwrapped outside try block" )
                  }
                }
              }
              
              classRefDesc.ref_cnt = (1 + classRefDesc.ref_cnt)
              classDesc = (ctx.findClass(classRefDesc.nameNode.type_name))
            }            
          } {
            if (i < (cnt - 1)) {
              varDesc = (classDesc.findVariable(strname))              
              if( i > 0 ) {
                if(varDesc.nameNode.hasFlag("optional")) {
                  if(ctx.hasCompilerFlag('strict')) {
                    if(false == (ctx.isTryBlock())) {
                      ctx.addError( obj "Optional automatically unwrapped outside try block" )
                    }
                  }
                }
              }
              if (null? varDesc) {
                ctx.addError(obj ('Error, no description for refenced obj: ' + strname))
              }
              def subClass:string (varDesc.getTypeName())
              classDesc = (ctx.findClass(subClass))
              if set_nsp {
                push obj.nsp (unwrap varDesc)
              }
              continue _
            }
            if (!null? classDesc) {
              varDesc = (classDesc.findVariable(strname))
              if (null? varDesc) {
                def classMethod@(lives optional):RangerAppFunctionDesc (classDesc.findMethod(strname))
                if (null? classMethod) {
                  classMethod = (classDesc.findStaticMethod(strname))
                  if (null? classMethod) {
                    ctx.addError(obj ('variable not found ' + strname))
                  }
                }
                if (!null? classMethod) {
                  if set_nsp {
                    push obj.nsp (unwrap classMethod)
                  }
                  return classMethod
                }
              }
              if set_nsp {
                push obj.nsp (unwrap varDesc)
              }
            }
          }
        }
        return varDesc
      }
      varDesc = (ctx.getVariableDef(obj.vref))
      if (!null? varDesc.nameNode) {
      } {

;        print ('findParamDesc : description not found for ' + obj.vref)
;        if (!null? varDesc) {
;          print ('Vardesc was found though...' + varDesc.name)
;        }
;        ctx.addError(obj ('Error, no description for called object: ' + obj.vref))
      }
      return varDesc
    }
    def cc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
    return cc
  }

  fn convertToUnion( unionName:string node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
      
      if( (ctx.isDefinedClass(unionName)) ) {
        def c1:RangerAppClassDesc (ctx.findClass(unionName))
        if( c1.is_union ) {
            if( (node.type_name != c1.name) && (node.eval_type_name != c1.name ) ) {
              def toEx (node.newExpressionNode())
              def toVref (node.newVRefNode('to'))
              def argType (node.newVRefNode('_'))
              def targetNode (node.copy())
              argType.type_name = unionName
              toEx.push( toVref )
              toEx.push( argType )
              toEx.push( targetNode )
              node.expression = true
              node.flow_done = false
              node.value_type = RangerNodeType.NoType
              node.getChildrenFrom( toEx )
              def wr (new CodeWriter)
              this.WalkNode( node ctx wr )
            }
          }
      }
  }

  fn transformMethodToLambda ( node:CodeNode vFnDef:RangerAppFunctionDesc ctx:RangerAppWriterContext wr:CodeWriter ) {

; node.
; some.method -->

;    def vFnDef@(optional):RangerAppFunctionDesc (this.findFunctionDesc(node ctx wr))
;    if (!null? vFnDef) {
      if(vFnDef.isFunction()) {
        ; could transform here the n2 into expression...
        ; fn myFn:int () 
        def args (map vFnDef.params {
                    return (item.nameNode.copy())
                  } to:[CodeNode])
        ; (fn:rv () )
        def fnArg (vFnDef.nameNode.copy())
        fnArg.vref = "fn"
        def subNode (node.copy())
        subNode.flow_done = false
        def argsExpr (map args {
                                      return (item.copy())
                                    })


        if( ( (has vFnDef.nameNode.type_name) && (vFnDef.nameNode.type_name != 'void') ) ||
            (has vFnDef.nameNode.array_type) ) {
          def staticLambda (r.expression
                              fnArg
                              (r.expression args )
                              (r.block
                                (r.expression
                                  (r.vref 'return')
                                  ; call...
                                  (r.expression
                                    ; (r.vref node.vref)
                                    subNode
                                    ; parameters...
                                    (r.expression
                                      argsExpr
                                    )
                                  )
                                )
                              )
                            )
          node.getChildrenFrom( staticLambda )

        } {
          def staticLambda (r.expression
                              fnArg
                              (r.expression args )
                              (r.block
                                  (r.expression
                                    ; (r.vref node.vref)
                                    subNode
                                    ; parameters...
                                    (r.expression
                                      argsExpr
                                    )
                                  )
                              )
                            )
          node.getChildrenFrom( staticLambda )
        }                                    
        node.flow_done = false
        node.expression = true
        node.value_type = RangerNodeType.NoType
        node.vref = ""
;        node.hasParamDesc = false
;        nullify node.paramDesc
        this.WalkNode( node ctx wr)
;      }
    }    
  }

  fn areEqualTypes:boolean (n1:CodeNode n2:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    if(n1.eval_type == RangerNodeType.ExpressionType) {

      def n1Expr@(weak) (n1.expression_value)
      def n2Expr@(weak) (n2.expression_value)

      if(null? n1Expr) {
        if(n1.hasParamDesc && (!null? n1.paramDesc.nameNode) && (!null? n1.paramDesc.nameNode.expression_value) ) {
          n1Expr = n1.paramDesc.nameNode.expression_value
        }
      }
      if(null? n2Expr) {
        if(n2.hasParamDesc && (!null? n2.paramDesc.nameNode) && (!null? n2.paramDesc.nameNode.expression_value) ) {
          n2Expr = n2.paramDesc.nameNode.expression_value
        }
      }
      if( (!null? n1Expr) && (!null? n2Expr) ) {
        ; if two lambas have been given as argument...
        return (this.matchLambdaArgs( (unwrap n1Expr) (unwrap n2Expr) ctx (new CodeWriter)))
      }

      if( (!null? n1Expr) ) {
        
        ; for example:
        ;   forEach list1 <operatorfn>
        ;
        ; this is transformed into corresponding lambda call like
        ; (fn:void (item:int index:int) { <operator> item index })
        def opList (ctx.getOpFns(n2.vref))
        if(has opList) {        
          
          def newCall (r.expression (r.vref n2.vref))
          def newExpr (r.block )
          def proto (n1Expr.copy())

          def fc (at proto.children 0)
          fc.vref = 'fn'
          def eParams (at n1Expr.children 1)
          eParams.children.forEach({
            push newCall.children (r.vref item.vref)
          })
          if(fc.type_name != 'void') {
            push newExpr.children (r.expression (r.vref 'return') newCall )
          } {
            push newExpr.children newCall           
          }
          push proto.children newExpr

          n2.value_type = RangerNodeType.NoType
          n2.expression_value = (proto.copy())
          n2.expression = true
          n2.flow_done = false
          n2.vref = ''
          clear n2.ns
          n2.getChildrenFrom( (proto.copy()) )

          this.WalkNode(n2 ctx wr)
          n2.expression_value = proto
          return (this.areEqualTypes(n1 n2 ctx wr))
        }
      }
      

      if( n2.eval_type == RangerNodeType.Method ) {
        def pDesc (unwrap n2.paramDesc)
        this.transformMethodToLambda( n2 (cast pDesc to:RangerAppFunctionDesc) ctx wr )
        return true        
      }
      
      def vFnDef@(optional):RangerAppFunctionDesc (this.findFunctionDesc(n2 ctx wr))
      if (!null? vFnDef) {
        ; Static method is transformed here to lambda...
        ; print "Transforming method to lambda " + (n2.getCode())
        this.transformMethodToLambda( n2 (unwrap vFnDef) ctx wr )
        return true
      }

      

      ctx.addError(n2 "Was not able to evaluate lambda expression types!")
      if(!null? n1Expr) {
        ctx.addError(n1  ('^ ' + (n1Expr.getCode())) )
      } {
        ctx.addError(n1  "^ expression_value not found (1)" )        
      }
      if(!null? n2Expr) {
        ctx.addError(n2  ('^ ' + (n2Expr.getCode())) )
      } {
        ctx.addError(n2  "^ expression_value not found (2)" )
      }
      return false
    }    
    if ((n1.eval_type != RangerNodeType.NoType) && (n2.eval_type != RangerNodeType.NoType) && ((strlen n1.eval_type_name) > 0) && ((strlen n2.eval_type_name) > 0)) {
      if ( n1.eval_type_name == n2.eval_type_name) {
      } {
        def b_ok:boolean false
        if ((ctx.isEnumDefined(n1.eval_type_name)) && (n2.eval_type_name == "int")) {
          b_ok = true
        }
        if ((ctx.isEnumDefined(n2.eval_type_name)) && (n1.eval_type_name == "int")) {
          b_ok = true
        }
        if ((n1.eval_type_name == "char") && (n2.eval_type_name == "int")) {
          b_ok = true
        }
        if ((n1.eval_type_name == "int") && (n2.eval_type_name == "char")) {
          b_ok = true
        }

        if( (ctx.isDefinedClass(n1.eval_type_name)) && (ctx.isDefinedClass (n2.eval_type_name))) {

            def c1:RangerAppClassDesc (ctx.findClass(n1.eval_type_name))
            def c2:RangerAppClassDesc (ctx.findClass(n2.eval_type_name))

            if( c1.is_union ) {
                if( c2.is_union == false ) {

                  this.convertToUnion( n1.eval_type_name n2 ctx (new CodeWriter))
                  if(n2.eval_type_name == n1.eval_type_name) {
                    return true
                  } {
                    return false
                  }
                }
            }

            if( (c2.is_union != c1.is_union ) ) {
              ctx.addError( n1 ('Can not convert union to type '))
              return false
            }      

            if( (c2.is_union == true) && (c1.is_union == true)) {
              ctx.addError( n1 ('Union types must be the same =>  ' + n1.eval_type_name + " <> " + n2.eval_type_name))
              return false
            }   

            if ( c1.isSameOrParentClass (n2.eval_type_name ctx)) {
                return true
            }
            if ( c2.isSameOrParentClass (n1.eval_type_name ctx)) {
                return true
            }
        }
        
        if (b_ok == false) {
          if(n1.eval_type_name == 'Any') {
            this.convertToUnion( 'Any' n2 ctx (new CodeWriter))
            if(n2.eval_type_name == n1.eval_type_name) {
;              print "^ converted to union " + (n2.getCode())
              return true
            } {
              return false
            }
          }
          return false
        }
      }
    }
    return true
  }
  fn shouldBeEqualTypes:void (n1:CodeNode n2:CodeNode ctx@(weak):RangerAppWriterContext msg:string) {

    if ((n1.eval_type != RangerNodeType.NoType) && (n2.eval_type != RangerNodeType.NoType) && ((strlen n1.eval_type_name) > 0) && ((strlen n2.eval_type_name) > 0)) {
      if (n1.eval_type_name == n2.eval_type_name) {
      } {
        def b_ok:boolean false
        if ((ctx.isEnumDefined(n1.eval_type_name)) && (n2.eval_type_name == "int")) {
          b_ok = true
        }
        if ((ctx.isEnumDefined(n2.eval_type_name)) && (n1.eval_type_name == "int")) {
          b_ok = true
        }
        if (ctx.isDefinedClass(n2.eval_type_name)) {
          def cc:RangerAppClassDesc (ctx.findClass(n2.eval_type_name))
          if (cc.isSameOrParentClass(n1.eval_type_name ctx)) {
            b_ok = true
          }
        }
        if ((n1.eval_type_name == "char") && (n2.eval_type_name == "int")) {
          b_ok = true
        }
        if ((n1.eval_type_name == "int") && (n2.eval_type_name == "char")) {
          b_ok = true
        }
        if (b_ok == false) {
          ctx.addError(n1 ('Type mismatch ' + n2.eval_type_name + ' <> ' + n1.eval_type_name + '. ' + msg))
        }
      }
    }
  }
  fn shouldBeExpression:void (n1:CodeNode ctx:RangerAppWriterContext msg:string) {
    if (n1.expression == false) {
      ctx.addError(n1 (msg))
    }
  }
  fn shouldHaveChildCnt:void (cnt:int n1:CodeNode ctx:RangerAppWriterContext msg:string) {
    if ((size n1.children) != cnt) {
      ctx.addError(n1 (msg))
    }
  }
}

Import "ng_parser_std_match2.clj"
