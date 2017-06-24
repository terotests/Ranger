
Import "ng_RangerFlowParser.clj"
Import "ng_RangerLanguageWriters.clj"


class LiveCompiler {

  def langWriter:RangerGenericClassWriter
  def hasCreatedPolyfill:[string:boolean]

  sfn hello@(main):void () {

    if ( (shell_arg_cnt) < 3  ) {
      print "usage <file> <language> <targetfile>"
      return 
    }    

    def the_file:string (shell_arg 0)
    def the_lang:string (shell_arg 1)
    def the_target:string (shell_arg 2)

    print "file name " + the_file

    def c:string (read_file "." the_file)    
    def code:SourceCode (new SourceCode ((unwrap c)))

    code.filename = the_file
    def parser:RangerLispParser (new RangerLispParser (code))
    parser.parse()
    
    def node:CodeNode (unwrap parser.rootNode)
    def flowParser:RangerFlowParser (new RangerFlowParser ())
    def appCtx:RangerAppWriterContext (new RangerAppWriterContext()))
    def wr:CodeWriter (new CodeWriter())

    timer "Total time" {

      flowParser.mergeImports(node appCtx wr)
      def lang_str:string (read_file "." "Lang.clj")
      def lang_code:SourceCode (new SourceCode ( (unwrap lang_str)) )

      lang_code.filename = "Lang.clj"
      def lang_parser:RangerLispParser (new RangerLispParser (lang_code))
      lang_parser.parse()

      appCtx.langOperators = (unwrap lang_parser.rootNode)

      print "===== collecting methods ==== ---->>>"
      flowParser.CollectMethods (node appCtx wr)

      if ( ( array_length appCtx.compilerErrors ) > 0 ) {
        LiveCompiler.displayCompilerErrors(appCtx)
        return
      }

      print "----> collection done"
      print "===== starting flowParser ==== "

      appCtx.targetLangName = the_lang

      flowParser.WalkNode (node appCtx wr)
      if ( ( array_length appCtx.compilerErrors ) > 0 ) {
        LiveCompiler.displayCompilerErrors(appCtx)
        LiveCompiler.displayParserErrors(appCtx)
        return
      }
      print "--- flow done --- "


      def fileSystem:CodeFileSystem (new CodeFileSystem())
      def file:CodeFile (fileSystem.getFile("." the_target))
      def wr@(optional):CodeWriter (file.getWriter())
      def lcc:LiveCompiler (new LiveCompiler())
      def staticMethods:RangerAppClassDesc

      def importFork:CodeWriter (wr.fork())

      for appCtx.definedClassList cName:string i {

        if (cName == "RangerStaticMethods") {
          staticMethods = (get appCtx.definedClasses cName)
          continue _
        }
        def cl:RangerAppClassDesc (get appCtx.definedClasses cName)
        if(cl.is_system) {
          print "--> system class " + cl.name + ", skipping"
          continue _
        }
        lcc.WalkNode( (unwrap cl.classNode ) appCtx (unwrap wr))
      }

      if (!null? staticMethods) {
        lcc.WalkNode( (unwrap staticMethods.classNode) appCtx (unwrap wr))
      }

      def import_list:[string] (wr.getImports ())

      if(appCtx.targetLangName == "go") {
        importFork.out("package main" true)
        importFork.newline()
        importFork.out("import (" true)
        importFork.indent(1)
      }

      for import_list codeStr:string i {

        switch appCtx.targetLangName {
          case "go" {
            if ( (charAt codeStr 0) == (charcode "_") ) {
              importFork.out (( " _ \"" + (substring codeStr 1 (strlen codeStr)) + "\"") , true)
            } {
              importFork.out (("\"" + codeStr + "\"") , true)
            }
            
          }
          case "rust" {
            importFork.out (( "use " + codeStr + ";") , true)
          }
          default {
            importFork.out (("import "  + codeStr + "") , true)
          }
        }        
      }				
      if(appCtx.targetLangName == "go") {
        importFork.indent(-1)
        importFork.out(")" true)
      }
      fileSystem.saveTo(".")
      print "Ready."
      LiveCompiler.displayCompilerErrors(appCtx)
      LiveCompiler.displayParserErrors(appCtx)
    }
  }

  sfn displayCompilerErrors:void (appCtx@(weak):RangerAppWriterContext) {
    for appCtx.compilerErrors e:RangerCompilerMessage i {
        def line_index:int (e.node.getLine ())                      
        print ( (e.node.getFilename ()) + " Line: " + (1 + line_index))
        print e.description
        print (e.node.getLineString(line_index))
    }        
  }

  sfn displayParserErrors:void (appCtx@(weak):RangerAppWriterContext) {
    if ( (array_length appCtx.parserErrors) == 0 ) {
      print "no language test errors"
      return
    }
    print "LANGUAGE TEST ERRORS:"
    for appCtx.parserErrors e:RangerCompilerMessage i {
        def line_index:int (e.node.getLine ())                      
        print ( (e.node.getFilename ()) + " Line: " + (1 + line_index))
        print e.description
        print (e.node.getLineString(line_index))
    }        
  }

  fn initWriter:void (ctx:RangerAppWriterContext) {
    if (!null? langWriter) {
      return
    }
    def root:RangerAppWriterContext (ctx.getRoot())
    switch root.targetLangName {
      case "go" {
        langWriter = (new RangerGolangClassWriter ())
      }
      case "scala" {
        langWriter = (new RangerScalaClassWriter ())
      }
      case "java7" {
        langWriter = (new RangerJava7ClassWriter ())
      }
      case "swift3" {
        langWriter = (new RangerSwift3ClassWriter ())
      }
      case "kotlin" {
        langWriter = (new RangerKotlinClassWriter ())
      }
      case "php" {
        langWriter = (new RangerPHPClassWriter ())
      }
      case "csharp" {
        langWriter = (new RangerCSharpClassWriter ())
      }
      case "es6" {
        langWriter = (new RangerJavaScriptClassWriter ())
      }
      case "ranger" {
        langWriter = (new RangerRangerClassWriter ())
      }      
    }
    if (!null? langWriter) {
      langWriter.compiler = this
    } {
      langWriter = (new RangerGenericClassWriter ())
      langWriter.compiler = this
    }
  }
fn EncodeString:string (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    ; TODO: check the encoding rules for the language...

    def encoded_str:string ""
    def str_length:int (strlen node.string_value)
      
    def encoded_str:string ""

    def ii:int 0

    while (< ii str_length) {

      def ch:int (charAt node.string_value ii)
      def cc:int ch

      switch cc {
        case 8 {
            encoded_str = encoded_str + (strfromcode 92 ) + (strfromcode 98 )  
        }
        case 9 {
            encoded_str = encoded_str + (strfromcode 92 ) + (strfromcode 116 ) 
        }    
        case 10 {
            ( = encoded_str ( encoded_str + (strfromcode 92 ) + (strfromcode 110 ) ) ) 
        }    
        case 12 {
            ( = encoded_str ( encoded_str + (strfromcode 92 ) + (strfromcode 102 ) ) ) 
        }    
        case 13 {
            ( = encoded_str ( encoded_str + (strfromcode 92 ) + (strfromcode 114 ) ) ) 
        }

        case 34 {
            ( = encoded_str ( encoded_str + (strfromcode 92 ) + (strfromcode 34 ) ) ) 
        }  
        case 92 {
            = encoded_str ( encoded_str + (strfromcode 92 ) + (strfromcode 92 ) ) 
        }
                                            
        default {
            ( = encoded_str ( encoded_str + (strfromcode ch) ) ) 
        }
      }
      ii = ii + 1
    }

    return encoded_str   

  }
  
  fn WriteScalarValue:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    langWriter.WriteScalarValue(node ctx wr)
  }
  fn adjustType:string (tn:string) {
    if (tn == "this") {
      return "self"
    } 
    return tn
  }
  fn WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    langWriter.WriteVRef(node ctx wr)
  }
  fn writeTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    langWriter.writeTypeDef(node ctx wr)
  }
  fn CreateLambda:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def args:CodeNode (itemAt node.children 2)
    def body:CodeNode (itemAt node.children 3)
    wr.out("(" false)
    for args.children arg:CodeNode i {
      if (i > 0) {
        wr.out(", " false)
      }
      wr.out(arg.vref false)
    }
    wr.out(")" false)
    wr.out(" => { " true)
    wr.indent(1)
    wr.out("// body " true)
    for body.children item:CodeNode i {
      this.WalkNode(item ctx wr)
    }
    wr.newline()
    wr.indent(-1)
    wr.out("}" true)
  }
  fn getTypeString:string (str:string ctx:RangerAppWriterContext) {
    return ""
  }
  fn findOpCode:void (op:CodeNode node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def fnName@(lives):CodeNode (itemAt op.children 1)
    def args:CodeNode (itemAt op.children 2)
    
    if ( (array_length op.children ) > 3 ) {
      def details:CodeNode (itemAt op.children 3)
      for details.children det:CodeNode i {        
        if ( (array_length det.children ) > 0 ) {
          def fc:CodeNode (itemAt det.children 0)
          if (fc.vref == "code") {
            def match:RangerArgMatch (new RangerArgMatch ())
            def all_matched:boolean (match.matchArguments(args node ctx 1))
            if (all_matched == false) {
              return
            }
            def origCode:CodeNode (itemAt det.children 1)
            def theCode:CodeNode (origCode.rebuildWithType(match true))
            def appCtx:RangerAppWriterContext (ctx.getRoot())
            def stdFnName:string (appCtx.createSignature(fnName.vref (fnName.vref + (theCode.getCode()))))
            def stdClass:RangerAppClassDesc (ctx.findClass("RangerStaticMethods"))
            def runCtx:RangerAppWriterContext (appCtx.fork())
            def b_failed:boolean false
            if (false == (has stdClass.defined_static_methods stdFnName)) {
              runCtx.setInMethod()
              def m@(lives):RangerAppFunctionDesc (new RangerAppFunctionDesc ())
              m.name = stdFnName
              m.node = op
              m.is_static = true
              m.nameNode = fnName
              m.fnBody = theCode
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
                runCtx.defineVariable(p.name p)
              }
              stdClass.addStaticMethod(m)
              def err_cnt:int (array_length ctx.compilerErrors)
              def flowParser:RangerFlowParser (new RangerFlowParser ())
              def TmpWr:CodeWriter (new CodeWriter ())
              flowParser.WalkNode(theCode runCtx TmpWr)
              runCtx.unsetInMethod()
              def err_delta:int ((array_length ctx.compilerErrors) - err_cnt)
              if (err_delta > 0) {
                b_failed = true
                print "Had following compiler errors:"
                for ctx.compilerErrors e:RangerCompilerMessage i {
                  if (i < err_cnt) {
                    continue _
                  }
                  def line_index:int (e.node.getLine())
                  print ((e.node.getFilename()) + " Line: " + line_index)
                  print e.description
                  print (e.node.getLineString(line_index))
                }
              } {
                print "no errors found"
              }
            }
            if b_failed {
              wr.out("/* custom operator compilation failed */ " false)
            } {
              wr.out((("RangerStaticMethods." + stdFnName) + "(") false)
              for node.children cc:CodeNode i {
                if (i == 0) {
                  continue _
                }
                if (i > 1) {
                  wr.out(", " false)
                }
                this.WalkNode(cc ctx wr)
              }
              wr.out(")" false)
            }
            return
          }
        }
      }
    }
  }
  fn findOpTemplate@(weak optional):CodeNode (op:CodeNode node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def fnName:CodeNode (itemAt op.children 1)
    def root:RangerAppWriterContext (ctx.getRoot())
    def langName:string (ctx.getTargetLang())

    if ( (array_length op.children ) > 3) {
      def details:CodeNode (itemAt op.children 3)
      for details.children det:CodeNode i {
        
        if ( (array_length det.children ) > 0) {
          def fc:CodeNode (itemAt det.children 0)
          if (fc.vref == "templates") {
            def tplList:CodeNode (itemAt det.children 1)
            for tplList.children tpl:CodeNode i {
              def tplName:CodeNode (tpl.getFirst())
              def tplImpl@(optional):CodeNode 
              tplImpl = (tpl.getSecond())
              if ((tplName.vref != "*") && (tplName.vref != langName)) {
                continue _
              }
              if (tplName.hasFlag("mutable")) {
                if (false == (node.hasFlag("mutable"))) {
                  continue _
                }
              }
              return tplImpl
            }
          }
        }
      }
    }
    def non:CodeNode
    return non
  }
  fn localCall:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if node.hasFnCall {
      if (!null? langWriter) {
        langWriter.writeFnCall(node ctx wr)
        return true
      }
    }
    if node.hasNewOper {
      langWriter.writeNewCall(node ctx wr)
      return true
    }
    if node.hasVarDef {
      langWriter.writeVarDef(node ctx wr)
      return true
    }
    if node.hasClassDescription {
      langWriter.writeClass(node ctx wr)
      return true
    }
    return false
  }
  fn WalkNode:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

    this.initWriter(ctx)
    if (node.isPrimitive()) {
      this.WriteScalarValue(node ctx wr)
      return
    }
    if (node.value_type == RangerNodeType.VRef) {
      this.WriteVRef(node ctx wr)
      return
    }
    if (node.value_type == RangerNodeType.Lambda) {
      this.WriteVRef(node ctx wr)
      return
    }
    if ((array_length node.children) > 0) {
      if node.has_operator {
        def op:CodeNode (ctx.findOperator(node))
        def fc:CodeNode (op.getFirst())
        def tplImpl@(optional):CodeNode (this.findOpTemplate(op node ctx wr))
        def evalCtx:RangerAppWriterContext ctx
        if (!null? node.evalCtx) {
          evalCtx = (unwrap node.evalCtx)
        }
        if (!null? tplImpl) {
          def opName:CodeNode (op.getSecond())
          if (opName.hasFlag("returns")) {
            langWriter.release_local_vars(node evalCtx wr)
          }
          this.walkCommandList( (unwrap tplImpl) node evalCtx wr)
        } {
          this.findOpCode(op node evalCtx wr)
        }
        return
      }
      if (node.isFirstVref("lambda")) {
        this.CreateLambda(node ctx wr)
        return
      }
      if ((array_length node.children) > 1) {
        if (this.localCall(node ctx wr)) {
          return
        }
      }
      def fc:CodeNode (node.getFirst())
    }
    if node.expression {
      for node.children item:CodeNode i {
        if ((node.didReturnAtIndex >= 0) && (node.didReturnAtIndex < i)) {
          break _
        }
        this.WalkNode(item ctx wr)
      }
    } {
      ; print "no expression, exiting"
    }
  }
  fn walkCommandList:void (cmd:CodeNode node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if ((ctx.expressionLevel()) == 0) {
      wr.newline()
    }
    if ((ctx.expressionLevel()) > 1) {
      wr.out("(" false)
    }
    for cmd.children c:CodeNode i {
      this.walkCommand(c node ctx wr)
    }
    if ((ctx.expressionLevel()) > 1) {
      wr.out(")" false)
    }
    if ((ctx.expressionLevel()) == 0) {
      wr.newline()
    }
  }
  fn walkCommand:void (cmd:CodeNode node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    if cmd.expression {
      def cmdE:CodeNode (cmd.getFirst())
      def cmdArg@(lives):CodeNode (cmd.getSecond())
      switch cmdE.vref {
        case "block" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            this.WalkNode(arg ctx wr)
          }
        }
        case "varname" {
          if (ctx.isVarDefined(cmdArg.vref)) {
            def p:RangerAppParamDesc (ctx.getVariableDef(cmdArg.vref))
            wr.out(p.compiledName false)
          }
        }
        case "defvar" {
          def p@(lives):RangerAppParamDesc (new RangerAppParamDesc ())
          p.name = cmdArg.vref
          p.value_type = cmdArg.value_type
          p.node = cmdArg
          p.nameNode = cmdArg
          p.is_optional = false
          ctx.defineVariable(p.name p)
        }
        case "cc" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            def cc:char (charcode arg.string_value)
            wr.out(("" + (to_int cc)) false)
          }
        }
        case "java_case" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            this.WalkNode(arg ctx wr)
            if (arg.didReturnAtIndex < 0) {
              wr.newline()
              wr.out("break;" true)
            }
          }
        }
        case "e" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            ctx.setInExpr()
            this.WalkNode(arg ctx wr)
            ctx.unsetInExpr()
          }
        }       

        case "goset" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            ctx.setInExpr()
            langWriter.WriteSetterVRef(arg ctx wr)
            ctx.unsetInExpr()
          }
        }        

        case "pe" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            this.WalkNode(arg ctx wr)
          }
        }
        case "ptr" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            if arg.hasParamDesc {
              if ((arg.paramDesc.nameNode.isAPrimitiveType()) == false) {
                wr.out("*" false)
              }
            } {
              if ((arg.isAPrimitiveType()) == false) {
                wr.out("*" false)
              }
            }
          }
        }
        case "ptrsrc" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            if (((arg.isPrimitiveType()) == false) && ((arg.isPrimitive()) == false)) {
              wr.out("&" false)
            }
          }
        }
        case "nameof" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            wr.out(arg.vref false)
          }
        }
        case "list" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            for arg.children ch:CodeNode i {
              if (i > 0) {
                wr.out(" " false)
              }
              ctx.setInExpr()
              this.WalkNode(ch ctx wr)
              ctx.unsetInExpr()
            }
          }
        }        
        case "comma" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            for arg.children ch:CodeNode i {
              if (i > 0) {
                wr.out("," false)
              }
              ctx.setInExpr()
              this.WalkNode(ch ctx wr)
              ctx.unsetInExpr()
            }
          }
        }
        case "swift_rc" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            if arg.hasParamDesc {
              if (arg.paramDesc.ref_cnt == 0) {
                wr.out("_" false)
              } {
                wr.out(arg.vref false)
              }
            } {
              wr.out(arg.vref false)
            }
          }
        }
        case "r_ktype" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            if arg.hasParamDesc {
              def ss:string (langWriter.getObjectTypeString(arg.paramDesc.nameNode.key_type ctx))
              wr.out(ss false)
            } {
              def ss:string (langWriter.getObjectTypeString(arg.key_type ctx))
              wr.out(ss false)
            }
          }
        }
        case "r_atype" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            if arg.hasParamDesc {
              def ss:string (langWriter.getObjectTypeString(arg.paramDesc.nameNode.array_type ctx))
              wr.out(ss false)
            } {
              def ss:string (langWriter.getObjectTypeString(arg.array_type ctx))
              wr.out(ss false)
            }
          }
        }

        case "custom" {
           langWriter.CustomOperator(node ctx wr)
        }

        case "arraytype" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            if arg.hasParamDesc {
              langWriter.writeArrayTypeDef( (unwrap arg.paramDesc.nameNode) ctx wr)
            } {
              langWriter.writeArrayTypeDef(arg ctx wr)
            }
          }  
        }
        case "rawtype" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) > idx) {
            def arg:CodeNode (itemAt node.children idx)
            if arg.hasParamDesc {
              langWriter.writeRawTypeDef( (unwrap arg.paramDesc.nameNode) ctx wr)
            } {
              langWriter.writeRawTypeDef(arg ctx wr)
            }
          }
        }        
        case "macro" {
          ; compiledTags
          def p_write:CodeWriter (wr.getTag("utilities"))
          def newWriter:CodeWriter (new CodeWriter ())
          def testCtx:RangerAppWriterContext (ctx.fork())
          testCtx.restartExpressionLevel()

          this.walkCommandList(cmdArg node testCtx newWriter)
          def p_str:string (newWriter.getCode())
          def root:RangerAppWriterContext (ctx.getRoot())

          if ((has p_write.compiledTags p_str) == false) {
            set p_write.compiledTags p_str true
            
            def mCtx:RangerAppWriterContext (ctx.fork())
            mCtx.restartExpressionLevel()
            this.walkCommandList(cmdArg node mCtx p_write)
            
          }
        }
        case "create_polyfill" {
          def p_write:CodeWriter (wr.getTag("utilities"))
          def p_str:string cmdArg.string_value
          if ((has p_write.compiledTags p_str) == false) {
            p_write.raw(p_str true)
            set p_write.compiledTags p_str true
          }
        }
        case "typeof" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) >= idx) {
            def arg:CodeNode (itemAt node.children idx)
            if arg.hasParamDesc {
              this.writeTypeDef( (unwrap arg.paramDesc.nameNode) ctx wr)
            } {
              this.writeTypeDef(arg ctx wr)
            }
          }
        }
        case "imp" {
          langWriter.import_lib(cmdArg.string_value ctx wr)
        }
        case "atype" {
          def idx:int cmdArg.int_value
          if ((array_length node.children) >= idx) {
            def arg:CodeNode (itemAt node.children idx)
            def p@(optional):RangerAppParamDesc (this.findParamDesc( arg ctx wr))
            def nameNode:CodeNode (unwrap p.nameNode)

            def tn:string nameNode.array_type
            wr.out((this.getTypeString(tn ctx)) false)


          }
        }
      }
    } {
      if (cmd.value_type == RangerNodeType.VRef) {
        switch cmd.vref {
          case "nl" {
            wr.newline()
          }
          case "I" {
            wr.indent(1)
          }
          case "i" {
            wr.indent(-1)
          }
          case "op" {
            def fc:CodeNode (node.getFirst())
            wr.out(fc.vref false)
          }
        }
      } {
        if (cmd.value_type == RangerNodeType.String) {
          wr.out(cmd.string_value false)
        }
      }
    }
  }
  fn compile:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
  }


  fn findParamDesc@(weak optional):RangerAppParamDesc (obj:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    def varDesc@(lives):RangerAppParamDesc
    def set_nsp:boolean false
    def classDesc@(lives optional):RangerAppClassDesc
    if (0 == (array_length obj.nsp)) {
      set_nsp = true
    }
    if (obj.vref != "this") {
      if ((array_length obj.ns) > 1) {
        def cnt:int (array_length obj.ns)
        def classRefDesc@(lives):RangerAppParamDesc
        for obj.ns strname:string i {
          if (i == 0) {
            
            if (strname == "this") {
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
  
}
