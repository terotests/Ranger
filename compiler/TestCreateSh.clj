(

; creating like this:
; node tooltest.js TestCodeCompiler.clj TestCodeCompiler compile tools\ranger-compiler ranger-compiler 5

    ; metadata, this code could be written after JS code has been written
    @JavaScript("    
// for JS code only    
(new TestCreateSh()).run();")

    ; could be also (native @JavaScript())
    ; --> or something like that.

    (Import "writer.clj")
    (Import "parser.clj")
    (Import "jsonParser.clj")
	(Import "RangerCommonWriter.clj")
	(Import "RangerJavaScriptWriter.clj")

    ( CreateClass TestCreateSh
        (

            (def read_filename:string "" )
            (def call_class:string "" )
            (def call_method:string "" )
            (def tool_dir:string "" )
            (def tool_name:string "" )
            (def version:string "" )
            (def arg_cnt:int 0)

            (def fnDescription:RangerAppFunctionDesc)

            ( PublicMethod codeStringToJs:void (str:string wr:CodeWriter)
                (
                    (def code:SourceCode (new SourceCode (str)))
                    (def parser:RangerLispParser (new RangerLispParser (code)))
                    (call parser parse ())

                    (def appCtx:RangerAppWriterContext (new RangerAppWriterContext()))
                    (def cwr:RangerJavaScriptWriter (new RangerJavaScriptWriter ()))
                    (def node:CodeNode parser.rootNode)
                    (call cwr CollectMethods (node appCtx wr))
                    (call cwr StartCodeWriting (node appCtx wr))
                    
                )
            )

            ( PublicMethod writeJavascriptCmdTool:void (wr:CodeWriter info:CodeNode)
                (

                    ; fnDescription
                    (def usageWr:CodeWriter (new CodeWriter ()))
                    (for fnDescription.params v:RangerAppParamDesc i
                        (
                            (call usageWr out ( (+ "<" v.name ">" ) true))
                        )
                    )
                    (def callWr:CodeWriter (new CodeWriter ()))
                    (def ii:int 0)
                    (call callWr out ((+ "(def obj:" call_class " (new " call_class "()) )") true))
                    (call callWr out ((+ "(call obj " call_method " (" ) false ) )
                    (while (< ii arg_cnt)
                        (
                            (call callWr out ( (+ "(shell_arg " ii ") ") false ) )
                            (= ii (+ ii 1))
                        )
                    )
                    (call callWr out (")" true ) )
                    
                    (def rWr:CodeWriter (new CodeWriter ()))

                    (call rWr out ((+ "
(                    
    (CreateClass ShellScriptToolMain" call_class "
        (
            (PublicMethod run:void ()
                (
                    (def argCnt:int (shell_arg_cnt _))
                    (if ( < argCnt " arg_cnt ")
                        (
                            (print \"" (call info getStringProperty ("description")) " " (call info getStringProperty ("version")) " \")
                            (print \"Usage:\")
                            (print (+ \"" (call info getStringProperty ("name")) " " (call usageWr getCode ())  " \"))
                            (return _)
                        )
                    )
                    " (call callWr getCode ()) "
                )
            )
        )
    )                    
)
                    ") false))

                    (call this codeStringToJs ((call rWr getCode ()) wr))

                    ; what needs to be done here:
                    ; - check if the parameters are valid
                    ; - perhaps named paramter list
                    ; - information about the parameters, maybe instructions
                    ; - the information could be located at the function which has annotation about the cmd lineness
                    ; - if params ok, convert them to native reprsentation
                    ; ==> strings should be converted into bool, int, string, double etc.
                    ; - after fn args are valid, then create the class and call the method with the args

                    ; brutally write JS code to generate command line tool argument processing etc.
                    ; fot this particular file...
                    (call wr out ((+ "
// start the cmd line tool
(new ShellScriptToolMain" call_class "()).run();
                    ") true))
                )
            )
            ( PublicMethod createPackageJSON:string (info:CodeNode)
                (
                    ;; createEmptyObject
                    (def jsp:JSONParser (new JSONParser ( (new SourceCode ("{}"))))) 
                    (def n:DictNode (call jsp parse ()))
                    
                    ; --

                    (call n addString ("name" (call info getStringProperty ("name"))))
                    (call n addString ("version" (call info getStringProperty ("version"))))
                    (call n addString ("description" (call info getStringProperty ("description"))))
                    (call n addString ("main" "index.js"))
                    (call n addObject ("scripts"))
                    (def binNode:DictNode (call n addObject ("bin")))
                    (call binNode addString ((call info getStringProperty ("name")) "./index.js"))
                    (call n addString ("author" (call info getStringProperty ("author"))))
                    (call n addString ("license" (call info getStringProperty ("license"))))
            
                    (return (call n stringify()) )

                )           
            )
            ( PublicMethod run:void () 
                (
                    ; project_file6.json


                    ; file
                    ; class
                    ; function ...
                    (if ( == (shell_arg_cnt _) 3 )
                        (
                            (= read_filename (shell_arg 0))
                            (= call_class (shell_arg 1))
                            (= call_method (shell_arg 2))
                        )
                        (
                            (print "args: <file> <class> <method> ")
                            (return _)
                        )
                    )

                    ; C, Golang, Swift, Java, JavaScript -> 

                    (def c:string (file_read "." read_filename))                          
                    (def code:SourceCode (new SourceCode (c)))
                    (def parser:RangerLispParser (new RangerLispParser (code)))
                    (call parser parse ())

                    (print (+ "Directory " tool_dir))
                    ; create the index.js for the node.js command tool
                    (def fileSystem:CodeFileSystem (new CodeFileSystem ()))

                    (def cf:CodeFile (call fileSystem getFile ("." "index.js")) )
                    (def code_wr:CodeWriter (call cf getWriter ()))

                    (call code_wr out ("#!/usr/bin/env node" true))
                    
                    ; (call code_wr out ("console.log(\"Hello World!\");" true))   

                    (def appCtx:RangerAppWriterContext (new RangerAppWriterContext()))
                    (def cwr:RangerJavaScriptWriter (new RangerJavaScriptWriter ()))
                    (def node:CodeNode parser.rootNode)
                    (call cwr CollectMethods (node appCtx code_wr))
                    (call cwr StartCodeWriting (node appCtx code_wr))



                    ;(if (== false (file_exists tool_dir "package.json"))
                    ;    (
                    ;    )
                    ;)
                    

                    ; then create the cmdline arguments processing for the selected class + method
                    ; ? should you create only node.js compatible cmdline tools ??
                    (if (call appCtx isDefinedClass (call_class))
                        (
                            (print (+ "Found " call_class "!"))
                            (def cDesc:RangerAppClassDesc (call appCtx findClass (call_class)))
                            (if (call cDesc hasMethod (call_method))
                                (
                                    (print (+ "Class had method " call_method "!"))
                                    ; (PublicMethod findMethod:RangerAppFunctionDesc (f_name:string)
                                    (def m:RangerAppFunctionDesc (call cDesc findMethod (call_method)))
                                    (= fnDescription m)

;                @shellUtility(
;                    @name("ranger-compiler")
;                ) 
                                    (def fnNode:CodeNode m.node)
                                    (if (!null? fnNode)
                                        (
                                            (if (call fnNode hasExpressionProperty ("shellUtility"))
                                                (
                                                    (print "Found the utility info!!!!")
                                                    (def info:CodeNode (call fnNode getExpressionProperty ("shellUtility")))
                                                    (def util_name:string (call info getStringProperty ("name")))
                                                    (print (+ "name => " util_name))
                                                    (print (+ "dir => " (call info getStringProperty ("directory"))))

                                                    (= tool_dir (call info getStringProperty ("directory")))

                                                    (def packageFile:CodeFile (call fileSystem getFile ("." "package.json")) )
                                                    (def package_wr:CodeWriter (call packageFile getWriter ()))
                                                    (call package_wr out ( (createPackageJSON info) false ))

                                                    (for m.params v:RangerAppParamDesc i
                                                        (
                                                            (print (+ "--> variable " v.name))
                                                            (= arg_cnt (+ arg_cnt 1))
                                                        )
                                                    )

                                                    (writeJavascriptCmdTool code_wr info)                                                                        
                                                    
                                                )
                                                (
                                                    (return _)
                                                )
                                            )
                                        )
                                    )

                                    (call fileSystem saveTo (tool_dir))

                                )
                                (
                                    (print (+ "had no method " call_method " :("))
                                )
                            )
                        )
                        (
                            (print (+ "Class " call_class " not found"))
                        )
                    )
                    (return _)
                )
            )            
        )            
    )  
)
