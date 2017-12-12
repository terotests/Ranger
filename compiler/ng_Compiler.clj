; def opts ([] "name" "version" "description" "author" "license")

flag npm (
  name "ranger-lib"
  version "2.1.56"
  description "Cross-language compiler and build tool"
  author "Tero Tolonen"
  license "MIT"
)

flag nodecli (
  name "ranger-compiler"
)

plugin.md "plugins.md" {
  h2 'How to push code from plugins to the Ranger compiler'
  h3 'generate_ast phase'
  p 'Before code gets typechecke during the generate_ast phase you can use'
  code '(source_code:string node:CodeNode wr:CodeWriter )'
  p 'to push code before it is statically analyzed'
}

Import "ng_LiveCompiler.clj"
Import "ColorConsole.clj"
Import "ng_DictNode.clj"
Import "ng_RangerSerializeClass.clj"
Import "CmdParams.clj"
Import "ng_RangerDocGenerator.clj"

Import "ng_RangerPlugin.clj"
Import "viewbuilder_Android.clj"
Import "viewbuilder_Web.clj"

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
      push res "./"
      for parts str:string i {
          def s (trim str)
          if( (strlen s) > 0) {
              def dirNames (strsplit s "/")
              removeLast dirNames
              def theDir ((join dirNames "/"))
              push res theDir
          }
      }
      push res (install_directory)
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

  fn fillStr:string (cnt:int) {
    def s ""
    def i cnt
    while ( i > 0) {
      s = s + " "
      i = i - 1
    }
    return s
  }

  fn run ( params:CmdParams) {

    def allowed_languages:[string] ([] "es6" "go" "scala" "java7" "swift3" "cpp" "php" "csharp" )

    def platform (params.getParam("p"))
    if(!null? platform) {
      print "platform == " + (unwrap platform)
    }

    def the_file ""
    def plugins_only false

    def valid_options:[string] ([] _:string
      ('l'  ('Selected language, one of ' + ( join allowed_languages ', ')) 
      'd'  'output directory, default directory is "bin/"'
      'o'  'output file, default is "output.<language>"'
      'classdoc'  'write class documentation .md file'
      'operatordoc'  'write operator documention into .md file'
    ))

    def valid_flags:[string] ([] _:string
      (
      'deadcode' 'Eliminate functions which are not called by any other functions'
      'dead4main' 'Eliminate functions and classes which are unreachable from the main function'
      'forever' 'Leave the main program into eternal loop (Go, Swift)'
      'allowti' 'Allow type inference at target lang (creates slightly smaller code)'
      'plugins-only' 'ignore built-in language output and use only plugins'
      'plugins' '(node compiler only) run specified npm plugins -plugins="plugin1,plugin2"'
      'strict' 'Strict mode. Do not allow automatic unwrapping of optionals outside of try blocks.'
      'typescript' 'Writes JavaScript code with TypeScript annotations'
      'npm' 'Write the package.json to the output directory' 
      'nodecli' 'Insert node.js command line header #!/usr/bin/env node to the beginning of the JavaScript file'
      'nodemodule' 'Export the classes as node.js modules (this option will disable the static main function)'
      'client'  'the code is ment to be run in the client environment'
      'scalafiddle'  'scalafiddle.io compatible output'
      'compiler' 'recompile the compiler'
      'copysrc' 'copy all the source codes into the target directory'
      )
    )

    def parser_pragmas:[string] ([] _:string
      (
        '@noinfix(true)' 'disable operator infix parsing and automatic type definition checking '
      ))

    if( has params.flags "compiler") {
      print "---------------------------------------------"
      print " re-compiling the compiler itself "
      print "---------------------------------------------"
      the_file = "ng_Compiler.clj"
    } {
      if ( (array_length params.values) < 1  ) {
        print "Ranger compiler, version " + (get_option "version")
        print "Installed at: " + (install_directory)
        print "Usage: <file> <options> <flags>"
        print "Options: -<option>=<value> "
        def optCnt 0
        while (optCnt < (array_length valid_options) ) {
          def option:string (itemAt valid_options optCnt)
          def optionDesc:string (itemAt valid_options (optCnt+1))
          print "  -" + option + "=<value> " + (this.fillStr( 13 - (strlen option))) + optionDesc
          optCnt = optCnt + 2
        }
        print "Flags: -<flag> "
        def optCnt 0
        while (optCnt < (array_length valid_flags) ) {
          def option (itemAt valid_flags optCnt)
          def optionDesc (itemAt valid_flags (optCnt+1))
          print "  -" + option + " " + (this.fillStr( 13 - (strlen option))) + optionDesc
          optCnt = optCnt + 2
        }
        print "Pragmas: (inside the source code files) "
        def optCnt 0
        while (optCnt < (array_length parser_pragmas) ) {
          def option (itemAt parser_pragmas optCnt)
          def optionDesc (itemAt parser_pragmas (optCnt+1))
          print "   " + option + " " + (this.fillStr( 16 - (strlen option))) + optionDesc
          optCnt = optCnt + 2
        }
        return 
      }    
      the_file = (itemAt params.values 0)
    }

    def root_file the_file
    def the_lang_file:string "Lang.clj"         ; (shell_arg 1)
    def the_lang:string "es6"              ; (shell_arg 2)
    def the_target_dir:string ((current_directory) + "/bin")  ; (shell_arg 3)
    def the_target:string "output"
    def package_name ""
    def comp_attrs:[string:string]

    def outDir (params.getParam("o"))
    if(!null? outDir) {
      the_target = (unwrap outDir)
    } 

    def langLibEnv (env_var "RANGER_LIB")

    if(null? langLibEnv) {
      print "note: RANGER_LIB environment variable not defined"
    }    

    def theFilePaths (this.possiblePaths( (this.getEnvVar("RANGER_LIB"))))
    def theFilePath ( this.searchLib(theFilePaths the_file) )
      
    if ( (file_exists theFilePath the_file) == false) {
      print "Could not compile."
      print "File not found: " + the_file
      return
    }
    
    def langFilePaths (this.possiblePaths( (this.getEnvVar("RANGER_LIB"))))
    def langFilePath ( this.searchLib(langFilePaths the_lang_file) )
    
    if ( (file_exists langFilePath the_lang_file) == false) {
      print "language file " + the_lang_file + " not found! Check the library directory or RANGER_LIB enviroment variable"
      print "currently pointing at : " + (unwrap langLibEnv)
      print "download: https://raw.githubusercontent.com/terotests/Ranger/master/compiler/Lang.clj"
      return
    } {
      print "Using language file from : " + langFilePath 
    }       
    print "File to be compiled: " + the_file

    def langFileDirs (this.possiblePaths( (this.getEnvVar("RANGER_LIB")) ))

    def c:string (read_file theFilePath the_file)    
    def code:SourceCode (new SourceCode ((unwrap c)))

    code.filename = the_file
    def parser:RangerLispParser (new RangerLispParser (code))
    if( has params.flags "no-op-transform") {
      parser.disableOperators = true
    }
    parser.parse( (has params.flags "no-op-transform") )
    def root (unwrap parser.rootNode)
    print "--> ready to compile"

    def flags (keys params.flags)

    for root.children ch:CodeNode ci {

      def inserted_nodes:[CodeNode]

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
                  case "web_res_dir" {
                    set comp_attrs fc.vref sc.string_value
                  }
                  case "Import" {
                    push inserted_nodes (r.expression (r.vref "Import") (r.value sc.string_value))                    
                  }
                  default {
                    if( (strlen sc.string_value) > 0) {
                      set comp_attrs fc.vref sc.string_value                    
                    }
                  }
                }
                ; print " " + fc.vref + " = " + sc.string_value
                i = i + 2
              }
            }


          }
          clear ch.children
          for inserted_nodes new_node@(lives):CodeNode i {
            print " *** Inserting " + (new_node.getCode())
            insert root.children 0 new_node
;            push ch.children new_node
          }
        }
      }
    }

    insert root.children 0 (r.expression (r.vref "Import") (r.value "stdlib.clj"))
    
    def outDir (params.getParam("o"))
    if(!null? outDir) {
      the_target = (unwrap outDir)
    } 
    set comp_attrs "o" the_target

    def outDir (params.getParam("d"))
    if(!null? outDir) {
      the_target_dir = ((current_directory) + "/"  + (unwrap outDir))  ; (shell_arg 3)
    } 
    set comp_attrs "d" the_target_dir

    def pLang (params.getParam("l"))
    if(!null? pLang) {
      the_lang = (unwrap pLang)
    } 

    ; --- context for the compilation ---
    def appCtx:RangerAppWriterContext (new RangerAppWriterContext()))

    appCtx.libraryPaths = langFileDirs
    set appCtx.compilerSettings "package" package_name
    if(appCtx.hasCompilerFlag('verbose')) {
      for appCtx.libraryPaths include_path:string i {
        print "include-path : " + include_path
      }
    }

    params.flags.forEach({
      def n index
      set appCtx.compilerFlags n true
      ; print " / flag " + index
    })

    params.params.forEach({
      def v item
      set comp_attrs index v
    })

    comp_attrs.forEach({
      def n item
      set appCtx.compilerSettings index n
      ; print " / setting " + index
    })

    if ( ( indexOf allowed_languages the_lang) < 0 ) {
      print "Invalid language : " + the_lang
      def s:string ""
      print "allowed languages: " + (join allowed_languages " ")     
      return
    }

    ; set the language
    set appCtx.compilerSettings "l" the_lang

    if( the_target == "output") {

      def root_parts (strsplit root_file ".")
      if( (array_length root_parts) == 2) {
        the_target = (itemAt root_parts 0)
      }

      switch the_lang {
        case "es6" {
          the_target = the_target + ".js"
          if( appCtx.hasCompilerFlag( "typescript") ) {
            the_target = the_target + ".ts"
          }
        }
        case "swift3" {
          the_target = the_target + ".swift"
        }
        case "php" {
          the_target = the_target + ".php"
        }
        case "csharp" {
          the_target = the_target + ".cs"
        }
        case "java7" {
          the_target = the_target + ".java"
        }
        case "go" {
          the_target = the_target + ".go"
        }
        case "scala" {
          the_target = the_target + ".scala"
        }
        case "cpp" {
          the_target = the_target + ".cpp"
        }
      }
    }
    set appCtx.compilerSettings "o" the_target

    ; intializations can be divided into two columns if parenthesis are used...
    (def lcc (new LiveCompiler()))                  (def node (unwrap parser.rootNode))
    (def flowParser (new RangerFlowParser ()))      (def fileSystem (new CodeFileSystem()))
    
    def file (fileSystem.getFile("." the_target)) 
    def wr (file.getWriter())
    
    if(appCtx.hasCompilerFlag("copysrc")) {
      print "--> copying " + (code.filename)
      def fileWr (wr.getFileWriter("." code.filename))
      fileWr.raw( code.code false)
    }
    appCtx.parser = flowParser
    appCtx.compiler = lcc

    lcc.parser = flowParser

    if_javascript {
      if( appCtx.hasCompilerSetting("plugins")) {
        def val (appCtx.getCompilerSetting("plugins"))
        def list (strsplit val ",")
        list.forEach({
          try {
            def plugin (load_compiler_plugin item)
            def features ( register_plugin plugin )
            if(appCtx.hasCompilerFlag('verbose')) {
              print "Plugin " + item + " registered with features "
              features.forEach({
                print " [x] " + item
              })
            }
            def regPlug (new RangerRegisteredPlugin)
            regPlug.name = item
            regPlug.features = (clone features)
            appCtx.addPlugin(regPlug)
            ; plugin_preprocess plugin root appCtx (unwrap wr)
          } {
            print "Failed to register plugin " + item
          } 
        })
      }
      plugins_only = (appCtx.hasCompilerFlag("plugins-only"))
    }

    timer "Compile time in seconds " {
      try {

        flowParser.mergeImports(node appCtx (unwrap wr) )
        def lang_str:string (read_file langFilePath the_lang_file)
        def lang_code:SourceCode (new SourceCode ( (unwrap lang_str)) )
        lang_code.filename = the_lang_file
        def lang_parser:RangerLispParser (new RangerLispParser (lang_code))
        lang_parser.parse(false)
        appCtx.langOperators = (unwrap lang_parser.rootNode)
        appCtx.setRootFile( root_file )

        def ops (new RangerActiveOperators)
        ops.initFrom( (unwrap lang_parser.rootNode) )
        appCtx.operators = ops

        appCtx.targetLangName = the_lang

        lcc.initWriter( appCtx )

        if_javascript {
          def ppList (appCtx.findPluginsFor("generate_ast"))
          ppList.forEach({
            try {
              def plugin (load_compiler_plugin item)
              call_plugin plugin "generate_ast" root appCtx (unwrap wr)
            } {
            }
          })
        }

        print "1. Collecting available methods."
        flowParser.CollectMethods (node appCtx (unwrap wr))
        if ( ( array_length appCtx.compilerErrors ) > 0 ) {
          CompilerInterface.displayCompilerErrors(appCtx)
          return
        }

        if_javascript {
          def ppList (appCtx.findPluginsFor("pre_flow"))
          ppList.forEach({
            try {
              def plugin (load_compiler_plugin item)
              call_plugin plugin "pre_flow" root appCtx (unwrap wr)
            } {
            }
          })
        }
        appCtx.initOpList()
        print "2. Analyzing the code."
        print "selected language is " + appCtx.targetLangName 

        flowParser.StartWalk (node appCtx (unwrap wr))

        if(appCtx.hasCompilerFlag('showtypes')) {
          print "--> checking if any node has typeClass"
          def cnt 0
          def totalCnt 0
          def typeCnt 0
          node.forTree({
            totalCnt = totalCnt + 1
            if(!null? item.evalTypeClass) {
              if( cnt < 10 ) {
                print " -- type class " + item.evalTypeClass.name + " at " + (item.getCode())
              }
              cnt = cnt + 1
            }
          })
          print "TOTAL number of typed nodes : " + cnt + " / " + totalCnt

          appCtx.typeClasses.forEach({
            print " typeClass : " + index
            if(!null? item.keyType) {
              print "^ key type " + (item.keyType.name)
            }
            if(!null? item.arrayType) {
              print "^ array type " + (item.arrayType.name)
            }
          })
        }
        
        ; if plugins only is enabled, ignore the compiler errors
        if( plugins_only == false ) {
          if ( ( array_length appCtx.compilerErrors ) > 0 ) {
            CompilerInterface.displayCompilerErrors(appCtx)
            return
          }
        }
        if_javascript {
          def ppList (appCtx.findPluginsFor("preprocess"))
          ppList.forEach({
            try {
              def plugin (load_compiler_plugin item)
              call_plugin plugin "preprocess" root appCtx (unwrap wr)
            } {
            }
          })
        }

        if plugins_only  {
          print "3. Plugins only enabled, ignoring the source code generation"
        } {

          flowParser.SolveAsyncFuncs( root appCtx (unwrap wr))

          print "3. Compiling the source code."
          switch appCtx.targetLangName {
            case "java7" {
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
                resFs.saveTo(resDir (appCtx.hasCompilerFlag("show-writes")))          
              }
            }
            case "es6" {
              if(has comp_attrs "web_res_dir") {
                print "--> had web res dir"
                def resDir (unwrap (get comp_attrs "web_res_dir"))
                def resFs:CodeFileSystem (new CodeFileSystem())
                def file:CodeFile (resFs.getFile("." "webviews.html"))
                def wr:CodeWriter (unwrap (file.getWriter()))
                def builder (new viewbuilder_Web)
                builder.CreateViews( appCtx wr)
                resFs.saveTo(resDir (appCtx.hasCompilerFlag("show-writes")))          
              }
            }
          }

          def staticMethods:RangerAppClassDesc
          
          def importFork:CodeWriter (wr.fork())
          def contentFork (wr.fork())
          def theEnd (wr.createTag("file_end"))

          wr = contentFork

          def handledClasses:[string:boolean]

          for appCtx.definedClassList cName:string i {
            if (cName == "RangerStaticMethods") {
              staticMethods = (get appCtx.definedClasses cName)
              continue _
            }
            def cl:RangerAppClassDesc (get appCtx.definedClasses cName)
            if(cl.is_operator_class) {
              continue
            }
            if(cl.is_trait) {
              continue
            }
            if(cl.is_system) {
              continue _
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
            if(has handledClasses cName) {
              continue
            }
            set handledClasses cName true

            if( (array_length cl.extends_classes) > 0 ) {
              ; got to walk the extended classes first..
              for cl.extends_classes eClassName:string i {
                if(has handledClasses eClassName) {
                  continue
                }
                def parentCl:RangerAppClassDesc (get appCtx.definedClasses eClassName)
                lcc.WalkNode( (unwrap parentCl.classNode ) appCtx (unwrap wr))
                set handledClasses eClassName true      
              }
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

          ; -------------------------------------------------------------------------------------
          ;   Create compiled extensions for applications
          ; -------------------------------------------------------------------------------------

          if_javascript {
            def ppList (appCtx.findPluginsFor("apps"))
            ppList.forEach({
              try {
                def plugin (load_compiler_plugin item)
                call_plugin plugin "apps" root appCtx (unwrap wr)
              } {
              }
            })
          }


          if( has params.flags "services" ) {
            lcc.langWriter.CreateServices(flowParser appCtx (unwrap wr)))
          }
          if( has params.flags "pages" ) {
            lcc.langWriter.CreatePages(flowParser appCtx (unwrap wr)))
          }

          ; -------------------------------------------------------------------------------------
          ; -------------------------------------------------------------------------------------
          

          for appCtx.definedClassList cName:string i {
            if(has handledClasses cName) {
              continue
            }
            if (cName == "RangerStaticMethods") {
              staticMethods = (get appCtx.definedClasses cName)
              continue _
            }
            def cl:RangerAppClassDesc (get appCtx.definedClasses cName)
            if(cl.is_operator_class) {
              continue 
            }
            if(cl.is_generic_instance) {
              lcc.WalkNode( (unwrap cl.classNode ) appCtx (unwrap wr))
            }
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

;          def fileSystem2:CodeFileSystem (new CodeFileSystem())
;          def file2:CodeFile (fileSystem2.getFile("." the_target))
;          def write1 (unwrap (file2.getWriter()) )

          for appCtx.definedClassList cName:string i {
            def cl:RangerAppClassDesc (get appCtx.definedClasses cName)
            if(cl.is_operator_class) {
              lcc.WalkNode( (unwrap cl.classNode ) appCtx (unwrap wr))
            }
          }

;          for appCtx.definedClassList cName:string i {
;            def cl:RangerAppClassDesc (get appCtx.definedClasses cName)
;            if(cl.is_operator_class) {
;              lcc.WalkNode( (unwrap cl.classNode ) appCtx (unwrap wr))
;            }
;          }

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
                def parts (strsplit codeStr ".")
                if( (array_length parts) > 1) {
                  importFork.out (("import  { " + (itemAt parts 1) + " } from  '" + (itemAt parts 0) + "';") , true)
                }
              }
              case "go" {
                if ( (charAt codeStr 0) == (to_int (charcode "_") ) ) {
                  importFork.out (( ' _ \"' + (substring codeStr 1 (strlen codeStr)) + "\"") , true)
                } {
                  importFork.out (('\"' + codeStr + '\"') , true)
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
                importFork.out (( '#include  ' + codeStr ) , true)
              }
              default {
                importFork.out (('import '  + codeStr ) , true)
              }
            }        
          }				
          if(appCtx.targetLangName == "go") {
            importFork.indent(-1)
            importFork.out(')' true)
          }
          if( appCtx.hasCompilerSetting('classdoc') ) {
            def gen (new RangerDocGenerator)
            gen.createClassDoc( root appCtx (unwrap wr) )
          }
          if( appCtx.hasCompilerSetting('operatordoc') ) {
            def gen (new RangerDocGenerator)
            gen.createOperatorDoc( root appCtx (unwrap wr) )
          }
        }
        if_javascript {
          def ppList (appCtx.findPluginsFor('postprocess'))
          ppList.forEach({
            try {
              def plugin (load_compiler_plugin item)
              call_plugin plugin "postprocess" root appCtx (unwrap wr)
            } {
            }
          })
        }
        fileSystem.saveTo(the_target_dir (appCtx.hasCompilerFlag("show-writes")))
        print "Ready."
        CompilerInterface.displayCompilerErrors(appCtx)
        ; CompilerInterface.displayParserErrors(appCtx)

      }{
        print (error_msg)
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
