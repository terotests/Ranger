

Import "ng_LiveCompiler.clj"
Import "ColorConsole.clj"
Import "ng_DictNode.clj"
Import "ng_RangerSerializeClass.clj"
Import "CmdParams.clj"

Import "viewbuilder_Android.clj"

class CompilerInterface {

  static fn main () {
    def params (new CmdParams)
    params.collect()
    def o (new CompilerInterface)
    o.run( params )
  }

  fn getEnvVar:string (name:string) {
      def r_lib (env_var name)
      def res:[string]
      if(!null? r_lib) {
          return (unwrap r_lib)
      }
      return ""
  }

  fn possiblePaths:[string] ( envVarName:string) {
      def res:[string]
      def parts (strsplit envVarName ";")
      for parts str:string i {
          def s (trim str)
          if( (strlen s) > 0) {
              def dirNames (strsplit s "/")
              removeLast dirNames
              def theDir ((join dirNames "/"))
              push res theDir
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

  fn run ( params:CmdParams) {

    def allowed_languages:[string] ([] _:string ("es6" "go" "scala" "java7" "swift3" "cpp" "php" "ranger" "csharp" ))

    def platform (params.getParam("p"))
    if(!null? platform) {
      print "platform == " + (unwrap platform)
    }
    
    if ( (array_length params.values) < 1  ) {
      print "Ranger compiler, version 2.0.42"
      print "usage <file> -l <language> -d <directory> -o <targetfile>"
      print "allowed languages: " + (join allowed_languages " ")
      return 
    }    

    def the_file:string (itemAt params.values 0)
    def root_file the_file
    def the_lang_file:string "Lang.clj"         ; (shell_arg 1)
    def the_lang:string "es6"              ; (shell_arg 2)
    def the_target_dir:string ((current_directory) + "/bin")  ; (shell_arg 3)
    def the_target:string "output.js"
    def package_name ""
    def comp_attrs:[string:string]

    def outDir (params.getParam("o"))
    if(!null? outDir) {
      the_target = (unwrap outDir)
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

    def langFileDirs (this.possiblePaths( (this.getEnvVar("RANGER_LIB")) ))

    def c:string (read_file (current_directory) the_file)    
    def code:SourceCode (new SourceCode ((unwrap c)))

    code.filename = the_file
    def parser:RangerLispParser (new RangerLispParser (code))
    parser.parse()

    def root (unwrap parser.rootNode)

    print "--> ready to compile"

    def flags (keys params.flags)

    for root.children ch:CodeNode ci {
      if( (array_length ch.children) > 2 ) {
        def fc (ch.getFirst())
        if( fc.vref == "flag" ) {
          def fName (ch.getSecond())
          for flags flag_name:string i {
            if( flag_name == fName.vref) {
              def compInfo (ch.getThird())
              def i 0
              def cnt (array_length compInfo.children)
              while( i < (cnt - 1 ) ) {
                def fc (itemAt compInfo.children i)
                def sc (itemAt compInfo.children (i + 1))

                switch fc.vref {
                  case "libpath" {
                    langFileDirs = (this.possiblePaths(sc.string_value))
                  }
                  case "output" {
                    the_target = sc.string_value
                  }
                  case "root-file" {
                    root_file = sc.string_value
                  }
                  case "language" {
                    the_lang = sc.string_value
                  }
                  case "absolute_output_dir" {
                    the_target_dir = sc.string_value
                  }
                  case "relative_output_dir" {
                    the_target_dir = (current_directory) + "/" + sc.string_value
                  }
                  case "package" {
                    package_name = sc.string_value
                  }
                  case "android_res_dir" {
                    set comp_attrs fc.vref sc.string_value
                  }
                }
                ; print " " + fc.vref + " = " + sc.string_value
                i = i + 2
              }
            }
          }
        }
      }
    }

    if ( ( indexOf allowed_languages the_lang) < 0 ) {
      print "Invalid language : " + the_lang
      def s:string ""
      print "allowed languages: " + (join allowed_languages " ")     
      return
    }

;    return

    def lcc:LiveCompiler (new LiveCompiler())
    def node:CodeNode (unwrap parser.rootNode)
    def flowParser:RangerFlowParser (new RangerFlowParser ())
    def appCtx:RangerAppWriterContext (new RangerAppWriterContext()))
    def wr:CodeWriter (new CodeWriter())
    
;    appCtx.outputPath = ( current_directory )
;    def outputPath (env_var "RANGER_OUTPUT_DIR")
;    if(!null? outputPath) {
;        print "defined output directory to " + (unwrap outputPath)
;        appCtx.outputPath = (unwrap outputPath)
;    }

    appCtx.libraryPaths = langFileDirs
    set appCtx.compilerSettings "package" package_name
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
        appCtx.setRootFile( root_file )

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

        if(has comp_attrs "android_res_dir") {
          print "--> had android res dir"
          def resDir (unwrap (get comp_attrs "android_res_dir"))
          def resFs:CodeFileSystem (new CodeFileSystem())
          def file:CodeFile (resFs.getFile("." "README.txt"))
          def wr:CodeWriter (unwrap (file.getWriter()))

          def builder (new viewbuilder_Android)

          appCtx.viewClassBody.forEach({
              builder.writeClass( item appCtx wr )
          })
          resFs.saveTo(resDir)
          
        }

        def fileSystem:CodeFileSystem (new CodeFileSystem())
        def file:CodeFile (fileSystem.getFile("." the_target))
        def wr@(optional):CodeWriter (file.getWriter())
        def staticMethods:RangerAppClassDesc
        def importFork:CodeWriter (wr.fork())

        lcc.parser = flowParser

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
          if(cl.is_union) {
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

        def added_import:[string:boolean]

        if( appCtx.targetLangName  == "es6") {
          if( has lcc.langWriter.compFlags "ReactNative" ) {
            importFork.out("import React, { Component } from 'react';" true) 
          } 
        }
        
        for import_list codeStr:string i {

          if( has added_import codeStr) {
            continue
          }
          set added_import codeStr true

          switch appCtx.targetLangName {
            case "es6" {
              ; lcc.langWriter

              def parts (strsplit codeStr ".")
              if( (array_length parts) > 1) {
                importFork.out (("import  { " + (itemAt parts 1) + " } from  '" + (itemAt parts 0) + "';") , true)
              }

              ;if( has lcc.langWriter.compFlags "ReactNative" ) {
              ;  def parts (split codeStr ".")
              ;} {
              ;}
            }
            case "go" {
              if ( (charAt codeStr 0) == (to_int (charcode "_") ) ) {
                importFork.out (( " _ \"" + (substring codeStr 1 (strlen codeStr)) + "\"") , true)
              } {
                importFork.out (("\"" + codeStr + "\"") , true)
              }
              
            }
            case "csharp" {
              importFork.out(("using " + codeStr + ";") true)              
            }
            case "rust" {
              importFork.out (( "use " + codeStr + ";") , true)
            }
            case "java7" {
              importFork.out (("import "  + codeStr + ";") , true)
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
