
extension RangerFlowParser {

  fn findLanguageOper@(optional weak):CodeNode (details:CodeNode ctx:RangerAppWriterContext) {
    def langName:string (ctx.getTargetLang())
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
                    b_matched = (b_matched || (ctx.hasCompilerFlag(item.vref))) 
                })
                if( b_matched == false ) { 
                    continue
                } 
            }
            def tplName:CodeNode (tpl.getFirst())
            if ((tplName.vref != "*") && (tplName.vref != langName)) {
              continue 
            }            
            rv = tpl
            return rv
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
      }
      ;walkCommandList:void (cmd:CodeNode node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
      lcc.walkCommandList( cmdList args subCtx wr )
      def lang_str:string (wr.getCode())
      def lang_code:SourceCode (new SourceCode ( lang_str ) )
      lang_code.filename = "<macro " + macroNode.vref + ">"
      def lang_parser:RangerLispParser (new RangerLispParser (lang_code))
      lang_parser.parse((ctx.hasCompilerFlag("no-op-transform")))

      def node@(lives):CodeNode (unwrap lang_parser.rootNode)
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

    ; TODO: continue pushing the operators into the methodChain
    ; + add into the method chain the detected operator
    ; + check that chain can be a mix of actual operators or calls
    ; surround_static( (static_fn_foo()).map() ).filter()
    def in_chain false
    def call_arg_cnt 0
    for callArgs.children ca:CodeNode i {
      def name (ca.vref)
      if( ( (strlen name) > 0 ) && ( ( charAt name 0) == (charcode ".")) ) {
        in_chain = true
        ca.is_part_of_chain = true
      }
      if in_chain {
        ca.is_part_of_chain = true
      } {
        call_arg_cnt = call_arg_cnt + 1
      }
    }

    if in_chain {
;      print "in chain " + (callArgs.getCode())
      def fc (callArgs.getFirst())   
      def sc (callArgs.getSecond())
      def thrd (callArgs.getThird())
      def i call_arg_cnt
      def chainRoot:CodeNode (callArgs)
      def innerNode@(weak):CodeNode

      def newNode (r.expression (fc.copy()) (sc.copy()) (thrd.copy()) )
      innerNode = newNode
      def chain_cnt 0
      def chlen (array_length callArgs.children)

      while ( i < (chlen - 1) ) {
        def fc (itemAt callArgs.children i)
        def args@(lives) (itemAt callArgs.children (i + 1))
        def name (fc.vref)
        if( ( (strlen name) > 0 ) && ( ( charAt name 0) == (charcode ".")) ) {
          def method_name (substring name 1 (strlen name))          
          def newNode (r.op "call" (innerNode.copy()) (r.vref method_name) (args.copy()) )          
          innerNode = newNode
          chain_cnt = chain_cnt + 1
        } {
          ctx.addError(callArgs "Invalid chaining op")
        }
        i = i + 2
      }
      if ( chain_cnt > 0 ) {
        callArgs.getChildrenFrom( (unwrap innerNode ) )
        callArgs.tag = "chainroot"
        callArgs.flow_done = false
        this.WalkNode( callArgs ctx wr)
        return true
      } {
        ctx.addError( callArgs "Invalid chain")
        return true
      }
    }
    def op_list (ctx.getOperators(callFnName.vref))

    for op_list ch@(lives):CodeNode main_index {

      def fc:CodeNode (ch.getFirst())
      def nameNode:CodeNode (ch.getSecond())
      def args:CodeNode (ch.getThird())
      
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
      ; if (nameNode)
      def expanding_node:boolean (nameNode.hasFlag("expands"))
      if ( (callerArgCnt == fnArgCnt) || expanding_node) {
        def details_list:CodeNode (itemAt ch.children 3)
        def langOper:CodeNode (this.findLanguageOper( details_list ctx ))
        if(null? langOper) {
;            ctx.addError( callArgs "Did not find language based operator")
          continue
        }
        is_pure = ( nameNode.hasFlag("pure"))
        if( ( langOper.hasBooleanProperty("macro") ) || ( (nameNode.hasFlag("macro")))  ) {
          is_macro = true
        }
        def codeDef (langOper.getSecond())        
;          if(codeDef.is_block_node) {
;            args = (args.rebuildWithType( (new RangerArgMatch) false ))
;          }
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
          if (arg.hasFlag("noeval")) {
            callArg.eval_type = callArg.value_type
            callArg.eval_type_name = callArg.type_name
            callArg.eval_array_type = callArg.array_type
            callArg.eval_key_type = callArg.key_type
            continue _
          }            
          last_walked = (i + 1)
          if( arg.value_type == RangerNodeType.ExpressionType ) {
            if(codeDef.is_block_node == false) {
              def later (new WalkLater)
              later.arg = arg
              later.callArg = callArg
              push walk_later later              
            }  
          } {
            ; ctx = (inCtx.forkWithOps( (itemAt ch.children 3) ))
            if(arg.type_name == "block" || (arg.hasFlag("block"))) {
              ;def sCtx (ctx.forkWithOps( (itemAt ch.children 3) ))
              ;print "-- walking block with context "
              ;print (sCtx.getContextInfo())

              ; push blocksToWalkLater callArg
              ; --> is this a try block
              if( arg.hasFlag("try_block")) {
                def tmpCtx@(lives) (ctx.fork())
                tmpCtx.is_try_block = true
                callArg.evalCtx = tmpCtx            
                this.WalkNode(callArg tmpCtx wr)
              } {
                def tmpCtx@(lives) ctx
                callArg.evalCtx = tmpCtx            
                this.WalkNode(callArg ctx wr)
              }

              last_was_block = true
            } {
              ; (inCtx.forkWithOps( (itemAt ch.children 3) ))
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
          if throws_exception {
              if( false == (ctx.isTryBlock())) {
                  def activeFn (ctx.getCurrentMethod())
                  if(activeFn.nameNode.hasFlag("throws")) {
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

            this.WalkNode(ca sCtx wr)
            ; last_was_block = true 

          }
        }         
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
                  def first (itemAt prms 0)
                  def ad (r.op "def" vName first )
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

          ; print "Args sig for " + nSig + " == " + (argsSig)

          if( false == (new_cl.hasStaticMethod(argsSig))) {
            def sMethod@(lives) ( ctx.createStaticMethod( argsSig new_cl nameCopy argsCopy bodyCopy this) )
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
          }     
          is_static_fn = true
          static_fn_name = argsSig
          static_class_name = new_cl.name
        }
        if all_matched {

          if is_static_fn {
            
            ; --> transfer code to static function call

            ;is_static_fn = true
            ;static_fn_name = sMethod.name

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
            match.setRvBasedOn((unwrap static_nameNode) callArgs)        
            ctx.removeOpNs( added_ns )      
            return true
          }

          if is_macro {
            ; TODO: check the effect of chaining here...
            def macroNode:CodeNode ( this.buildMacro( langOper callArgs ctx ) )
            ; print "macro: " + (macroNode.getCode())
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
            def to:CodeNode (ann.getSecond())
            def cA:CodeNode (itemAt callArgs.children from.int_value)
            def cA2:CodeNode (itemAt callArgs.children to.int_value)
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