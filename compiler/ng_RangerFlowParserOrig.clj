
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

  fn searchLib:string (paths:[string] libname:string) {
      for paths path:string i {
          if( file_exists path libname ) {
              return path 
          }
      }
      return ""
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

  fn cmdEnum:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def fNameNode:CodeNode (itemAt node.children 1)
    def enumList:CodeNode (itemAt node.children 2)
    def new_enum:RangerAppEnum (new RangerAppEnum ())
    for enumList.children item:CodeNode i {
      new_enum.add(item.vref)
    }
    set ctx.definedEnums fNameNode.vref new_enum
  }
  fn initStdCommands:void () {
  }

  fn findLanguageOper@(optional weak):CodeNode (details:CodeNode ctx:RangerAppWriterContext) {
    def langName:string (ctx.getTargetLang())
    def rv:CodeNode
    for details.children det:CodeNode i {        
      if ( (array_length det.children ) > 0) {
        def fc:CodeNode (itemAt det.children 0)
        if (fc.vref == "templates") {
          def tplList:CodeNode (itemAt det.children 1)
          for tplList.children tpl:CodeNode i {
            def tplName:CodeNode (tpl.getFirst())
            ; def tplImpl@(optional):CodeNode 
            ; tplImpl = (tpl.getSecond())
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
      ;walkCommandList:void (cmd:CodeNode node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
      lcc.walkCommandList( cmdList args subCtx wr )

      def lang_str:string (wr.getCode())
      ; print " macro generated code : " + lang_str

      def lang_code:SourceCode (new SourceCode ( lang_str ) )
      lang_code.filename = "<macro " + macroNode.vref + ">"
      def lang_parser:RangerLispParser (new RangerLispParser (lang_code))
      lang_parser.parse()

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
        ; list.add(2).add(2)
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
      def fc (callArgs.getFirst())   
      def sc (callArgs.getSecond())
      def thrd (callArgs.getThird())
      def i call_arg_cnt
      def chainRoot:CodeNode (callArgs)
      def innerNode@(weak):CodeNode
      def newNode (callArgs.newExpressionNode())
      newNode.children.push( (fc.copy()) ) ;   
      newNode.children.push( (sc.copy()) ) ; 
      newNode.children.push( (thrd.copy()) ) ; 
      innerNode = newNode
      def chain_cnt 0
      def chlen (array_length callArgs.children)

      while ( i < (chlen - 1) ) {
        def fc (itemAt callArgs.children i)
        def args@(lives) (itemAt callArgs.children (i + 1))
        def name (fc.vref)
        if( ( (strlen name) > 0 ) && ( ( charAt name 0) == (charcode ".")) ) {
          def method_name (substring name 1 (strlen name))
          def newNode (callArgs.newExpressionNode())
          newNode.add( (callArgs.newVRefNode("call") ) ) 
          newNode.add( (innerNode.copy() ) )
          newNode.add( (callArgs.newVRefNode(method_name)) )
          newNode.add( (args.copy()))
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

    ; print "stdParamMatch -> " + callFnName.vref    
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
      def is_static_fn false
      def static_fn_name ""
      def static_class_name ""
      def static_nameNode@(weak):CodeNode
      if (nameNode.hasFlag("newcontext")) {
        ctx = (inCtx.fork())
        has_eval_ctx = true
      }       
      def expanding_node:boolean (nameNode.hasFlag("expands"))
      if ( (callerArgCnt == fnArgCnt) || expanding_node) {
        def details_list:CodeNode (itemAt ch.children 3)
        def langOper:CodeNode (this.findLanguageOper( details_list ctx ))
        if(null? langOper) {
;            ctx.addError( callArgs "Did not find language based operator")
          continue
        }
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
              this.WalkNode(callArg ctx wr)
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
          for walk_later later:WalkLater i {
            def ca (unwrap later.callArg)
            def aa (unwrap later.arg)

            def newNode:CodeNode (new CodeNode ( (unwrap ca.code) ca.sp ca.ep))
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
            ; --> 
            ; def sCtx (ctx.forkWithOps( (itemAt ch.children 3) ))
            def sCtx (ctx.fork())

            this.WalkNode(ca sCtx wr)
            ; last_was_block = true 

          }
        }         
        if(codeDef.is_block_node  && (all_matched)) {

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

;            print "Args sig for " + nSig + " == " + (argsSig)

          if( false == (new_cl.hasStaticMethod(argsSig))) {
            def sMethod ( ctx.createStaticMethod( argsSig new_cl nameCopy argsCopy bodyCopy this) )
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
                      ctx.addError(returnedValue "invalid return value type!!!")
                    }
                  }
                }
                def argNode:CodeNode (unwrap activeFn.nameNode)
                if( returnedValue.hasFlag("optional")) {
                  if ( false == (argNode.hasFlag("optional")) ) {
                      ctx.addError(callArgs ( "function return value optionality does not match, expected non-optional return value, optional given at " + (argNode.getCode())) )      
                  }
                }
                
                if( argNode.hasFlag("optional")) {
                  if ( false == (returnedValue.hasFlag("optional")) ) {
                      ctx.addError(callArgs ( "function return value optionality does not match, expected optional return value " + (argNode.getCode())) )          
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
              print ("no parent => " + (callArgs.getCode()))
            }
            callArgs.parent.didReturnAtIndex = (indexOf callArgs.parent.children callArgs)
          }
          if ((nameNode.hasFlag("returns")) == false) {
            match.setRvBasedOn(nameNode callArgs)
          }
          if has_eval_ctx {
            callArgs.evalCtx = ctx
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
      ;print "===================== MATCH ERROR 2 ====================="
      ;print ("stdMatch -> Could not match argument types for " + callFnName.vref)
      ;print (callArgs.getCode())
      ;def line_index:int (callArgs.getLine())
      ;print ((callArgs.getFilename()) + " Line: " + line_index)
      ;for callArgs.children ca:CodeNode i {
      ;  print ((((((("arg " + i) + " eval_type : ") + ca.eval_type) + " eval_type_name = ") + ca.eval_type_name) + " type : ") + ca.type_name)
      ;}
      ctx.addError(callArgs ("Could not match argument types for " + callFnName.vref))
    } {
      ; match OK
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
  fn cmdImport:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    return false
  }
  fn getThisName:string () {
    return "this"
  }
  fn WriteThisVar:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }
  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (node.vref == "_") {
      return
    }

    def rootObjName:string (itemAt node.ns 0)
    if (ctx.isInStatic()) {
      if(rootObjName == "this") {
        ctx.addError(node "This can not be used in static context")
      }
    }
    if (ctx.isEnumDefined(rootObjName)) {
      def enumName:string (itemAt node.ns 1)
      def ee@(optional):RangerAppEnum (ctx.getEnum(rootObjName))
      def e:RangerAppEnum (unwrap ee)
      if (has e.values enumName) {
        node.eval_type = RangerNodeType.Enum
        node.eval_type_name = rootObjName
        node.int_value = (unwrap (get e.values enumName))
        ;def ts:RangerTypeClass (node.createTypeSignatureForName(rootObjName ctx))
        ;ts.value_type = RangerNodeType.Enum
        ;node.typeClass = ts
      } {
        ctx.addError(node ("Undefined Enum " + rootObjName + "." + enumName))
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
      }
    } {
      def class_or_this:boolean (rootObjName == (this.getThisName()))
      if (ctx.isDefinedClass(rootObjName)) {
        class_or_this = true
        node.eval_type = RangerNodeType.Class
        node.eval_type_name = rootObjName
      }
      if (ctx.hasTemplateNode(rootObjName)) {
        class_or_this = true
      }
      if (false == class_or_this) {
        def udesc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
        def desc:RangerAppClassDesc (unwrap udesc)

        if(node.vref == "fun") {
          ; print "TODO: fix the 'fun'"
        } {
          ctx.addError(node ("WriteVREF -> Undefined variable " + node.vref + " in class " + desc.name + " node : " + (node.getCode())))
          ctx.addError(node ("WriteVREF -> Undefined variable " + rootObjName + " in class " + desc.name + " node : " + (node.parent.getCode())))
        }


      }
      return
    }
  }
  fn CreateClass:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }
  fn DefineVar:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }
  fn WriteComment:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }
  fn cmdLog:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }
  fn cmdDoc:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }
  fn cmdGitDoc:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }
  fn cmdNative:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }
  fn LangInit:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }
  fn getWriterLang:string () {
    return "_"
  }
  fn StartCodeWriting:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }
  fn Constructor:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    this.shouldHaveChildCnt(3 node ctx "Method expexts four arguments")
    def cn:CodeNode (itemAt node.children 1)
    def fnBody:CodeNode (itemAt node.children 2)
    def udesc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
    def desc:RangerAppClassDesc (unwrap udesc)

    def m:RangerAppFunctionDesc desc.constructor_fn

; m.fnCtx
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
    node.eval_type = node.value_type
    switch node.value_type {
      case RangerNodeType.Double {
        node.eval_type_name = "double"
      }
      case RangerNodeType.String {
        node.eval_type_name = "string"
      }

      case RangerNodeType.Integer {
        node.eval_type_name = "int"
      }  
      case RangerNodeType.Boolean {
        node.eval_type_name = "boolean"
      }            
    }
  }
 
  fn buildGenericClass:void (tpl:CodeNode node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def root:RangerAppWriterContext (ctx.getRoot())
    def cn:CodeNode (tpl.getSecond())
    def newName:CodeNode (node.getSecond())
    def tplArgs:CodeNode cn.vref_annotation
    def givenArgs:CodeNode newName.vref_annotation
    def sign:string (cn.vref + (givenArgs.getCode()))
    if (has root.classSignatures sign) {
      return
    }
    print ("could build generic class... " + cn.vref)
    def match:RangerArgMatch (new RangerArgMatch ())
    for tplArgs.children arg:CodeNode i {
      def given:CodeNode (itemAt givenArgs.children i)
      print ((" setting " + arg.vref) + " => " + given.vref)
      if (false == (match.add(arg.vref given.vref  ctx))) {
        print "set failed!"
      } {
        print "set OK"
      }
      print (" T == " + (match.getTypeName(arg.vref)))
    }
    print (" T == " + (match.getTypeName("T")))
    def newClassNode:CodeNode (tpl.rebuildWithType(match false))
    print "build done"
    print (newClassNode.getCode())
    def sign:string (cn.vref + (givenArgs.getCode()))
    print ("signature ==> " + sign)
    def cName:CodeNode (newClassNode.getSecond())
    def friendlyName:string (root.createSignature(cn.vref sign))
    print ("class common name => " + friendlyName)
    cName.vref = friendlyName
    cName.has_vref_annotation = false
    print (newClassNode.getCode())
    this.WalkCollectMethods(newClassNode ctx wr)
    this.WalkNode(newClassNode root wr)
    print "the class collected the methods..."
  }
  fn cmdNew:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    ; "
    if ((array_length node.children) < 2) {
      ctx.addError(node "the new operator expects at lest two arguments")
      return
    }
    if ((array_length node.children) < 3) {
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
    
    if (ctx.hasTemplateNode(obj.vref)) {
      b_template = true
      def tpl:CodeNode (ctx.findTemplateNode(obj.vref))
      if obj.has_vref_annotation {
        this.buildGenericClass(tpl node ctx wr)
        currC = (ctx.findClassWithSign(obj))
        if (!null? currC) {
          print ("@@ class was found " + obj.vref)
        }
      } {
        ctx.addError(node "generic class requires a type annotation")
        return
      }
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
    }
    node.hasNewOper = true
    node.clDesc = currC
    def fnDescr:RangerAppFunctionDesc currC.constructor_fn
    if (!null? fnDescr) {
      if( (array_length fnDescr.params) > (array_length params.children)) {
        ctx.addError(node "Not enough arguments for class constructor " + (fnDescr.node.getLineAsString()))
        return
      }
      for fnDescr.params param:RangerAppParamDesc i {
        def has_default:boolean false
        if (param.nameNode.hasFlag("default")) {
          has_default = true
        }

        if( (array_length params.children) <= i) {
          if has_default {
            continue _
          }
          ctx.addError(node "Missing arguments for function")
          ctx.addError( (unwrap param.nameNode) "To fix the previous error: Check original function declaration")
        }

        def argNode:CodeNode (itemAt params.children i)

        if (false == (this.areEqualTypes( (unwrap param.nameNode) argNode ctx))) {
          ctx.addError(argNode ("ERROR, invalid argument type for " + currC.name + " constructor "))
        }

        def pNode:CodeNode (unwrap param.nameNode)
        if( pNode.hasFlag("optional")) {
          if ( false == (argNode.hasFlag("optional")) ) {
              ctx.addError(node ( "new parameter optionality does not match, expected optional parameter" + (argNode.getCode())) )          
          }
        }
        if( argNode.hasFlag("optional")) {
          if ( false == (pNode.hasFlag("optional")) ) {
              ctx.addError(node ( "new parameter optionality does not match, expected non-optional, optional given" + (argNode.getCode())) )          
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
        def fnArg:RangerAppParamDesc (itemAt fnArgs i)
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
        def fc:CodeNode (itemAt copyOf.children 0)
        fc.vref = "fun"
        ; then add the block as the last children
        def itemCopy:CodeNode (item.rebuildWithType (match false))
        push copyOf.children itemCopy
        def cnt:int ( array_length item.children )
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

  fn cmdCall:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
    def obj (node.getSecond())
    def method (node.getThird())
    def callArgs (itemAt node.children 3)

    ; test if the method could be operator
    ; (call 4 + (5))
    def possible_cmd method.vref
    def op_list (ctx.getOperators(possible_cmd))
    for op_list cmd:CodeNode i {

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
    }

    ; refresh the variables...
    def obj (node.getSecond())
    def method (node.getThird())
    def callArgs (itemAt node.children 3)

    this.WalkNode( obj ctx wr ) 

    if(ctx.isDefinedClass(obj.eval_type_name)) {
      def cl (ctx.findClass(obj.eval_type_name))
      def m (cl.findMethod(method.vref))
      if(!null? m) {
        node.has_call = true
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

        return true
      } {
        ctx.addError(node ("Class " + obj.eval_type_name + " does not have method " + method.vref))
        return false
      }
    }
    ; TODO: set the correct return value from the function call:

    def op_list (ctx.getOperators(method.vref))
    for op_list cmd:CodeNode i {
    }
    
    return true
  }  
 
  ; getAnon:(_:string ( n:string )) () 
  ; (fn:string (nn:string) {
  fn matchLambdaArgs:boolean (n1:CodeNode n2:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def chLen1 (array_length n1.children)
    def chLen2 (array_length n2.children)
    if(chLen1 < 2) {
      ctx.addError(n1 "Invalid Lambda definition, missing args or return value")
      return false
    }
    if(chLen2 < 2) {
      ctx.addError(n2 "Invalid Lambda definition, missing args or return value")
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

    if( (array_length argsExpr1.children) != (array_length argsExpr2.children) ) {
      ctx.addError(n2 "Invalid parameter count for the lambda expression")
      return false
    }

    argsExpr1.children.forEach({
      def item2 (itemAt argsExpr2.children index)
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
      def item2 (itemAt rvExpr2.children index)
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

  fn cmdLocalCall:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    ; " 
    def fnNode@(lives):CodeNode (node.getFirst())
    def udesc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
    def desc:RangerAppClassDesc (unwrap udesc)
    def expects_error:boolean false
    def err_cnt:int (ctx.getErrorCount())
    if( node.hasBooleanProperty("error")) {
      expects_error = true
    } 

    ; print "localCall : " + (node.getCode())
    ; print "childnode count : " + (array_length node.children)
    ; collect also the chain here..

    ; obj.foo() .bar() .foor2()
    ; --> obj.foo() will be the innerNode...

    def chlen (array_length node.children)

    if( chlen > 2) {
      def i 2
      def chainRoot:CodeNode (node)
      def innerNode@(weak):CodeNode
      def newNode (node.newExpressionNode())
      def sc (node.getSecond())
      newNode.add( (fnNode.copy()) )
      newNode.add( (sc.copy()) )
      innerNode = newNode

      def chain_cnt 0
      def b_valid true
      ; push the first into bottom of stack
      ; obj.foo.something ()
      while ( i < (chlen - 1) ) {
        def fc (itemAt node.children i)
        def args@(lives) (itemAt node.children (i + 1))
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


    if ((array_length fnNode.ns) > 1) {

      def rootName (itemAt fnNode.ns 0)
      def vDef2 (ctx.getVariableDef(rootName))
      if( (rootName != "this") && (vDef2.init_cnt == 0) && (vDef2.set_cnt == 0) ) {
        if( (vDef2.is_class_variable == false ) && ( (ctx.isDefinedClass(rootName)) == false ) ) {
          ctx.addError( node ("Call to uninitialized object " + rootName) )
        }
      }
      
      def vFnDef@(optional):RangerAppFunctionDesc (this.findFunctionDesc(fnNode ctx wr))
      if (!null? vFnDef) {

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
        def callParams:CodeNode (itemAt node.children 1)
        def nodeList:[CodeNode] (this.transformParams( callParams.children vFnDef.params subCtx))
        for nodeList arg:CodeNode i {
          ; expression as parameter is a lambda 
          ctx.setInExpr()
          if(arg.isFirstVref("fun")) {
            arg.flow_done = false
            arg.forTree({
              item.flow_done = false
            })
          }       
          this.WalkNode(arg subCtx wr)
          ctx.unsetInExpr()
          def fnArg:RangerAppParamDesc (itemAt vFnDef.params i)
          def callArgP:RangerAppParamDesc arg.paramDesc
          if (!null? callArgP) {
            callArgP.moveRefTo(node fnArg ctx)
          }
        }
        def cp_len:int (array_length callParams.children)
        if( cp_len > ( array_length vFnDef.params )) {
          def lastCallParam:CodeNode (itemAt callParams.children (cp_len - 1))
          ctx.addError( lastCallParam "Too many arguments for function")
          ctx.addError( (unwrap vFnDef.nameNode) "NOTE: To fix the previous error: Check original function declaration which was")
        }
        for vFnDef.params param:RangerAppParamDesc i {
          if( (array_length callParams.children) <= i) {
            if (param.nameNode.hasFlag("default")) {
              continue 
            }
            ctx.addError(node "Missing arguments for function")
            ctx.addError( (unwrap param.nameNode) "NOTE: To fix the previous error: Check original function declaration which was")
            break
          }
          def argNode:CodeNode (itemAt callParams.children i)
          if (false == (this.areEqualTypes( (unwrap param.nameNode) argNode ctx))) {
            ctx.addError(argNode ("ERROR, invalid argument type for method " + vFnDef.name))
          }
          def pNode:CodeNode (unwrap param.nameNode)
          if( pNode.hasFlag("optional")) {
            if ( false == (argNode.hasFlag("optional")) ) {
               ctx.addError(node ( "function parameter optionality does not match, consider making parameter optional " + (argNode.getCode())) )          
            }
          }
          if( argNode.hasFlag("optional")) {
            if ( false == (pNode.hasFlag("optional")) ) {
               ctx.addError(node ( "function parameter optionality does not match, consider unwrapping " + (argNode.getCode())) )          
            }
          }
        }
        def nn:CodeNode vFnDef.nameNode
        node.eval_type = (nn.typeNameAsType(ctx))
        node.eval_type_name = nn.type_name
        node.eval_array_type = nn.array_type
        node.eval_key_type = nn.key_type

        if(node.eval_type == RangerNodeType.ExpressionType) {
;           console.log("Call expression ", vFnDef.name, nn.expression_value.getCode())
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
      this.WriteThisVar(fnNode subCtx wr)
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
        if( (array_length node.children) <= (i + 1)) {
          ctx.addError(node "Argument was not defined")
          break
        }
                
        def argNode:CodeNode (itemAt node.children (i + 1))
        if (false == (this.areEqualTypes( (unwrap param.nameNode) argNode ctx))) {
          ctx.addError(argNode ("ERROR, invalid argument type for " + desc.name + " method " + fnDescr.name))
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

        if(d.nameNode.value_type == RangerNodeType.ExpressionType) {

          def cnNode1 (itemAt node.children 0)
          this.WalkNode(cnNode1 ctx wr)
          
          def lambdaDefArgs (itemAt d.nameNode.expression_value.children 1)
          def callParams:CodeNode (itemAt node.children 1)
          for callParams.children arg:CodeNode i {
            ctx.setInExpr()
            this.WalkNode(arg ctx wr)
            ctx.unsetInExpr()
          }
          ; function return value should be assigned 
          def lambdaDef (itemAt d.nameNode.expression_value.children 0)
          def lambdaArgs (itemAt d.nameNode.expression_value.children 1)

          def all_matched true
          if( (array_length callParams.children) != (array_length lambdaArgs.children) ) {
            ctx.addError(node "Invalid parameter count for the lambda expression")
          }

          lambdaArgs.children.forEach({
            def item2 (itemAt callParams.children index)
            ; note: eval types can be different
            if ( item2.eval_type_name != item.type_name ) {
              print "--> eval eval_type_name " + item2.eval_type_name + " <> " + item.type_name
              all_matched = false
            }
            if ( item2.eval_array_type != item.array_type ) {
              print "--> eval eval_array_type " + item2.eval_array_type + " <> " + item.array_type
              all_matched = false
            }
            if ( item2.eval_key_type != item.key_type ) {
              print "--> eval eval_key_type " + item2.eval_key_type + " <> " + item.key_type
              all_matched = false
            }
          })
          if( all_matched == false) {
            ctx.addError(node "Invalid types for lambda call")
          }

          ; matchLambdaArgs


          ; TODO: check the lambda function call arguments....
          ;for lambdaArgs.children lArg:CodeNode i {
          ;  lArg.defineNodeTypeTo( lArg ctx )
          ;  if( (array_length callParams.children) <= i) {
          ;    if (lArg.hasFlag("default")) {
          ;      continue 
          ;    }
          ;    ctx.addError(node "Missing arguments for function")
          ;    ctx.addError( lArg "NOTE: To fix the previous error: Check original function declaration which was")
          ;    break
          ;  }
          ;  def argNode:CodeNode (itemAt callParams.children i)
          ;  if (false == (this.areEqualTypes( lArg argNode ctx))) {
          ;    ctx.addError(argNode ("ERROR, invalid argument type for lambda call "))
          ;  }
          ;  def pNode:CodeNode lArg
          ;  if( pNode.hasFlag("optional")) {
          ;    if ( false == (argNode.hasFlag("optional")) ) {
          ;      ctx.addError(argNode ( "function parameter optionality does not match, consider making parameter optional " ) )          
          ;    }
          ;  }
          ;  if( argNode.hasFlag("optional")) {
          ;    if ( false == (pNode.hasFlag("optional")) ) {
          ;      ctx.addError(lArg ( "function parameter optionality does not match, consider unwrapping ") )          
          ;    }
          ;  }
          ;}          

          node.has_lambda_call = true
          node.eval_type = (lambdaDef.typeNameAsType(ctx))
          node.eval_type_name = lambdaDef.type_name
          node.eval_array_type = lambdaDef.array_type
          node.eval_key_type = lambdaDef.key_type
          return true
        })
    }
    return false
; -------------------------------------------------
    ctx.addError(node ("ERROR, could not find class " + desc.name + " method " + fnNode.vref))
    ctx.addError(node ("definition : " + (node.getCode())))
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
  fn cmdReturn:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    node.has_operator = true
    node.op_index = 5
    if ((array_length node.children) > 1) {
      def fc:CodeNode (node.getSecond())
      if (fc.vref == "_") {
      } {
        ctx.setInExpr()
        this.WalkNode(fc ctx wr)
        ctx.unsetInExpr()
        def activeFn:RangerAppFunctionDesc (ctx.getCurrentMethod())
        if fc.hasParamDesc {
          fc.paramDesc.return_cnt = (1 + fc.paramDesc.return_cnt)
          fc.paramDesc.ref_cnt = (1 + fc.paramDesc.ref_cnt)
        }
        def currFn:RangerAppFunctionDesc (ctx.getCurrentMethod())
        if fc.hasParamDesc {
          def pp:RangerAppParamDesc fc.paramDesc
          pp.moveRefTo(node currFn ctx)
        } {
        }        
      }
    }
  }

  ; obj.firstChild.name = "name of firstChild"
  ; obj = (call obj set_firstChild ( (call obj.firstChild set_name ("name of firstChild")) ))
  fn transformImmutableAssigment:CodeNode (node:CodeNode) {

    def target (node.getSecond())         ;  obj.firstChild.name
    def assign_value (node.getThird())    ; "name of firstChild"
    def root (node.newExpressionNode())

    root.add( (node.newVRefNode("=")))
    root.add( (node.newVRefNode( (itemAt target.ns 0)  ))) ; obj

    def i 1
    def cnt (array_length target.ns)
    def valueExpression (node.newExpressionNode())
    def obj_ref (itemAt target.ns 0)
    def currentParent@(weak temp) root
    while( i < cnt ) {
      def callExpr@(lives) (node.newExpressionNode())  
      callExpr.add( (node.newVRefNode("call")))
      callExpr.add( (node.newVRefNode(obj_ref)))
      def next_ref (itemAt target.ns (i))
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
            if( (itemAt target.ns 0) == "this" ) {
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
          } {

          }
        }
      }
    }

    def chlen (array_length node.children)
    ; res = test.foo()  <- 4 nodes
    if(chlen > 3) {
      def i 3
      def chainRoot:CodeNode (node.getThird())  ; test.foo
      def innerNode@(weak) (chainRoot)
      def chain_cnt 0
      if( chainRoot.expression == false) {
        def args (itemAt node.children 3)         ; ()
        def newNode (node.newExpressionNode())
        def sc (node.getSecond())
        newNode.add( (chainRoot.copy()) )
        newNode.add( (args.copy()) )
        innerNode = newNode
        args.is_part_of_chain = true
        i = i + 1
        chain_cnt = chain_cnt + 1
      }
      ; push the first into bottom of stack
      ; obj.foo.something ()
      while ( i < (chlen - 1) ) {
        ; TODO: error checks if no args given ? i + 1 may fail
        def fc (itemAt node.children i)
        def args@(lives) (itemAt node.children (i + 1))
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
          fc.is_part_of_chain = true
          args.is_part_of_chain = true
        } {
          ctx.addError(node ( "Invalid chaining op -> " + (fc.getCode()) ) )
          ctx.addError(node ("assign with invalid code = " + (node.getCode())))
        }
        i = i + 2
      }
      if ( chain_cnt > 0 ) {
        def remove_cnt (chlen - 3)
        while(remove_cnt > 0 ) {
          removeLast node.children
          remove_cnt = remove_cnt - 1
        }
        chainRoot.getChildrenFrom( innerNode )
        chainRoot.tag = "chainroot"
        chainRoot.flow_done = false
        chainRoot.expression = true
        chainRoot.vref = ""
        chainRoot.value_type = RangerNodeType.NoType
        node.flow_done = false
        this.WalkNode( node ctx wr)
        return true
      }    
    }

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
    if( (array_length node.children) != 3) {
      if( (node.chlen()) == 5 ) {

      } {
        ctx.addError(node "Invalid class declaration")
        return
      }
    }
    if(node.hasBooleanProperty("trait")) {
      return
    }
    def cn:CodeNode (itemAt node.children 1)
    def cBody:CodeNode (itemAt node.children body_index)
    def desc@(lives):RangerAppClassDesc (ctx.findClass(cn.vref))
    ;if cn.has_vref_annotation {
    ;  print "--> generic class, not processed"
    ;  return
    ;}
    def subCtx:RangerAppWriterContext (unwrap desc.ctx)
    subCtx.setCurrentClass(desc)
    subCtx.class_level_context = true
    for desc.variables p:RangerAppParamDesc i {
      def vNode:CodeNode p.node
      if ((array_length vNode.children) > 2) {
        def value:CodeNode (itemAt vNode.children 2)
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
    node.hasClassDescription = true
    node.clDesc = desc
    desc.classNode = node
  }
  fn EnterMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    this.shouldHaveChildCnt(4 node ctx "Method expexts four arguments")
    def cn:CodeNode (itemAt node.children 1)
    def fnBody:CodeNode (itemAt node.children 3)
    def udesc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
    def desc:RangerAppClassDesc (unwrap udesc)   
    def um@(optional):RangerAppFunctionDesc (desc.findMethod(cn.vref))
    def m:RangerAppFunctionDesc (unwrap um)
    def subCtx:RangerAppWriterContext (unwrap m.fnCtx)
    subCtx.function_level_context = true
    subCtx.currentMethod = m
    for m.params v:RangerAppParamDesc i {
      v.nameNode.eval_type = (v.nameNode.typeNameAsType(subCtx))
      v.nameNode.eval_type_name = v.nameNode.type_name
      ctx.hadValidType( (unwrap v.nameNode) )
    }
    subCtx.setInMethod()
    this.WalkNodeChildren(fnBody subCtx wr)
    subCtx.unsetInMethod()
    if (fnBody.didReturnAtIndex == -1) {
      if (cn.type_name != "void") {
        ctx.addError(node "Function does not return any values!")
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
  }
  fn EnterStaticMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    this.shouldHaveChildCnt(4 node ctx "Method expexts four arguments")
    def cn:CodeNode (itemAt node.children 1)
    def fnBody:CodeNode (itemAt node.children 3)
    def udesc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
    def desc:RangerAppClassDesc (unwrap udesc)
    def subCtx:RangerAppWriterContext (ctx.fork())
    subCtx.is_function = true
    def um@(optional):RangerAppFunctionDesc (desc.findStaticMethod(cn.vref))
    def m:RangerAppFunctionDesc (unwrap um)
    subCtx.currentMethod = m
    subCtx.in_static_method = true
    m.fnCtx = subCtx
    if (cn.hasFlag("weak")) {
      m.changeStrength(0 1 node)
    } {
      m.changeStrength(1 1 node)
    }
    subCtx.setInMethod()
    for m.params v@(lives):RangerAppParamDesc i {
      subCtx.defineVariable(v.name v)
      v.nameNode.eval_type = (v.nameNode.typeNameAsType(ctx))
      v.nameNode.eval_type_name = v.nameNode.type_name
    }
    this.WalkNodeChildren(fnBody subCtx wr)
    subCtx.unsetInMethod()
    subCtx.in_static_method = false
    subCtx.function_level_context = true
    if (fnBody.didReturnAtIndex == -1) {
      if (cn.type_name != "void") {
        ctx.addError(node "Function does not return any values!")
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
  }

  fn EnterStaticMethod2:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    this.shouldHaveChildCnt(5 node ctx "Method expexts four arguments")
    def cn:CodeNode (itemAt node.children 2)
    def fnBody:CodeNode (itemAt node.children 4)
    def udesc@(optional):RangerAppClassDesc (ctx.getCurrentClass())
    def desc:RangerAppClassDesc (unwrap udesc)
    def subCtx:RangerAppWriterContext (ctx.fork())
    subCtx.is_function = true
    def um@(optional):RangerAppFunctionDesc (desc.findStaticMethod(cn.vref))
    def m:RangerAppFunctionDesc (unwrap um)
    subCtx.currentMethod = m
    subCtx.in_static_method = true
    m.fnCtx = subCtx
    if (cn.hasFlag("weak")) {
      m.changeStrength(0 1 node)
    } {
      m.changeStrength(1 1 node)
    }
    subCtx.setInMethod()
    for m.params v@(lives):RangerAppParamDesc i {
      subCtx.defineVariable(v.name v)
      v.nameNode.eval_type = (v.nameNode.typeNameAsType(ctx))
      v.nameNode.eval_type_name = v.nameNode.type_name
    }
    this.WalkNodeChildren(fnBody subCtx wr)
    subCtx.unsetInMethod()
    subCtx.in_static_method = false
    subCtx.function_level_context = true
    if (fnBody.didReturnAtIndex == -1) {
      if (cn.type_name != "void") {
        ctx.addError(node "Function does not return any values!")
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
  }

  fn EnterLambdaMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    def args:CodeNode (itemAt node.children 1)
    def body@(lives):CodeNode (itemAt node.children 2)
    def subCtx:RangerAppWriterContext (ctx.fork())

    if(ctx.isInStatic()) {
      ; ctx.addError(node "Lambda definitions in static context are not allowed")
    }
    subCtx.is_capturing = true

    ;for args.children arg@(lives):CodeNode i {
    ;  def v@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
    ;  v.name = arg.vref
    ;  v.node = arg
    ;  v.nameNode = arg
    ;  arg.hasParamDesc = true
    ;  arg.paramDesc = v
    ;  subCtx.defineVariable(v.name v)
    ;}
    def cn:CodeNode (itemAt node.children 0)
      def m@(lives):RangerAppFunctionDesc (new RangerAppFunctionDesc ())
      m.name = "lambda"
      m.node = node
      m.nameNode = (itemAt node.children 0)
      subCtx.is_function = true
      subCtx.currentMethod = m
;      m.fnCtx = subCtx
      if (cn.hasFlag("weak")) {
        m.changeStrength(0 1 node)
      } {
        m.changeStrength(1 1 node)
      }
      m.fnBody = (itemAt node.children 2)
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

    def cnt:int ( array_length body.children )
    ; def activeFn:RangerAppFunctionDesc (ctx.getCurrentMethod())

    for body.children item:CodeNode i {
      this.WalkNode(item subCtx wr)
      if( i == ( (array_length body.children ) - 1) ) {
          if( (array_length item.children ) > 0) {
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
  }

  ; myClass@(xxx)
  fn CheckVRefTypeAnnotationOf:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if(node.has_vref_annotation) {
      def tAnn (node.vref_annotation)
      if(false == (ctx.isDefinedClass(node.vref))) {
        ctx.addError(node ("Trait class " + node.vref + " is not defined"))
      } {
        def testC (ctx.findClass(node.vref))
        if(testC.is_trait) {
          if (testC.node.hasExpressionProperty("params")) {
            def params (testC.node.getExpressionProperty("params"))

            def cnt (array_length tAnn.children)
            def tstr ""
            for tAnn.children ch:CodeNode i {
              this.CheckVRefTypeAnnotationOf( ch ctx wr ) 
              tstr = tstr + "_" + ch.vref
            }
;            def fp (tAnn.getFirst())
;            this.CheckVRefTypeAnnotationOf( fp ctx wr ) 
            def class_name ( testC.name + tstr)
            def ann (unwrap tAnn)
            ctx.createTraitInstanceClass( testC.name class_name ann this )
            node.vref = class_name
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
        ctx.addError(node ("Trait class " + node.type_name + " is not defined"))
      } {
        def testC (ctx.findClass(node.type_name))
        if(testC.is_trait) {
          if (testC.node.hasExpressionProperty("params")) {
            def params (testC.node.getExpressionProperty("params"))

            def cnt (array_length tAnn.children)
            def tstr ""
            for tAnn.children ch:CodeNode i {
              this.CheckVRefTypeAnnotationOf( ch ctx wr ) 
              tstr = tstr + "_" + ch.vref
            }
            def class_name ( testC.name + tstr)
            
;            def fp (tAnn.getFirst())            
;            this.CheckVRefTypeAnnotationOf( fp ctx wr ) 
;            def class_name ( testC.name + "_" + fp.vref)
            def ann (unwrap tAnn)
            ; print "creating trait class " + class_name + " tann count is == " + cnt
            ctx.createTraitInstanceClass( testC.name class_name ann this )
            node.type_name = class_name
            node.has_type_annotation = false
            return true
          }
        }
      }
    }    
    return false
  }

  fn EnterVarDef:void (node@(lives):CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (ctx.isInMethod()) {

      def chlen (array_length node.children)

      if(chlen > 1) {
        def tName (node.getSecond())
        this.CheckTypeAnnotationOf(tName ctx wr)
        ; transform type def into generic trait into a class if necessary
        ; def obj:foo@(double)
      }
      ; res = test.foo()  <- 4 nodes
      if(chlen > 3) {
        def i 3
        def chainRoot:CodeNode (node.getThird())  ; test.foo
        def innerNode@(weak) (chainRoot)
        def chain_cnt 0
        if( chainRoot.expression == false) {
          def args (itemAt node.children 3)         ; ()
          def newNode (node.newExpressionNode())
          def sc (node.getSecond())
          newNode.add( (chainRoot.copy()) )
          newNode.add( (args.copy()) )
          innerNode = newNode
          
          ; should you just remove the "last" items ?
          args.is_part_of_chain = true
          i = i + 1
        }
        ; push the first into bottom of stack
        ; obj.foo.something ()
        while ( i < (chlen - 1) ) {
          ; TODO: error checks if no args given ? i + 1 may fail
          def fc (itemAt node.children i)
          def args@(lives) (itemAt node.children (i + 1))
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
            fc.is_part_of_chain = true
            args.is_part_of_chain = true
          } {
            ctx.addError(node ( "Invalid chaining op -> " + (fc.getCode()) ) )
            ctx.addError(node ("assign with invalid code = " + (node.getCode())))
          }
          i = i + 2
        }
        if ( chain_cnt > 0 ) {
          def remove_cnt (chlen - 3)
          while(remove_cnt > 0 ) {
            removeLast node.children
            remove_cnt = remove_cnt - 1
          }
          chainRoot.getChildrenFrom( innerNode )
          chainRoot.tag = "chainroot"
          chainRoot.flow_done = false
          chainRoot.expression = true
          chainRoot.vref = ""
          chainRoot.value_type = RangerNodeType.NoType
          node.flow_done = false
          this.WalkNode( chainRoot ctx wr)
          ; this.WalkNode( node ctx wr)
          return true
        } {
          this.WalkNode( chainRoot ctx wr)
        }    
      }
      
      if ((array_length node.children) > 3) {
        ctx.addError(node "invalid variable definition")
        return
      }
      if ((array_length node.children) < 2) {
        ctx.addError(node "invalid variable definition")
        return
      }
      def cn@(lives):CodeNode (itemAt node.children 1)
      def p:RangerAppParamDesc (new RangerAppParamDesc ())
      def defaultArg:CodeNode
      def is_immutable false
      if ((array_length node.children) == 2) {
        if ((cn.value_type != RangerNodeType.Array) && (cn.value_type != RangerNodeType.Hash)) {       
          cn.setFlag("optional")
        }
      }
      if ((strlen cn.vref) == 0) {
        ctx.addError(node "invalid variable definition")
      }
      if (cn.hasFlag("weak")) {
        p.changeStrength(0 1 node)
      } {
        p.changeStrength(1 1 node)
      }
      node.hasVarDef = true
      if(cn.value_type == RangerNodeType.ExpressionType) {
        print "Expression node..."
      }
      if ((array_length node.children) > 2) {
        p.init_cnt = 1
        p.def_value = (itemAt node.children 2)
        p.is_optional = false
        defaultArg = (itemAt node.children 2)
        ctx.setInExpr()
        this.WalkNode( (unwrap defaultArg) ctx wr)
        ctx.unsetInExpr()
        if (defaultArg.hasFlag("optional")) {
          cn.setFlag("optional")
        }
        if (defaultArg.hasFlag("immutable")) {
          cn.setFlag("immutable")
        }

        if( defaultArg.hasParamDesc ) {
          def paramDesc (unwrap defaultArg.paramDesc)
          if( !null? paramDesc.propertyClass) {
            if( paramDesc.propertyClass.nameNode.hasFlag("immutable") ) {
              ; TODO: add hash support
              if (defaultArg.eval_type == RangerNodeType.Array || defaultArg.eval_type == RangerNodeType.Hash) {
                is_immutable = true
;                ctx.addError( node "creating a mutable copy of immutable array is currently not permitted")
              }              
            }        
          }
          if( paramDesc.is_immutable) {
            is_immutable = true
          }
        }

        if (defaultArg.eval_type == RangerNodeType.Array) {
          node.op_index = 1
        }
        if (cn.value_type == RangerNodeType.Enum) {
          cn.eval_type_name = (itemAt defaultArg.ns 0)
        }
        if (cn.value_type == RangerNodeType.Char) {
          if ((defaultArg.eval_type != RangerNodeType.Integer) && (defaultArg.eval_type != RangerNodeType.Char)) {
            ctx.addError( (unwrap defaultArg) ("Char should be assigned char or integer value --> " + (defaultArg.getCode())))
          } {
            defaultArg.eval_type = RangerNodeType.Char
          }
        }
      } {
        if ((cn.value_type != RangerNodeType.Hash) && (cn.value_type != RangerNodeType.Array) && (false == (cn.hasFlag("optional")))) {
          cn.setFlag("optional")
        }
      }
      ; simple local variable type inference
      if ((array_length node.children) > 2) {
          if( ( (strlen cn.type_name) == 0) && ( (strlen cn.array_type) == 0 ) ) {
            def nodeValue:CodeNode (itemAt node.children 2)
            if(nodeValue.eval_type == RangerNodeType.ExpressionType) {
              if(!null? nodeValue.expression_value) {
                cn.expression_value = ( nodeValue.expression_value.copy() )
              } {
                if( (null? node.expression_value)) {
                  ; infer the node type 
                  def copyOf (nodeValue.rebuildWithType( (new RangerArgMatch () ) false))
                  removeLast copyOf.children
                  cn.expression_value = copyOf
                }
              }
            }            
            cn.value_type = nodeValue.eval_type
            cn.type_name = nodeValue.eval_type_name
            cn.array_type = nodeValue.eval_array_type
            cn.key_type = nodeValue.eval_key_type
          }
      }      
      ; after type inference, check the validity of the type
      ctx.hadValidType(cn)
      cn.defineNodeTypeTo(cn ctx)

      p.name = cn.vref
      if (p.value_type == RangerNodeType.NoType) {
        if ((0 == (strlen cn.type_name)) && (!null? defaultArg)) {
          p.value_type = defaultArg.eval_type
          cn.type_name = defaultArg.eval_type_name
          cn.eval_type_name = defaultArg.eval_type_name
          cn.value_type = defaultArg.eval_type
        }
      } {
        p.value_type = cn.value_type
      }
      p.node = node
      p.nameNode = cn
      p.varType = RangerContextVarType.LocalVariable
      if is_immutable {
        p.is_immutable = is_immutable
      }
      if cn.has_vref_annotation {
        ctx.log(node "ann" "At a variable -> Found has_vref_annotation annotated reference ")
        def ann:CodeNode cn.vref_annotation
        if ((array_length ann.children) > 0) {
          def fc:CodeNode (itemAt ann.children 0)
          ctx.log(node "ann" ("value of first annotation " + fc.vref + " and variable name " + cn.vref))
        }
      }
      if cn.has_type_annotation {
        ctx.log(node "ann" "At a variable -> Found annotated reference ")
        def ann:CodeNode cn.type_annotation
        if ((array_length ann.children) > 0) {
          def fc:CodeNode (itemAt ann.children 0)
          ctx.log(node "ann" ("value of first annotation " + fc.vref + " and variable name " + cn.vref))
        }
      }
      cn.hasParamDesc = true
      cn.ownParamDesc = p
      cn.paramDesc = p
      node.hasParamDesc = true
      node.paramDesc = p
      cn.eval_type = (cn.typeNameAsType(ctx))
      cn.eval_type_name = cn.type_name


      if ((array_length node.children) > 2) {
        
        if(!null? defaultArg) {
          this.convertToUnion( cn.eval_type_name (unwrap defaultArg) ctx wr) 
        }

        if (cn.eval_type != defaultArg.eval_type) {
          ; TODO: function to check compability
          if( ( cn.eval_type == RangerNodeType.Char &&  defaultArg.eval_type == RangerNodeType.Integer ) ||
              ( cn.eval_type == RangerNodeType.Integer &&  defaultArg.eval_type == RangerNodeType.Char ) )  {

          } {
            ctx.addError(node ((("Variable was assigned an incompatible type. Types were " + cn.eval_type) + " vs ") + defaultArg.eval_type))
          }
          
        }
      } {
        p.is_optional = true
      }
      ctx.defineVariable(p.name p)
      this.DefineVar(node ctx wr)
      if ((array_length node.children) > 2) {
        this.shouldBeEqualTypes(cn (unwrap p.def_value) ctx "Variable was assigned an incompatible type.")
      }
    } {
      def cn:CodeNode (itemAt node.children 1)
      cn.eval_type = (cn.typeNameAsType(ctx))
      cn.eval_type_name = cn.type_name
      this.DefineVar(node ctx wr)
      if ((array_length node.children) > 2) {
        this.shouldBeEqualTypes((itemAt node.children 1) (itemAt node.children 2) ctx "Variable was assigned an incompatible type.")
      }
    }
  }
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
      ;"
      def ch_len (array_length node.children)
      for node.children item:CodeNode i {
        def did_find false
        if(has item.children) {
          def fc (item.getFirst())
          def name (fc.vref)
          
          if( ( (strlen name) > 0 ) && ( ( charAt name 0) == (charcode ".")) ) {
            did_find = true
            if(i>0) {
              def last_line (itemAt node.children (i - 1))
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
      for node.children item:CodeNode i {
        item.parent = node
        this.WalkNode(item ctx wr)
        node.copyEvalResFrom(item)
      }
    }
  }
  fn matchNode:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if (0 == (array_length node.children)) {
      return false
    }
    def fc:CodeNode (node.getFirst())
    stdCommands = (ctx.getStdCommands())
    def op_list (ctx.getOperators(fc.vref))
    for op_list cmd:CodeNode i {
      def cmdName:CodeNode (cmd.getFirst())
      if (cmdName.vref == fc.vref) {
        this.stdParamMatch(node ctx wr true)
        if (!null? node.parent) {
          ; node.parent.copyEvalResFrom(node)
        }
        return true
      }
    }
    ; convert into  a call because it handles the lambda functions correctly
    if( ( (array_length fc.ns) > 1 ) && ( ( array_length node.children) > 1) ) {
      def possible_cmd (last fc.ns)
      def op_list (ctx.getOperators(possible_cmd))
      for op_list cmd:CodeNode i {
        
        def m (new RangerArgMatch)        
        def altVersion ( node.rebuildWithType (m false) )
        def origCopy  ( node.rebuildWithType (m false) )

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
  fn WalkNode:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def line_index:int (node.getLine())
    if node.flow_done {
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
        ctx.addError( node "Primitive element at top level!")
      }
      this.WriteScalarValue(node ctx wr)
      return true
    }
    if (node.value_type == RangerNodeType.VRef || node.value_type == RangerNodeType.Hash || node.value_type == RangerNodeType.Array) { 
      this.WriteVRef(node ctx wr)
      return true
    }
    if (node.value_type == RangerNodeType.Comment) {
      this.WriteComment(node ctx wr)
      return true
    }
    if (node.isFirstVref("call")) {
      this.cmdCall(node ctx wr)
      return true
    }
    if (node.isFirstVref("fun")) {
      this.EnterLambdaMethod(node ctx wr)
      return true
    }
    if (node.isFirstVref("fn")) {
      if(ctx.isInMethod()) {
        this.EnterLambdaMethod(node ctx wr)
        return true
      }
    }
    if (node.isFirstVref("Extends")) {
      return true
    }
    if (node.isFirstVref("operator")) {
      return true
    }
    if (node.isFirstVref("extends")) {
      return true
    }
    if (node.isFirstVref("extension")) {
      this.EnterClass(node ctx wr)
      return true
    }
    if (node.isFirstVref("operators")) {
      return true
    }
    if (node.isFirstVref("systemclass")) {
      return true
    }
    if (node.isFirstVref("systemunion")) {
      return true
    }
    if (node.isFirstVref("union")) {
      return true
    }    
    if (node.isFirstVref("flag")) {
      return true
    }    
    if (node.isFirstVref("page")) {
      def sc (node.getSecond())
      print "found a page definition " + sc.vref
      ctx.addPage( sc.vref node )
      return true
    }    
    if (node.isFirstVref("Import")) {
      this.cmdImport(node ctx wr)
      return true
    }
    if (node.isFirstVref("def")) {
      this.EnterVarDef(node ctx wr)
      return true
    }
    if (node.isFirstVref("let")) {
      this.EnterVarDef(node ctx wr)
      return true
    }
    if (node.isFirstVref("TemplateClass")) {
      this.EnterTemplateClass(node ctx wr)
      return true
    }
    if (node.isFirstVref("CreateClass")) {
      this.EnterClass(node ctx wr)
      return true
    }
    if (node.isFirstVref("class")) {
      this.EnterClass(node ctx wr)
      return true
    }
    if (node.isFirstVref("trait")) {
      ; this.EnterClass(node ctx wr)
      return true
    }
    if (node.isFirstVref("PublicMethod")) {
      this.EnterMethod(node ctx wr)
      return true
    }
    if (node.isFirstVref("StaticMethod")) {
      this.EnterStaticMethod(node ctx wr)
      return true
    }
    if (node.isFirstVref("fn")) {
       this.EnterMethod(node ctx wr)
       return true
    }
    if (node.isFirstVref("sfn")) {
      this.EnterStaticMethod(node ctx wr)
      return true
    }
    if (node.isFirstVref("static")) {
      this.EnterStaticMethod2(node ctx wr)
      return true
    }
    if (node.isFirstVref("=")) {
      this.cmdAssign(node ctx wr)
      return true
    }
    if ( (node.isFirstVref("Constructor")) || (node.isFirstVref("constructor")) ) {
      this.Constructor(node ctx wr)
      return true
    }
    if (node.isFirstVref("new")) {
      this.cmdNew(node ctx wr)
      return true
    }
    if (node.isFirstVref("enum")) {
      return true
    }
    if (this.matchNode(node ctx wr)) {
      return true
    }
    if ((array_length node.children) > 0) {
      def fc:CodeNode (itemAt node.children 0)
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
        if ((array_length node.children) > 1) {
          if (this.cmdLocalCall(node ctx wr)) {
            return true
          }
        }
      } 
    }
    if node.expression {
      for node.children item:CodeNode i {
        item.parent = node
        if(!null? item.evalCtx) {
          this.WalkNode(item (unwrap item.evalCtx) wr)
        } {
          this.WalkNode(item ctx wr)
        }
        node.copyEvalResFrom(item)
      }
      return true
    }

    if(node.value_type == RangerNodeType.XMLNode) {
      print "-> found XML node"
      print (node.getLineAsString())
      def viewName ""
      node.attrs.forEach({
        print "attr " + item.vref + " == " + item.string_value
        if(item.vref == "name") {
          viewName = item.string_value
        }
      })
      ; could call here the XML node generator...
      if( (strlen viewName) > 0 ) {
        print " adding view class " + viewName
        ctx.addViewClassBody( viewName node )
      }
      print "Tag is " + node.vref
      node.children.forEach({
        switch item.value_type {
          case RangerNodeType.XMLNode {
            print "node " + item.vref
          }
          case RangerNodeType.XMLText {
            print "text " + item.string_value
          }
        }
      })
      return true
    }
    ctx.addError(node "Could not understand this part")

    return true
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
    if (node.isFirstVref("Import")) {
      def fNameNode:CodeNode (itemAt node.children 1)
      def import_file:string fNameNode.string_value
      if (has ctx.already_imported import_file) {
        return
      }
      set ctx.already_imported import_file true

      def root_path "."
      if hasRootPath {
        root_path = rootPath
      }

      ; --
      def rootCtx (ctx.getRoot())
      def filePathIs (this.searchLib( rootCtx.libraryPaths import_file ))

      if( ( file_exists filePathIs import_file ) == false ) {
        ctx.addError(node ("Could not import file "  + import_file))
        return
        ;"
      }
              
      def c:string (read_file filePathIs import_file)
      def code:SourceCode (new SourceCode ( (unwrap c)))
      code.filename = import_file
      def parser:RangerLispParser (new RangerLispParser (code))
      parser.parse()
      node.expression = true
      node.vref = ""
      removeLast node.children
      removeLast node.children

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

    print "--> collecting methods"
    this.WalkCollectMethods(node ctx wr)
    def allTypes:[string]

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
      def traitClassDef@(lives):CodeNode (itemAt point.node.children 1)
      def name:string (traitClassDef.vref)
      ; print "trait " + name + " to class " + cl.name
        def t:RangerAppClassDesc (ctx.findClass(name))
        if( (array_length t.extends_classes) > 0 ) {
          ctx.addError( (unwrap point.node) ("Can not join class " + name + " because it is inherited. Currently on base classes can be used as traits." ))
          continue
        }
        if(t.has_constructor) {
          ctx.addError( (unwrap point.node) ("Can not join class " + name + " because it has a constructor function" ))
        } {
          ; def clBody:CodeNode (itemAt t.node.children 2)
          def origBody:CodeNode (itemAt cl.node.children 2)
          def match:RangerArgMatch (new RangerArgMatch ())
          def params (t.node.getExpressionProperty("params"))
          def initParams (point.node.getExpressionProperty("params"))
          def traitParams (new RangerTraitParams)

          ; print "building trait for class " + cl.name
          if( (!null? params) && (!null? initParams) ) {
            for params.children typeName:CodeNode i {
              def pArg (itemAt initParams.children i)
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
          ;def chCnt:int (array_length joinPoint.children)
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
    for serializedClasses cl:RangerAppClassDesc i {
      cl.is_serialized = true
      def ser:RangerSerializeClass (new RangerSerializeClass())
      def extWr:CodeWriter (new CodeWriter())
;      ser.createJSONSerializerFn( cl (unwrap cl.ctx) extWr )
      ser.createJSONSerializerFn2( cl (unwrap cl.ctx) extWr )
      def theCode:string (extWr.getCode())
      def code:SourceCode (new SourceCode ( theCode))
      code.filename = "extension " + (ctx.currentClass.name)
      def parser:RangerLispParser (new RangerLispParser (code))
      parser.parse()
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
      parser.parse()
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
      for c.variables p:RangerAppParamDesc i {
        ctx.hadValidType( (unwrap p.nameNode) )
      }
    }

    for ctx.definedClassList cname:string i {
      push allTypes cname
    }

    push allTypes "integer"
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
    for allTypes typeName:string i {
      push new_class.is_union_of typeName
    }
    Anynn.clDesc = new_class
        

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

  fn WalkCollectMethods:void (node@(lives):CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def find_more:boolean true

    if (node.isFirstVref("flag")) {
      return 
    }    
    if (node.isFirstVref("page")) {
      return 
    }    

    if (node.isFirstVref("operator")) {

      def nameNode@(lives):CodeNode (node.getSecond())
      def opClassName (nameNode.vref)

      if (nameNode.vref == "class") {
;        print "Found operator class " + nameNode.type_name
        def new_class@(lives):RangerAppClassDesc (new RangerAppClassDesc ())
        new_class.name = nameNode.type_name
        new_class.nameNode = nameNode
        ; TODO: make this cleaner....
        nameNode.vref = nameNode.type_name
        ctx.addClass(nameNode.vref new_class)
        new_class.is_system = true
        nameNode.clDesc = new_class
      }

      def b_is_void (nameNode.type_name == "void")
      def opLang (itemAt node.children 2)
      def opsList (itemAt node.children 3)

;      def listOf:CodeNode (node.getSecond())
;      for listOf.children item@(lives):CodeNode i {
;        ctx.createOperator(item)
;      }

      for opsList.children op:CodeNode i {
        def fc (op.getFirst())
        if( fc.vref == "fn") {
          def nn (op.getSecond())
          def args (op.getThird())
          def opCode (itemAt op.children 3)

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
      def instances:CodeNode (node.getThird())
      def new_class@(lives):RangerAppClassDesc (new RangerAppClassDesc ())
      new_class.name = nameNode.vref
      new_class.nameNode = nameNode
      ctx.addClass(nameNode.vref new_class)
      new_class.is_system = true
      for instances.children ch:CodeNode i {
        def langName:CodeNode (ch.getFirst())
        def langClassName:CodeNode (ch.getSecond())
        set new_class.systemNames langName.vref langClassName.vref
      }
      nameNode.is_system_class = true
      nameNode.clDesc = new_class
      return
    }
    if (node.isFirstVref("extends")) {
      if( ( array_length node.children ) > 1 ) {
        def ee (node.getSecond())
        def currC:RangerAppClassDesc ctx.currentClass
        currC.addParentClass(ee.vref)
        def ParentClass:RangerAppClassDesc (ctx.findClass(ee.vref))
        ParentClass.is_inherited = true
      }
      find_more = false
    }
    if (node.isFirstVref("Extends")) {
      def extList:CodeNode (itemAt node.children 1)
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
      m.nameNode = (itemAt node.children 0)
      m.fnBody = (itemAt node.children 2)
      m.fnCtx = subCtx

      def args:CodeNode (itemAt node.children 1)
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
      def fNameNode:CodeNode (itemAt node.children 1)
      def enumList:CodeNode (itemAt node.children 2)
      def new_enum:RangerAppEnum (new RangerAppEnum ())
      for enumList.children item:CodeNode i {
        def fc (item.getFirst())
        new_enum.add(fc.vref)
      }
      set ctx.definedEnums fNameNode.vref new_enum      
      find_more = false
    }
    if (node.isFirstVref("Enum")) {
      def fNameNode:CodeNode (itemAt node.children 1)
      def enumList:CodeNode (itemAt node.children 2)
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

      if( (array_length node.children) < 3) {
        ctx.addError(node "Not enough arguments for creating a class")
        return
      }

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
          def extClass (itemAt node.children 3)
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
      
      def list:CodeNode (itemAt node.children 1)
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
      def vDef@(lives):CodeNode (itemAt node.children 1)
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

      if ((array_length node.children) > 2) {
        p.set_cnt = 1
        p.init_cnt = 1
        p.def_value = (itemAt node.children 2)
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
        def valueNode (itemAt node.children 2)
        if( (array_length valueNode.children) > 0) {
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
      def fNameNode:CodeNode (itemAt node.children 1)
      def import_file:string fNameNode.string_value
      if (has ctx.already_imported import_file) {
        return
      } {
        set ctx.already_imported import_file true
      }

      def root_path "."
      if hasRootPath {
        root_path = rootPath
      }      
      def rootCtx (ctx.getRoot())
      def filePathIs (this.searchLib( rootCtx.libraryPaths import_file ))

      if( ( file_exists filePathIs import_file ) == false ) {
        ctx.addError(node ("Could not import file "  + import_file))
        return
        ;"
      }
      def c:string (read_file filePathIs import_file)
      def code:SourceCode (new SourceCode ( (unwrap c)))
      code.filename = import_file
      def parser:RangerLispParser (new RangerLispParser (code))
      parser.parse()
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
      m.nameNode = (itemAt node.children 2)
      m.nameNode.ifNoTypeSetToVoid()
      def args:CodeNode (itemAt node.children 3)
      m.fnBody = (itemAt node.children 4)
;      m.fnCtx = (ctx.fork())
      this.CheckTypeAnnotationOf( (unwrap m.nameNode) ctx wr )
      args.children.forEach({
        this.defineFunctionParam( m item ctx wr)
      })      
      currC.addStaticMethod(m)
      find_more = false      
    }
    if ((node.isFirstVref("StaticMethod")) || (node.isFirstVref("sfn"))) {
      def s:string (node.getVRefAt(1))
      def currC:RangerAppClassDesc ctx.currentClass
      def m@(lives):RangerAppFunctionDesc (new RangerAppFunctionDesc ())
      m.name = s
      m.compiledName = (ctx.transformWord(s))
      m.node = node
      m.is_static = true
      m.nameNode = (itemAt node.children 1)
      m.nameNode.ifNoTypeSetToVoid()
      def args:CodeNode (itemAt node.children 2)
      m.fnBody = (itemAt node.children 3)
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

    }
    if (node.isFirstVref("extension")) {
      def s:string (node.getVRefAt(1))
      def old_class@(lives):RangerAppClassDesc (ctx.findClass(s))
      ctx.setCurrentClass( old_class )
      ; print "extension for " + s
    }
    
    if ((node.isFirstVref("PublicMethod")) || (node.isFirstVref("fn"))) {
      def cn:CodeNode (node.getSecond())
      def s:string (node.getVRefAt(1))
      cn.ifNoTypeSetToVoid()

      def currC:RangerAppClassDesc ctx.currentClass
      if( (currC.hasOwnMethod(s)) && (false == (cn.hasFlag("override"))) ) {
        ctx.addError( node "Error: method of same name declared earlier. Overriding function declarations is not currently allowed!")
        return
      }
      if(cn.hasFlag("main")) {
        ctx.addError( node "Error: dynamic method declared as @(main). Use static 'sfn' instead of 'fn'.")
        return        
      }      
      def m@(lives):RangerAppFunctionDesc (new RangerAppFunctionDesc ())
      m.name = s
      m.compiledName = (ctx.transformWord(s))

      m.node = node
      m.nameNode = (itemAt node.children 1)
      if (node.hasBooleanProperty("strong")) {
        m.refType = RangerNodeRefType.Strong
      } {
        m.refType = RangerNodeRefType.Weak
      }
      def subCtx:RangerAppWriterContext (currC.ctx.fork())
      subCtx.is_function = true
      subCtx.currentMethod = m
      m.fnCtx = subCtx
      if (cn.hasFlag("weak")) {
        m.changeStrength(0 1 node)
      } {
        m.changeStrength(1 1 node)
      }
      def args:CodeNode (itemAt node.children 2)
      m.fnBody = (itemAt node.children 3)

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
          p2.debugString = "--> collected as STRONG"
          ctx.log(node "memory5" "strong param should move local ownership to call ***")
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
      currC.addMethod(m)
      find_more = false
    }
    if find_more {
      for node.children item:CodeNode i {
        this.WalkCollectMethods(item ctx wr)
      }
    }
    ; serialize should be at end when all extensions have been added 

    if(node.hasBooleanProperty("serialize")) {
      push serializedClasses (unwrap ctx.currentClass)
    }

  }
  fn FindWeakRefs:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def list:[RangerAppClassDesc] (ctx.getClasses())
    for list classDesc:RangerAppClassDesc i {
      for classDesc.variables varD:RangerAppParamDesc i2 {
        if (varD.refType == RangerNodeRefType.Weak) {
          if (varD.isArray()) {
            def nn:CodeNode varD.nameNode
          }
          if (varD.isHash()) {
            def nn:CodeNode varD.nameNode
          }
          if (varD.isObject()) {
            def nn:CodeNode varD.nameNode
          }
        }
      }
    }
  }
  fn findFunctionDesc@(weak optional):RangerAppFunctionDesc (obj:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def varDesc:RangerAppParamDesc
    def varFnDesc:RangerAppFunctionDesc
    
    if (obj.vref != (this.getThisName())) {
      if ((array_length obj.ns) > 1) {
        def cnt:int (array_length obj.ns)
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
                ctx.addError(obj ("Error, no description for called object: " + strname))
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
                ctx.addError(obj ("Error, no description for refenced obj: " + strname))
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
                  ctx.addError(obj (" function variable not found " + strname))
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
      if (!null? varFnDesc.nameNode) {
      } {
        ctx.addError(obj ("Error, no description for called function: " + obj.vref))
      }
      return varFnDesc
    }
    ctx.addError(obj "Can not call 'this' like function")
    varFnDesc = (new RangerAppFunctionDesc ())
    return varFnDesc
  }
  fn findParamDesc@(weak optional):RangerAppParamDesc (obj:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    def varDesc@(lives):RangerAppParamDesc
    def set_nsp:boolean false
    def classDesc@(lives):RangerAppClassDesc
    if (0 == (array_length obj.nsp)) {
      set_nsp = true
    }
    if (obj.vref != (this.getThisName())) {
      if ((array_length obj.ns) > 1) {
        def cnt:int (array_length obj.ns)
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
                ctx.addError(obj ("Error, no description for called object: " + strname))
                break _
              }
              if set_nsp {
                push obj.nsp (unwrap classRefDesc)
              }
              classRefDesc.ref_cnt = (1 + classRefDesc.ref_cnt)
              classDesc = (ctx.findClass(classRefDesc.nameNode.type_name))
            }
          } {
            if (i < (cnt - 1)) {
              varDesc = (classDesc.findVariable(strname))
              if (null? varDesc) {
                ctx.addError(obj ("Error, no description for refenced obj: " + strname))
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
                    ctx.addError(obj ("variable not found " + strname))
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
        print ("findParamDesc : description not found for " + obj.vref)
        if (!null? varDesc) {
          print ("Vardesc was found though..." + varDesc.name)
        }
        ctx.addError(obj ("Error, no description for called object: " + obj.vref))
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
              def toVref (node.newVRefNode("to"))
              def argType (node.newVRefNode("_"))
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
  fn areEqualTypes:boolean (n1:CodeNode n2:CodeNode ctx:RangerAppWriterContext) {

    if(n1.eval_type == RangerNodeType.ExpressionType) {

      def n1Expr@(weak) (n1.expression_value)
      def n2Expr@(weak) (n2.expression_value)

      if(null? n1Expr) {
        if(n1.hasParamDesc && (!null? n1.paramDesc.nameNode)) {
          n1Expr = n1.paramDesc.nameNode.expression_value
        }
      }
      if(null? n2Expr) {
        if(n2.hasParamDesc && (!null? n2.paramDesc.nameNode)) {
          n2Expr = n2.paramDesc.nameNode.expression_value
        }
      }
      if( (!null? n1Expr) && (!null? n2Expr) ) {
        return (this.matchLambdaArgs( (unwrap n1Expr) (unwrap n2Expr) ctx (new CodeWriter)))
      }
      ctx.addError(n2 "Was not able to evaluate lambda expression types")
      return false
    }    

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
              ctx.addError( n1 ("Can not convert union to type "))
              return false
            }      

            if( (c2.is_union == true) && (c1.is_union == true)) {
              ctx.addError( n1 ("Union types must be the same =>  " + n1.eval_type_name + " <> " + n2.eval_type_name))
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
          ctx.addError(n1 ("Type mismatch " + n2.eval_type_name + " <> " + n1.eval_type_name + ". " + msg))
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
    if ((array_length n1.children) != cnt) {
      ctx.addError(n1 (msg))
    }
  }
  fn shouldBeNumeric:void (n1:CodeNode ctx:RangerAppWriterContext msg:string) {
    if ((n1.eval_type != RangerNodeType.NoType) && ((strlen n1.eval_type_name) > 0)) {
      if (false == ((n1.eval_type_name == "double") || (n1.eval_type_name == "int"))) {
        ctx.addError(n1 ("Not numeric: " + n1.eval_type_name + ". " + msg))
      }
    }
  }
  fn shouldBeArray:void (n1:CodeNode ctx:RangerAppWriterContext msg:string) {
    if (n1.eval_type != RangerNodeType.Array) {
      ctx.addError(n1 ("Expecting array. " + msg))
    }
  }
  fn shouldBeType:void (type_name:string n1:CodeNode ctx:RangerAppWriterContext msg:string) {
    if ((n1.eval_type != RangerNodeType.NoType) && ((strlen n1.eval_type_name) > 0)) {
      if (n1.eval_type_name == type_name) {
      } {
        def b_ok:boolean false
        if ((ctx.isEnumDefined(n1.eval_type_name)) && (type_name == "int")) {
          b_ok = true
        }
        if ((ctx.isEnumDefined(type_name)) && (n1.eval_type_name == "int")) {
          b_ok = true
        }
        if ((n1.eval_type_name == "char") && (type_name == "int")) {
          b_ok = true
        }
        if ((n1.eval_type_name == "int") && (type_name == "char")) {
          b_ok = true
        }
        if (b_ok == false) {
          ctx.addError(n1 ("Type mismatch " + type_name + " <> " + n1.eval_type_name + ". " + msg))
        }
      }
    }
  }
}
