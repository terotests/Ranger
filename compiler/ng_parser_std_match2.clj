
extension RangerFlowParser {

  fn findLanguageOper@(optional weak):CodeNode (details:CodeNode ctx:RangerAppWriterContext opDef:CodeNode) {
    def langName (ctx.getTargetLang())
    def rv:CodeNode
    for details.children det:CodeNode i {        
      if ( (array_length det.children ) > 0) {
        def fc:CodeNode (itemAt det.children 0)
        if (fc.vref == "templates") {
          def tplList:CodeNode (itemAt det.children 1)
          for tplList.children tpl:CodeNode i {

            if(tpl.hasExpressionProperty("flags")) {
                def flagList (tpl.getExpressionProperty("flags"))
                def b_matched false
                flagList.children.forEach({
                  print "FLAG " + item.vref
                  b_matched = (b_matched || (ctx.hasCompilerFlag(item.vref))) 
                })
                if( b_matched == false ) { 
                    continue
                } 
            }
            def tplName:CodeNode (tpl.getFirst())
            def is_ts (ctx.hasCompilerFlag('typescript'))
            if( is_ts && ( tplName.vref == 'typescript' || tplName.vref == 'ts')) {
              rv = tpl 
              return rv
            } 
            if ((tplName.vref != "*") && (tplName.vref != langName)) {
              continue 
            }            
            rv = tpl
            return rv
          }
          ; op _:void () { templates {}}
          if(langName == 'ranger') {
            ; es6 ( '(operator ' (e 1) ' ' ))
            def opNameNode (opDef.getFirst())
            def opArgs (opDef.getThird())
            def rangerTpl (r.expression (r.value ('(' + opNameNode.vref + ' ' ) ) ) )

            def cnt 1
            opArgs.children.forEach({
              if(item.type_name == 'block') {
                push rangerTpl.children (r.expression (r.vref 'block') (r.value cnt ))            
              } {
                push rangerTpl.children (r.expression (r.vref 'e') (r.value cnt ))            
              }
              cnt = cnt + 1
            })
            push rangerTpl.children (r.value ')')
            rv = (r.expression (r.vref 'ranger') rangerTpl )
          }
        }
      }
    }
    return rv      
  }

  fn buildMacro:CodeNode ( langOper@(optional):CodeNode args:CodeNode ctx:RangerAppWriterContext )  {

      def subCtx:RangerAppWriterContext (ctx.fork())
      def wr:CodeWriter (new CodeWriter ())
      def lcc:LiveCompiler (new LiveCompiler())

      lcc.langWriter = (new RangerRangerClassWriter ())
      lcc.langWriter.compiler = lcc

      subCtx.targetLangName = "ranger"
      subCtx.restartExpressionLevel()

      def macroNode:CodeNode (unwrap langOper)
      def cmdList:CodeNode (macroNode.getSecond())
      if(ctx.hasCompilerFlag("show-macros")) {
        print "Building macro " + macroNode.vref + " : " + (cmdList.getCode())
        print "Arguments : " + (args.getCode())
      }
      ;walkCommandList:void (cmd:CodeNode node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
      lcc.walkCommandList( cmdList args subCtx wr )
      def lang_str:string (wr.getCode())
      def lang_code:SourceCode (new SourceCode ( lang_str ) )
      lang_code.filename = "<macro " + macroNode.vref + ">"
      def lang_parser:RangerLispParser (new RangerLispParser (lang_code))
      lang_parser.parse((ctx.hasCompilerFlag("no-op-transform")))

      def node@(lives):CodeNode (unwrap lang_parser.rootNode)

      if(has args.register_expressions) {
        node.register_expressions = (clone args.register_expressions)
      }
      args.children.forEach({
        item.register_expressions.forEach({
          def re@(temp) item
          push node.register_expressions re
        })
      })

      return node
  }

  fn stdParamMatch:boolean (callArgs@(lives):CodeNode inCtx:RangerAppWriterContext wr:CodeWriter require_all_match:boolean) {
    stdCommands = (inCtx.getStdCommands())
    def callFnName:CodeNode (callArgs.getFirst())
    def cmds:CodeNode stdCommands
    def some_matched:boolean false
    def found_fn:boolean false
    def added_ns ""
    def missed_args:[string]
    def ctx:RangerAppWriterContext (inCtx.fork())
    def lang_name:string (ctx.getTargetLang())
    def expects_error:boolean false
    def err_cnt:int (inCtx.getErrorCount())
    def arg_eval_start 0 
    if( callArgs.hasBooleanProperty("error")) {
      expects_error = true
    }

    if( ( (inCtx.expressionLevel()) == 0 ) ) {
      ; print " expr level zero for " + (callArgs.getCode())
      inCtx.lastBlockOp = callArgs
    } {
      ; print " expr level " + (inCtx.expressionLevel()) + " -> " + (callArgs.getCode())
    }
     
    
    def in_chain false
    def call_arg_cnt (size callArgs.children)
    def op_list (ctx.getOperators(callFnName.vref))

    ; here the op_list is the available operator list
    ; TODO:
    ;  - you could sort it so that the most relevant operator is checked first
    ;  - do not evalute keyword values unless necessary

    for op_list ch@(lives):CodeNode main_index {

      def fc:CodeNode (ch.getFirst())
      def nameNode:CodeNode (ch.getSecond())
      def args:CodeNode (ch.getThird())

      ; variable disables operator usage...
      if( inCtx.isVarDefined( fc.vref )) {
        return false
      }
      
      ; if loop is done two times, remove the old NS definition
      ctx.removeOpNs( added_ns )
      ctx.addOpNs( fc.vref )
      added_ns = fc.vref

      def line_index:int (callArgs.getLine())
      ; def callerArgCnt:int (((array_length callArgs.children) - 1))
      def callerArgCnt (call_arg_cnt - 1)
      def fnArgCnt:int (array_length args.children)
      def has_eval_ctx:boolean false
      def is_macro:boolean false
      def plugin_name "operator"
      def plugin_fn ""
      def is_plugin false
      def is_pure false
      def is_static_fn false
      def static_fn_name ""
      def static_class_name ""
      def static_nameNode@(weak):CodeNode
      if (nameNode.hasFlag("newcontext")) {
        ctx = (inCtx.fork())
        has_eval_ctx = true
      }       
      def throws_exception ( nameNode.hasFlag("throws"))
      def is_async ( nameNode.hasFlag("async"))
      ; if (nameNode)
      def expanding_node:boolean (nameNode.hasFlag("expands"))
      if ( (callerArgCnt == fnArgCnt) || expanding_node) {
        def details_list:CodeNode (itemAt ch.children 3)
        def langOper:CodeNode (this.findLanguageOper( details_list ctx ch ))
        if(null? langOper) {
;            ctx.addError( callArgs "Did not find language based operator")
          continue
        }
        is_pure = ( nameNode.hasFlag("pure"))
        if( ( langOper.hasBooleanProperty("macro") ) || ( (nameNode.hasFlag("macro")))  ) {
          is_macro = true
        }
        if( langOper.hasStringProperty("plugin") ) {
          plugin_name = ( langOper.getStringProperty('plugin') )
          is_plugin = true
          def pluginFn ( langOper.getStringProperty('fn'))
          if( has pluginFn ) {
            plugin_fn = pluginFn
            print "Function : " + plugin_fn
          }
        }
        def codeDef (langOper.getSecond())        
        def match:RangerArgMatch (new RangerArgMatch ())
        def last_walked:int 0

        def last_was_block false
        def walk_later:[WalkLater]
        def not_enough_args false
        def blocksToWalkLater@(weak):[CodeNode]

        if(ch.hasExpressionProperty("flags")) {
            def flagList (ch.getExpressionProperty("flags"))
            def b_matched false
            flagList.children.forEach({
                b_matched = (b_matched || (ctx.hasCompilerFlag(item.vref))) 
            })
            if( b_matched == false ) { 
                continue
            } 
        }
        ctx.setInExpr()
        for args.children arg@(lives):CodeNode i {
          
          if( i < arg_eval_start) {
            continue
          }
          arg_eval_start = i
          if( (array_length callArgs.children) <= (i + 1)) {
            not_enough_args = true
            break
          }
          def callArg@(lives):CodeNode (itemAt callArgs.children (i + 1))
          if (arg.hasFlag("define")) {
            def p@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
            p.name = callArg.vref
            p.value_type = arg.value_type
            p.node = callArg
            p.nameNode = callArg
            p.is_optional = false
            p.init_cnt = 1
            ctx.defineVariable(p.name p)

            callArg.hasParamDesc = true
            callArg.ownParamDesc = p
            callArg.paramDesc = p
            if ((strlen callArg.type_name) == 0) {
              callArg.type_name = arg.type_name
              callArg.value_type = arg.value_type
            }
            callArg.eval_type = arg.value_type
            callArg.eval_type_name = arg.type_name
          }
          if (arg.hasFlag("ignore")) {
            continue _
          }
          if (arg.hasFlag("keyword")) {
            ; print "keywords " + callArg.vref + " arg " + arg.vref
            if( callArg.vref != arg.vref) {
              not_enough_args = true
            }
            continue _
          }
          if (arg.hasFlag("noeval")) {
            callArg.eval_type = callArg.value_type
            callArg.eval_type_name = callArg.type_name
            callArg.eval_array_type = callArg.array_type
            callArg.eval_key_type = callArg.key_type
            continue _
          }            
          last_walked = (i + 1)

          ; anonymous fn or Lambda argument
          if( arg.value_type == RangerNodeType.ExpressionType ) {

            def opList (ctx.getOpFns(callArg.vref))
            if(has opList) {
              def signature (arg.expression_value.copy())
              def params (at signature.children 1)
            }            
            if(codeDef.is_block_node == false) {
              def later (new WalkLater)
              later.arg = arg
              later.callArg = callArg
              push walk_later later              
            }  
          } {
            if(arg.type_name == "block" || (arg.hasFlag("block"))) {
              if( arg.hasFlag("try_block")) {
                def tmpCtx@(lives) (ctx.fork())
                tmpCtx.is_try_block = true
                callArg.evalCtx = tmpCtx            
                tmpCtx.newBlock()
                this.WalkNode(callArg tmpCtx wr)
              } {
                def tmpCtx@(lives) (ctx.fork())
                tmpCtx.newBlock()
                callArg.evalCtx = tmpCtx            
                this.WalkNode(callArg tmpCtx wr)
              }

              last_was_block = true
            } {
              ctx.setInExpr()
              this.WalkNode(callArg ctx wr)
              ctx.unsetInExpr()

              ; union conversion...
              if( (strlen arg.type_name) > 0 ) {
                this.convertToUnion( arg.type_name callArg ctx wr)
              }
              last_was_block = false
            }
            if( arg.hasFlag("mutates")) {
              if(callArg.hasParamDesc) {
                if(callArg.paramDesc && (!null? callArg.paramDesc.propertyClass)) {
                  if(callArg.paramDesc.propertyClass.nameNode.hasFlag("immutable")) {
                    def propC (callArg.paramDesc.propertyClass)
                    def currC (ctx.getCurrentClass())
                    if( (unwrap currC) != (unwrap propC) ) {
                      ; --> skip as if error                      
                      not_enough_args = true
                      ; ctx.addError(callArg "Not possible to modify immutable class property")
                    }                 
                  }
                }
              }
            }            
          }
        }
        ctx.unsetInExpr()
        if not_enough_args {
          continue
        }
        if expanding_node {
          for callArgs.children caCh:CodeNode i2 {
            ; do not walk immediately the blocks
            if(caCh.is_block_node) {
              def tmpCtx@(lives) ctx
              caCh.evalCtx = tmpCtx
              push blocksToWalkLater caCh
              continue
            }
            if(i2 > last_walked) {
              if last_was_block {
                def sCtx (ctx.forkWithOps( (itemAt ch.children 3) ))
                this.WalkNode(caCh sCtx wr)
              } {
                ctx.setInExpr()
                this.WalkNode(caCh ctx wr)
                ctx.unsetInExpr() 
              }                                             
            }
          }
        }
        
        def all_matched:boolean (match.matchArguments(args callArgs ctx 1))

        if all_matched {

          def expr_level (ctx.expressionLevel())
          def is_last false
          
          if(!null? callArgs.parent) {
            is_last = ( (size callArgs.parent.children) == ( 1 + ( indexOf callArgs.parent.children callArgs ) ) )
          }

          if(  (fc.vref == 'if') && (ctx.hasCompilerFlag('voidexpr')) && ( expr_level > 0 || is_last) ) {

            print "IF expr leve == " +( ctx.expressionLevel() )

            print (callArgs.getCode())

            ; simple eval test, works only for strings...
            def thenBlock (at callArgs.children 2)
            def lastRow (last thenBlock.children)

            print "Last row == " + (lastRow.getCode())

            def BlockOP (ctx.getLastBlockOp())
            def regName (ctx.createNewRegName())
            def regExpr (r.expression (r.vref 'def') (r.vref regName lastRow.eval_type_name) )

            callArgs.eval_type = lastRow.eval_type
            callArgs.eval_type_name = lastRow.eval_type_name

            def fnC (ctx.findFunctionCtx())

            this.WalkNode( regExpr fnC wr )
            def realRegName ( (at regExpr.children 1) .paramDesc.compiledName ) 
            
            def then_regs false
            if( has lastRow.register_name ) {
              def newLastRow (r.expression (r.vref '=') (r.vref regName) (r.vref lastRow.register_name) ))
              this.WalkNode( newLastRow ctx wr )
              push thenBlock.children newLastRow
              then_regs = true
            } {
              def vCopy (lastRow.cleanCopy())
              lastRow.expression = true
              lastRow.vref = ""
              lastRow.value_type = RangerNodeType.NoType
              lastRow.flow_done = false  
              lastRow.getChildrenFrom( (r.expression (r.vref '=') (r.vref regName) vCopy ))
              this.WalkNode( lastRow ctx wr )
            }

            if( (size callArgs.children ) == 4) {
              def elseBlock (at callArgs.children 3)
              def lastRow (last elseBlock.children)
              if( has lastRow.register_name ) {
                def newLastRow (r.expression (r.vref '=') (r.vref regName) (r.vref lastRow.register_name) ))
                this.WalkNode( newLastRow ctx wr )
                push elseBlock.children newLastRow
                then_regs = true
              } {
                def vCopy (lastRow.cleanCopy())
                lastRow.expression = true
                lastRow.vref = ""
                lastRow.value_type = RangerNodeType.NoType
                lastRow.flow_done = false  
                lastRow.getChildrenFrom( (r.expression (r.vref '=') (r.vref regName) vCopy ))
                print " lastRow value --> " + (vCopy.getCode())
                this.WalkNode( lastRow ctx wr )             
              }
            }
            def tmp@(temp) (callArgs.clone())
            BlockOP.register_expressions.push( regExpr )     
            BlockOP.register_expressions.push( tmp )             
            ; callArgs.register_name = realRegName
            callArgs.register_name = regName
            callArgs.reg_compiled_name = realRegName

            tmp.has_operator = true
            tmp.op_index = main_index
            tmp.operator_node = ch


            return true
          }

          ; (fc.vref != 'if') && (fc.vref != 'if!')
          if(  (fc.vref != 'for') && (ctx.hasCompilerFlag('new')) ) {
            def opDef (langOper.getSecond())
            def opCnts:[int:int]
            def regNames:[int:string]
            def firstRef@(weak):[int:CodeNode]
            ; possible multiple evaluations for an item...              
            forEach args.children {
              def opArg item
              if( (opArg.hasFlag('loopcondition')) ) {

                def loopBlock:CodeNode  
                forEach args.children {
                  if(item.hasFlag('loopblock')) {
                    def tmp@(temp) (at callArgs.children (index + 1))
                    loopBlock = tmp
                  }
                }
                if(null? loopBlock) {
                  ctx.addError( args "Invalid operator: Loop condition without block ")
                  return
                }

                def opName (index + 1)
                def item (callArgs.children.at( (index + 1) ))
                ; print "LOOP condition found " + (item.getCode())
                def regName ""
                def realArg (at callArgs.children (opName))

                if( has realArg.register_name ) {
                  regName = realArg.register_name
                } {
                  regName = (ctx.createNewRegName())
                }
                def argCopy (realArg.copy())
                def regExpr (r.expression (r.vref 'def') (r.vref regName) argCopy)
                ; should be function ctx ? 
                ; def fnC (ctx.findFunctionCtx())

                ; print "while last op was " + (lastOp.getCode())

                ctx.lastBlockOp = callArgs
                this.WalkNode( regExpr ctx wr )

                def realRegName ( (at regExpr.children 1) .paramDesc.compiledName ) 

                def regArg (at regExpr.children 1)
                regArg.paramDesc.set_cnt = 1
                regArg.paramDesc.ref_cnt = 1

                def BlockOP (ctx.getLastBlockOp())
                BlockOP.register_expressions.push( regExpr )

                realArg.register_name = regName
                realArg.reg_compiled_name = realRegName
                forEach callArgs.children {
                  if(item.is_block_node) {
                    def argCopy (realArg.copy())
                    argCopy.register_name = ""
                    argCopy.forTree({
                      item.register_name = ""
                    })
                    def eval_expr@(lives) (r.expression (r.vref '=') (r.vref regName) argCopy)

                    def lastOp@(lives) (at loopBlock.children ( (size loopBlock.children) - 1) )
                    ctx.lastBlockOp = eval_expr

                    this.WalkNode( eval_expr ctx wr )
                    push item.children eval_expr
                    ; print "pushed " + (eval_expr.getCode())
                  }
                }
              }
            }

            opDef.children.forEach({
              if(item.isFirstVref('e')) {
                if( (item.hasFlag('ignore')) || (item.hasFlag('noeval')) ) {
                  return
                }
                def opName ((item.getSecond()).int_value)
                def opArg (at args.children (opName - 1))
                if( (has opCnts opName ) ) {
                  ; print (langOper.getCode())
                  ; print "several uses of e " + opName + " => " + (callArgs.getCode())
                  ; print "  ^ " + (opDef.getCode())
                  ; find function level context              

                  def regName ""
                  def realArg (at callArgs.children (opName))
                  def just_vref (fn:boolean (a:CodeNode) {
                    return false
                  })

                  just_vref = (fn:boolean (a:CodeNode) {
                    if( has a.vref ) {
                      return true
                    }
                    if( TTypes.isPrimitive( a.value_type ) )  {
                      return true
                    }
                    if( (size a.children ) == 1 ) {
                      return ( just_vref( (at a.children 0)) )
                    }
                    return false
                  })
                  if(just_vref(realArg)) {
                    return
                  }

                  if( has regNames opName ) {
                    if( has realArg.register_name ) {
                      regName = realArg.register_name
                    } {
                      regName = (unwrap (get regNames opName))
                    }
                    realArg.register_name = regName
                  } {
                    if( has realArg.register_name ) {
                      regName = realArg.register_name
                    } {
                      regName = (ctx.createNewRegName())
                      ; print "creating def for " + regName
                      set regNames opName regName
                      ; define the register...
                      def argCopy (realArg.copy())
                      def regExpr (r.expression (r.vref 'def') (r.vref regName) argCopy)
                      ; should be function ctx ? 
                      ; def fnC (ctx.findFunctionCtx())
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

                      ; print "last block was" + (BlockOP.getCode())
                    }
                  }

                } {
                  set opCnts opName 1
                  set firstRef opName item
                }
              }
            })
            
          }

        }

        if all_matched {

          if is_async {
            def activeFn (ctx.getCurrentMethod())            
            if( (!null? activeFn.nameNode) ) {
              activeFn.nameNode.setFlag('async')
            }
            while( !null? activeFn.insideFn) {
              activeFn = (unwrap activeFn.insideFn)
              if( (!null? activeFn.nameNode) ) {
                activeFn.nameNode.setFlag('async')
              }
            }
          }
          if throws_exception {
              if( false == (ctx.isTryBlock())) {
                  def activeFn (ctx.getCurrentMethod())
                  if( (!null? activeFn.nameNode) &&  ( activeFn.nameNode.hasFlag("throws")) ) {
                      ; if marked as throws it's ok
                  } {
                      ctx.addError(callArgs ('The operator ' + fc.vref + " potentially throws an exception, try { } block is required"))
                  }
              }
          }
          for blocksToWalkLater b:CodeNode i {
            def localFork (b.evalCtx.fork())
            this.WalkNode(b localFork wr)            
          }

          for walk_later later:WalkLater i {
            def ca (unwrap later.callArg)
            def aa (unwrap later.arg)


            def newNode:CodeNode (new CodeNode ( (unwrap ca.code) ca.sp ca.ep))

            ; avoid re-transforming already transformed functions
            
            ; transform only blocks
            if( ca.is_block_node && ((ca.isFirstVref("fn")) == false ) && ((ca.isFirstVref("fun")) == false )) {

              ; print "transforming " + (ca.getCode())
              ; def match:RangerArgMatch (new RangerArgMatch ())
              def fnDef:CodeNode (unwrap aa.expression_value)
              def copyOf:CodeNode (fnDef.rebuildWithType( match false ))
              def ffc:CodeNode (itemAt copyOf.children 0)
              ffc.vref = "fun"
              def itemCopy:CodeNode (ca.rebuildWithType (match false))
              push copyOf.children itemCopy
              def cnt:int ( array_length ca.children )
              while( cnt > 0) {
                removeLast ca.children
                cnt = cnt - 1
              }
              for copyOf.children ch@(lives):CodeNode i {
                push ca.children ch
              }
            }
            ; --> 
            ; def sCtx (ctx.forkWithOps( (itemAt ch.children 3) ))
            def sCtx (ctx.fork())
            sCtx.newBlock()
            this.WalkNode(ca sCtx wr)
            ; last_was_block = true 

          }
        }         
        def staticMethod:RangerAppFunctionDesc

        if(codeDef.is_block_node  && (all_matched)) {

          def pure_transform (ctx.hasCompilerFlag("pure"))
          ; -- could do a pure function transformation here ---
          if ( is_pure && pure_transform ) {            
            def argDefs (CodeNode.blockFromList(
                (args.children.map({
                  def callArg (itemAt callArgs.children (index + 1))
                  def arg item
                  def vName (item.copy())
                  def caCopy (callArg.copy())
                  def prms (this.transformParams2( ([] _:CodeNode (callArg) ) ([] _:CodeNode (arg) ) (ctx) ))
                  def firstp (itemAt prms 0)
                  def ad (r.op "def" vName firstp )
                  return ad
                }))
            ))
            def bodyStart (r.block   
                            argDefs
                            codeDef
                         )
            def newCtx (ctx.fork())
            def bodyCopy (bodyStart.rebuildWithType(match true))
            callArgs.flow_done = false
            callArgs.getChildrenFrom( bodyCopy )
            this.WalkNode ( callArgs newCtx wr)
            return true
          }
          ; -- could do a pure function transformation here ---

          def nSig ""
          if( (array_length args.children) > 0) {
            def arg0 (args.getFirst())
            nSig = ( (this.getNameSignature(arg0)) )
          } {
            nSig = ( (this.getVoidNameSignature()) )              
          }
          ;print "---- static method ----"
          ;print "arg0 " + (arg0.getCode())
          def new_cl ( ctx.createOpStaticClass(  nSig ) )
          this.WalkNode( (unwrap new_cl.classNode ) ctx wr)
          def bodyCopy (codeDef.rebuildWithType(match true))
          def argsCopy (args.rebuildWithType(match true))
          def nameCopy (nameNode.rebuildWithType(match true))

          def sigN (ctx.transformOpNameWord( fc.vref ))
          def argsSig ( sigN + (this.getArgsSignature(argsCopy)) )

          if( false == (new_cl.hasStaticMethod(argsSig))) {
            
            def sMethod@(lives) ( ctx.createStaticMethod( argsSig new_cl nameCopy argsCopy bodyCopy this wr) )
            staticMethod = sMethod
            def currM (ctx.getCurrentMethod())
            currM.addCallTo( sMethod )

            static_nameNode = nameCopy
            def fCtx (unwrap sMethod.fnCtx)
            fCtx.currentMethod = sMethod 
            fCtx.is_function = true
            def m:RangerAppFunctionDesc sMethod

            fCtx.in_static_method = true
            if (nameCopy.hasFlag("weak")) {
              m.changeStrength(0 1 nameNode)
            } {
              m.changeStrength(1 1 nameNode)
            }
            fCtx.setInMethod()
            for m.params v@(lives):RangerAppParamDesc i {
              fCtx.defineVariable(v.name v)
              v.nameNode.eval_type = (v.nameNode.typeNameAsType(fCtx))
              v.nameNode.eval_type_name = v.nameNode.type_name
            }
            this.WalkNodeChildren( bodyCopy fCtx wr)
            fCtx.unsetInMethod()
            fCtx.in_static_method = false
            fCtx.function_level_context = true
            ;if (fnBody.didReturnAtIndex == -1) {
            ;  if (cn.type_name != "void") {
            ;    ctx.addError(node "Function does not return any values!")
            ;  }
            ;}
            for fCtx.localVarNames n:string i {
              def p:RangerAppParamDesc (get fCtx.localVariables n)
              if (p.set_cnt > 0) {
                if(p.is_immutable) {
                  ctx.addError( callArgs "Immutable variable was assigned")
                }
                def defNode:CodeNode p.node
                defNode.setFlag("mutable")
                def nNode:CodeNode p.nameNode
                nNode.setFlag("mutable")
              }
            }       
          } {
            def sMethod ( new_cl.findStaticMethod( argsSig ) )
            static_nameNode = sMethod.nameNode            
            def currM (ctx.getCurrentMethod())
            currM.addCallTo((unwrap sMethod ) )
            staticMethod = sMethod
          }     
          is_static_fn = true
          static_fn_name = argsSig
          static_class_name = new_cl.name
        }
        if all_matched {

          if is_static_fn {

            def firstArg (callArgs.getFirst())
            firstArg.vref = static_class_name + "." + static_fn_name
            firstArg.flow_done = false
            firstArg.value_type = RangerNodeType.VRef
            clear firstArg.ns
            push firstArg.ns static_class_name
            push firstArg.ns static_fn_name

            def newArgs:CodeNode (new CodeNode ( (unwrap callArgs.code) callArgs.sp callArgs.ep) )
            ; note: noeval flag is used here to mark a parameter which is matched but not evaluated
            ; if(arg.hasFlag("noeval"))
            for callArgs.children ca:CodeNode i {
              if ca.is_part_of_chain {
                continue
              }
              if( i > 0) {
                def arg (itemAt args.children (i - 1))
                if( arg.hasFlag("noeval")) {
                  continue
                }                
                push newArgs.children ca
              }
            }
            def arg_len:int (array_length callArgs.children)
            while (arg_len > 1 ) {
              removeLast callArgs.children
              arg_len = arg_len - 1
            }
            push callArgs.children newArgs

            callArgs.flow_done = false
            this.WalkNode ( callArgs ctx wr)


            def currMM@(lives) (ctx.getCurrentMethod())

            for newArgs.children ca:CodeNode i {
              if(ca.eval_type == RangerNodeType.ExpressionType) {
                ; print "--> EXPRESSION"
                if(!null? ca.lambdaFnDesc) {
                  ; print "--> and has lambdaFnDesc"
                  if(!null? staticMethod) {
                    ; is it possible to call using async operator?
                    staticMethod.addCallTo( (unwrap ca.lambdaFnDesc ) )
                    if( ca.lambdaFnDesc.nameNode.hasFlag('async')) {
                      ; print "ASYNC with lambdaFnDesc"
                      staticMethod.nameNode.setFlag('async')
                    }
                  }
                }
              }
              ca.forTree({
                if( (!null? item.fnDesc) ) {
                  if(!null? staticMethod) {
                    ; print "--> CA tree had also call"
                    staticMethod.addCallTo( (unwrap item.fnDesc ) )
                  }
                }
              })
            }
            
            match.setRvBasedOn((unwrap static_nameNode) callArgs)        
            ctx.removeOpNs( added_ns )      
            return true
          }
          if is_plugin {
            try {
              def fileName ( (current_directory) + "/" + plugin_name)
              print "trying to load plugin: " + fileName
              def plugin (load_compiler_plugin fileName )
              call_plugin plugin plugin_fn callArgs ctx wr
              callArgs.flow_done = false
              this.WalkNode( callArgs ctx wr)
              match.setRvBasedOn(nameNode callArgs)       
              ctx.removeOpNs( added_ns )      
              print "plugin ready..."
            } {
              ctx.addError( callArgs ('Plugin operator failed ' + (error_msg)) )
            }
            return true 
          }

          if is_macro {
            def macroNode:CodeNode ( this.buildMacro( langOper callArgs ctx ) )
            def arg_len:int (array_length callArgs.children)
            while (arg_len > 0 ) {
              removeLast callArgs.children
              arg_len = arg_len - 1
            }
            push callArgs.children macroNode
            macroNode.parent = callArgs
            this.WalkNode( macroNode ctx wr)
            match.setRvBasedOn(nameNode callArgs)       
            ; print "--- macro was walked -- " 
            ctx.removeOpNs( added_ns )      
            return true 
          }

          if (nameNode.hasFlag("moves")) {
            def moves_opt@(optional):CodeNode (nameNode.getFlag("moves"))
            def moves:CodeNode (unwrap moves_opt)
            def ann:CodeNode moves.vref_annotation
            def from:CodeNode (ann.getFirst())
            def toItem:CodeNode (ann.getSecond())
            def cA:CodeNode (itemAt callArgs.children from.int_value)
            def cA2:CodeNode (itemAt callArgs.children toItem.int_value)
            if cA.hasParamDesc {
              def pp:RangerAppParamDesc cA.paramDesc
              def pp2:RangerAppParamDesc cA2.paramDesc
              pp.moveRefTo(callArgs (unwrap pp2) ctx)
            }
          }
          if (nameNode.hasFlag("returns")) {
;              print "==> returns flag for " + (callArgs.getLineAsString())
            def activeFn:RangerAppFunctionDesc (ctx.getCurrentMethod())
            if ( (activeFn.nameNode.type_name != "void") || (activeFn.nameNode.value_type == RangerNodeType.ExpressionType)) {
              
              if ( (array_length callArgs.children) < 2 ) {
                ctx.addError(callArgs " missing return value !!!")
              } {
                def returnedValue:CodeNode (itemAt callArgs.children 1)
                def validated_returnvalue false
                if(activeFn.nameNode.value_type == RangerNodeType.ExpressionType) {
                  validated_returnvalue = true
                  ; lambda format of the called function
                  def fnExpr (activeFn.nameNode.expression_value)
                  if(null? fnExpr) {
                    ctx.addError( (unwrap activeFn.nameNode) "returned anonymous function should have a method signature")
                  } {
                    if( (returnedValue.value_type != RangerNodeType.ExpressionType ) &&
                        (returnedValue.eval_type != RangerNodeType.ExpressionType) ) {
                        ctx.addError(returnedValue "Function should return anonymous function!")
                    } {
                      
                      if( returnedValue.hasParamDesc && (!null? returnedValue.paramDesc.nameNode)) {
                        def rExpr returnedValue.paramDesc.nameNode.expression_value
                        this.matchLambdaArgs( (unwrap fnExpr) (unwrap rExpr) ctx wr )
                      } {
                        def rExpr returnedValue.expression_value
                        this.matchLambdaArgs( (unwrap fnExpr) (unwrap rExpr) ctx wr )
                      }
                    }
                  }
                }

                if( validated_returnvalue == false ) {
                  if ((match.doesMatch( (unwrap activeFn.nameNode) returnedValue ctx)) == false) {
                    if(activeFn.nameNode.ifNoTypeSetToEvalTypeOf( returnedValue)) {
                      ; sets the type
                    } {
                      ctx.addError(returnedValue "invalid return value type!!! "  + (returnedValue.getCode()))
                      ctx.addError(returnedValue "^ code: "  + (returnedValue.getCode()))
                      ctx.addError( (unwrap activeFn.nameNode) "^ regarding to")
                      if( returnedValue.eval_type == RangerNodeType.Method) {
                        ctx.addError( (unwrap activeFn.nameNode) "^ which was a method")
                      }
                      ctx.addError( (unwrap activeFn.nameNode) ( '^ value type = ' + returnedValue.eval_type) )
                    }
                  }
                }
                def argNode:CodeNode (unwrap activeFn.nameNode)
                if( returnedValue.hasFlag("optional")) {
                  if ( false == (argNode.hasFlag("optional")) ) {
                      ctx.addError(callArgs ( 'function return value optionality does not match, expected non-optional return value, optional given at ' + (argNode.getCode())) )      
                  }
                }
                
                if( argNode.hasFlag("optional")) {
                  if ( false == (returnedValue.hasFlag("optional")) ) {
                      ctx.addError(callArgs ( 'function return value optionality does not match, expected optional return value ' + (argNode.getCode())) )          
                  }
                }
                
                def pp:RangerAppParamDesc returnedValue.paramDesc
                if (!null? pp) {
                  pp.moveRefTo(callArgs activeFn ctx)
                }


              }
            }
            if (null? callArgs.parent) {
              ctx.addError(callArgs "did not have parent")
              print ('no parent => ' + (callArgs.getCode()))
            }
            callArgs.parent.didReturnAtIndex = (indexOf callArgs.parent.children callArgs)
          }
          if ((nameNode.hasFlag("returns")) == false) {
            match.setRvBasedOn(nameNode callArgs)
            callArgs.evalTypeClass = (TFactory.new_def_signature( nameNode ctx wr ))
          }
          if has_eval_ctx {
            def tmpCtx@(lives) ctx
            callArgs.evalCtx = tmpCtx
          }
          def nodeP:CodeNode callArgs.parent
          if (!null? nodeP) {
          } {
          }
          def sig:string (nameNode.buildTypeSignatureUsingMatch(match))
          ; def ts:RangerTypeClass (callArgs.createTypeSignatureForName(sig ctx))
          ; callArgs.typeClass = ts
          some_matched = true
          callArgs.has_operator = true
          callArgs.op_index = main_index
          callArgs.operator_node = ch
          for args.children arg:CodeNode arg_index {
            if arg.has_vref_annotation {
              def anns:CodeNode arg.vref_annotation
              for anns.children ann:CodeNode i {
                if (ann.vref == "mutates") {
                  def theArg:CodeNode (itemAt callArgs.children (arg_index + 1))
                  if theArg.hasParamDesc {
                    theArg.paramDesc.set_cnt = (theArg.paramDesc.set_cnt + 1)
                  }
                }
              }
            }
          }
          ; print "some_matched for op operator_node -> " + (ch.getLineAsString())
          break _
        }
      }
    
    }
    if ( require_all_match == true && some_matched == false) {
      ctx.addError(callArgs ('Could not match argument types for ' + callFnName.vref))
    } 
    if(expects_error) {
      def cnt_now:int (ctx.getErrorCount())
      if (cnt_now == err_cnt) {
        ctx.addParserError( callArgs "LANGUAGE_PARSER_ERROR: expected generated error, err counts : " + err_cnt + " : " +cnt_now)
      }
    } {
      def cnt_now:int (ctx.getErrorCount())
      if (cnt_now > err_cnt) {
        ctx.addParserError( callArgs "LANGUAGE_PARSER_ERROR: did not expect generated error, err counts : " + err_cnt + " : " +cnt_now)
      }      
    }
    ctx.removeOpNs( added_ns )
    return some_matched
  }
    
}