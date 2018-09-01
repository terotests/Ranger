
Import "ng_LiveCompiler.clj"
Import "JinxCommands.clj"

; open a file...

class Execute {

  sfn hello@(main):void () {

    def allowed_languages:[string] ([] _:string ("es6" "go" "scala" "java7" "swift3" "cpp" "php" "ranger" ))

    if ( (shell_arg_cnt) < 1  ) {
      print "Ranger Execute Env, version 0.0.1"
      print "usage <file>"
      return 
    }    

    def the_file:string (shell_arg 0)
    def the_lang_file:string "Lang.clj"
    def the_lang:string "ranger"

    if ( (file_exists "." the_file) == false) {
      print "Could not compile."
      print "File not found: " + the_file
      return
    }

    if ( (file_exists "." the_lang_file) == false) {
      print "language file " + the_lang_file + " not found!"
      print "download: https://raw.githubusercontent.com/terotests/Ranger/master/compiler/Lang.clj"
      return
    }        

    print "File to be executed: " + the_file

    def c:string (read_file "." the_file)    
    def code:SourceCode (new SourceCode ((unwrap c)))
    code.filename = the_file
    def parser:RangerLispParser (new RangerLispParser (code))
    parser.parse()

    def lcc:LiveCompiler (new LiveCompiler())
    def node:CodeNode (unwrap parser.rootNode)
    def flowParser:RangerFlowParser (new RangerFlowParser ())
    def appCtx:RangerAppWriterContext (new RangerAppWriterContext()))
    def wr:CodeWriter (new CodeWriter())

      try {

        flowParser.mergeImports(node appCtx wr)
        def lang_str:string (read_file "." the_lang_file)
        def lang_code:SourceCode (new SourceCode ( (unwrap lang_str)) )
        lang_code.filename = the_lang_file
        def lang_parser:RangerLispParser (new RangerLispParser (lang_code))
        lang_parser.parse()
        appCtx.langOperators = (unwrap lang_parser.rootNode)
        print "1. Collecting available methods."
        flowParser.CollectMethods (node appCtx wr)
        if ( ( array_length appCtx.compilerErrors ) > 0 ) {
          Execute.displayCompilerErrors(appCtx)
          return
        }
        print "2. Analyzing the code."
        appCtx.targetLangName = the_lang
        flowParser.WalkNode (node appCtx wr)
        if ( ( array_length appCtx.compilerErrors ) > 0 ) {
          Execute.displayCompilerErrors(appCtx)
          Execute.displayParserErrors(appCtx)
          return
        }
        print "3. Ready to go...."
        for appCtx.definedClassList cName:string i {
            def cl:RangerAppClassDesc (get appCtx.definedClasses cName)
            print "class: " + cl.name
            for cl.defined_variants fnVar:string i {
                print fnVar
                def mVs:RangerAppMethodVariants (get cl.method_variants fnVar)
                for mVs.variants variant:RangerAppFunctionDesc i {
                    def body:CodeNode (unwrap variant.fnBody)
                    for body.children ch:CodeNode i {
                        print (ch.getLineAsString())
                    }
                    def Cmds:JinxCommands (new JinxCommands())
                    def RunCtx:RangerAppWriterContext (new RangerAppWriterContext ())
                    timer "run.." {
                        Cmds.run(body RunCtx)
                    }

                    print "context after run"
                    for RunCtx.localVarNames vname:string  i {
                        print "variable : " + vname   
                        def dd:RangerAppParamDesc (RunCtx.getVariableDef(vname))
                        if(dd.value) {
                            print "--> had value!!! int : " + dd.value.int_value                            
                        }
                    }
                }
            }
        }
      }{
        print "Got unknown compiler error"
        return
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
}
