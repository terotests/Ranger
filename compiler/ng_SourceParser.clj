
Import "ng_LiveCompiler.clj"
Import "ColorConsole.clj"
Import "ng_DictNode.clj"
Import "ng_RangerSerializeClass.clj"

class SourceParser {

  def lang_parser:RangerLispParser
  def ctx@(weak):RangerAppWriterContext

  def flowParser:RangerFlowParser
  ; saving previous information

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

    fn re_parse@(weak):RangerAppWriterContext (schema_file:string appCtx:RangerAppWriterContext) {

        this.ctx = appCtx
        def the_lang:string "es6"
        def the_lang_file:string "Lang.clj"
        def link_file:string "dbLinks.clj"
        
        def langLibEnv (env_var "RANGER_LIB")
        if(null? langLibEnv) {
          print "please define RANGER_LIB environment variable "
        }    
        def langFilePaths (this.possiblePaths("RANGER_LIB"))
        def langFilePath ( this.searchLib(langFilePaths the_lang_file) )
        def langFileDirs (this.possiblePaths("RANGER_LIB"))

        def sh_data:string ( unwrap (read_file "." schema_file) )
        def s1:SourceCode (new SourceCode (sh_data))
        def sh_parser:RangerLispParser (new RangerLispParser(s1))
        sh_parser.parse()

        def node:CodeNode (unwrap sh_parser.rootNode)
        flowParser = (new RangerFlowParser ())

        appCtx.outputPath = ( current_directory )
        def outputPath (env_var "RANGER_OUTPUT_DIR")
        if(!null? outputPath) {
            print "defined output directory to " + (unwrap outputPath)
            appCtx.outputPath = (unwrap outputPath)
        }
        appCtx.libraryPaths = (this.possiblePaths("RANGER_LIB"))

        def wr:CodeWriter (new CodeWriter())
        appCtx.setRootFile( schema_file )
        flowParser.clearImports(node appCtx wr)
        flowParser.CollectMethods (node appCtx wr)
        if ( ( array_length appCtx.compilerErrors ) > 0 ) {
          return appCtx
        }
        appCtx.targetLangName = the_lang
        flowParser.WalkNode (node appCtx wr)
        if ( ( array_length appCtx.compilerErrors ) > 0 ) {
          return appCtx
        }        
        return appCtx
    }

    fn parse@(weak):RangerAppWriterContext (schema_file:string) {

        def the_lang:string "es6"
        def the_lang_file:string "Lang.clj"
        def link_file:string "dbLinks.clj"
        
        def langLibEnv (env_var "RANGER_LIB")
        if(null? langLibEnv) {
          print "please define RANGER_LIB environment variable "
        }    
        def langFilePaths (this.possiblePaths("RANGER_LIB"))
        def langFilePath ( this.searchLib(langFilePaths the_lang_file) )
        def langFileDirs (this.possiblePaths("RANGER_LIB"))

        def sh_data:string ( unwrap (read_file "." schema_file) )

        def s1:SourceCode (new SourceCode (sh_data))
        s1.filename = schema_file
        def sh_parser:RangerLispParser (new RangerLispParser(s1))
        sh_parser.parse()

        def node:CodeNode (unwrap sh_parser.rootNode)
        flowParser = (new RangerFlowParser ())
        def appCtx@(lives):RangerAppWriterContext (new RangerAppWriterContext()))
        this.ctx = appCtx
        appCtx.outputPath = ( current_directory )
        def outputPath (env_var "RANGER_OUTPUT_DIR")
        if(!null? outputPath) {
            print "defined output directory to " + (unwrap outputPath)
            appCtx.outputPath = (unwrap outputPath)
        }
        appCtx.libraryPaths = (this.possiblePaths("RANGER_LIB"))

        def wr:CodeWriter (new CodeWriter())

        def lang_str:string (read_file "." the_lang_file)
        def lang_code:SourceCode (new SourceCode ( (unwrap lang_str)) )     
        lang_code.filename = the_lang_file

        lang_parser = (new RangerLispParser (lang_code))
        lang_parser.parse()        

        appCtx.langOperators = (unwrap lang_parser.rootNode)
        appCtx.setRootFile( schema_file )

        def ops (new RangerActiveOperators)
        ops.initFrom( (unwrap lang_parser.rootNode) )
        appCtx.operators = ops

        flowParser.mergeImports(node appCtx wr)
        flowParser.CollectMethods (node appCtx wr)
        if ( ( array_length appCtx.compilerErrors ) > 0 ) {
          return appCtx
        }
        appCtx.targetLangName = the_lang
        flowParser.StartWalk (node appCtx wr)       
;        flowParser.WalkNode (node appCtx wr)
        if ( ( array_length appCtx.compilerErrors ) > 0 ) {
          return appCtx
        }        
        return appCtx
    }

    fn writeToFilesystem( appCtx:RangerAppWriterContext the_target_dir:string the_target:string ) {

        def lcc:LiveCompiler (new LiveCompiler())
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
        fileSystem.saveTo(the_target_dir)        
    }

}

