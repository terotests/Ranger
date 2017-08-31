

Import "ng_LiveCompiler.clj"
Import "ColorConsole.clj"
Import "ng_DictNode.clj"
Import "ng_RangerSerializeClass.clj"

class CompilerInterface {

  sfn m@(main) () {
    def o (new CompilerInterface)
    o.run()
  }

  fn possiblePaths:[string] ( envVarName:string) {
      def r_lib (env_var envVarName)
      def res:[string]
      if(!null? r_lib) {
          def parts (strsplit (unwrap r_lib) ";")
          for parts str:string i {
              def s (trim str)
              if( (strlen s) > 0) {
                  def dirNames (strsplit s "/")
                  removeLast dirNames
                  def theDir ((join dirNames "/"))
                  push res theDir
              }
          }
      }
      push res "./"
      return res
  } 

  fn searchLib:string (paths:[string] libname:string) {
      for paths path:string i {
          if( file_exists path libname ) {
              return path 
          }
      }
      return ""
  }  

  fn run () {

    def allowed_languages:[string] ([] _:string ("es6" "go" "scala" "java7" "swift3" "cpp" "php" "ranger" ))

    if ( (shell_arg_cnt) < 5  ) {
      print "Ranger compiler, version 2.0.34"
      print "usage <file> <language-file> <language> <directory> <targetfile>"
      print "allowed languages: " + (join allowed_languages " ")
      return 
    }    

    def the_file:string (shell_arg 0)
    def the_lang_file:string (shell_arg 1)
    def the_lang:string (shell_arg 2)
    def the_target_dir:string (shell_arg 3)
    def the_target:string (shell_arg 4)

    print "language == " + the_lang

    if ( ( indexOf allowed_languages the_lang) < 0 ) {
      print "Invalid language : " + the_lang
      def s:string ""
      print "allowed languages: " + (join allowed_languages " ")     
      return
    }

    def langLibEnv (env_var "RANGER_LIB")

    if(null? langLibEnv) {
      print "please define RANGER_LIB environment variable "
      return
    }    
      
    if ( (file_exists "." the_file) == false) {
      print "Could not compile."
      print "File not found: " + the_file
      return
    }
    def langFilePaths (this.possiblePaths("RANGER_LIB"))
    def langFilePath ( this.searchLib(langFilePaths the_lang_file) )
    
    if ( (file_exists langFilePath the_lang_file) == false) {
      print "language file " + the_lang_file + " not found! Check the RANGER_LIB enviroment variable"
      print "currently pointing at : " + (unwrap langLibEnv)
      print "download: https://raw.githubusercontent.com/terotests/Ranger/master/compiler/Lang.clj"
      return
    } {
      print "Using language file from : " + langFilePath 
    }       
    print "File to be compiled: " + the_file

    def langFileDirs (this.possiblePaths("RANGER_LIB"))

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
    
    appCtx.outputPath = ( current_directory )
    def outputPath (env_var "RANGER_OUTPUT_DIR")
    if(!null? outputPath) {
        print "defined output directory to " + (unwrap outputPath)
        appCtx.outputPath = (unwrap outputPath)
    }

    appCtx.libraryPaths = (this.possiblePaths("RANGER_LIB"))

    for appCtx.libraryPaths include_path:string i {
      print "include-path : " + include_path
    }
   
    ; // 

    timer "Total time" {
      try {
        flowParser.mergeImports(node appCtx wr)
        def lang_str:string (read_file langFilePath the_lang_file)
        def lang_code:SourceCode (new SourceCode ( (unwrap lang_str)) )
        lang_code.filename = the_lang_file
        def lang_parser:RangerLispParser (new RangerLispParser (lang_code))
        lang_parser.parse()
        appCtx.langOperators = (unwrap lang_parser.rootNode)
        appCtx.setRootFile( the_file )

        def ops (new RangerActiveOperators)
        ops.initFrom( (unwrap lang_parser.rootNode) )
        appCtx.operators = ops

        print "1. Collecting available methods."
        flowParser.CollectMethods (node appCtx wr)
        if ( ( array_length appCtx.compilerErrors ) > 0 ) {
          CompilerInterface.displayCompilerErrors(appCtx)
          return
        }
        print "2. Analyzing the code."
        appCtx.targetLangName = the_lang

        print "selected language is " + appCtx.targetLangName 
        flowParser.StartWalk (node appCtx wr)
        if ( ( array_length appCtx.compilerErrors ) > 0 ) {
          CompilerInterface.displayCompilerErrors(appCtx)
          ; CompilerInterface.displayParserErrors(appCtx)
          return
        }
        print "3. Compiling the source code."
        def fileSystem:CodeFileSystem (new CodeFileSystem())
        def file:CodeFile (fileSystem.getFile("." the_target))
        def wr@(optional):CodeWriter (file.getWriter())
        def staticMethods:RangerAppClassDesc
        def importFork:CodeWriter (wr.fork())

        for appCtx.definedClassList cName:string i {
          def cl:RangerAppClassDesc (get appCtx.definedClasses cName)
          if(cl.is_operator_class) {
            lcc.WalkNode( (unwrap cl.classNode ) appCtx (unwrap wr))
          }
          if(cl.is_generic_instance) {
            lcc.WalkNode( (unwrap cl.classNode ) appCtx (unwrap wr))
          }
        }

        for appCtx.definedClassList cName:string i {
          if (cName == "RangerStaticMethods") {
            staticMethods = (get appCtx.definedClasses cName)
            continue _
          }
          def cl:RangerAppClassDesc (get appCtx.definedClasses cName)
          if(cl.is_trait) {
            continue
          }
          if(cl.is_system) {
            continue _
          }
          if(cl.is_operator_class) {
            continue
          }
          if(cl.is_generic_instance) {
            continue
          }          
          if(cl.is_system_union) {
            continue _
          }
          lcc.WalkNode( (unwrap cl.classNode ) appCtx (unwrap wr))
        }
        if (!null? staticMethods) {
          lcc.WalkNode( (unwrap staticMethods.classNode) appCtx (unwrap wr))
        }
        for flowParser.collectedIntefaces ifDesc:RangerAppClassDesc i {
            print "should define also interface " + ifDesc.name
            lcc.langWriter.writeInterface( ifDesc appCtx (unwrap wr) )
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
              if ( (charAt codeStr 0) == (to_int (charcode "_") ) ) {
                importFork.out (( " _ \"" + (substring codeStr 1 (strlen codeStr)) + "\"") , true)
              } {
                importFork.out (("\"" + codeStr + "\"") , true)
              }
              
            }
            case "rust" {
              importFork.out (( "use " + codeStr + ";") , true)
            }
            case "cpp" {
              importFork.out (( "#include  " + codeStr + "") , true)
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
        fileSystem.saveTo(appCtx.outputPath + the_target_dir)
        print "Ready."
        CompilerInterface.displayCompilerErrors(appCtx)
        ; CompilerInterface.displayParserErrors(appCtx)

      }{
        if(lcc.lastProcessedNode) {
          print "Got compiler error close to"
          print (lcc.lastProcessedNode.getLineAsString())
          return
        }
        if(flowParser.lastProcessedNode) {
          print "Got compiler error close to"
          print (flowParser.lastProcessedNode.getLineAsString())
          return
        }
        print "Got unknown compiler error"
        return
      }

    }
  }

  sfn displayCompilerErrors:void (appCtx@(weak):RangerAppWriterContext) {
    def cons:ColorConsole (new ColorConsole())

    for appCtx.compilerErrors e:RangerCompilerMessage i {
        def line_index:int (e.node.getLine ())                      
        cons.out( "gray" ( (e.node.getFilename ()) + " Line: " + (1 + line_index)) ) 
        cons.out( "gray" e.description )
        cons.out( "gray" (e.node.getLineString(line_index)) )
        cons.out( "" ( (e.node.getColStartString()) + "^-------" ) )
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
