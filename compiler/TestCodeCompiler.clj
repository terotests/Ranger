(

    (Import "CompilerGeneric.clj")
    (Import "writer.clj")
    (Import "parser.clj")

    (Import "RangerCommonWriter.clj")
    (Import "RangerJavaScriptWriter.clj")
    (Import "RangerES5Writer.clj")

    ; node tooltest.js TestCodeCompiler.clj TestCodeCompiler compile tools/compile ranger-compile 1
    ; There could be annotations to allow compiling shell scripts out from the file
    
    ( CreateClass TestCodeCompiler 
        (
            (def appCtx:RangerAppWriterContext)

            ( PublicMethod display_errors:void ()
                (
                    (if (null? appCtx) (return _))

                    (if (> (array_length appCtx.compilerErrors) 0)
                        (
                            (print "Had following compiler errors:")
                            (for appCtx.compilerErrors e:RangerCompilerMessage i 
                                (
                                    (def line_index:int (call e.node getLine ()))                                
                                    (print (+ (call e.node getFilename ()) " Line: " line_index))
                                    (print e.description)
                                    (print (call e.node getLineString(line_index)))
                                )
                            )                    
                        )
                    )                    
                )            
            )

            ( PublicMethod display_todolist:void ()
                (
                    (if (null? appCtx) (return _))

                    (if (> (array_length appCtx.todoList) 0)
                        (
                            (print "--------------------------------------------------------------------")
                            (print "TODO-list:")
                            (for appCtx.todoList e:RangerAppTodo i 
                                (
                                    (def line_index:int (call e.node getLine ()))                                
                                    (print (+ (call e.node getFilename ()) " Line: " line_index))
                                    (print e.description)
                                )
                            )                    
                        )
                    )                    
                )            
            )
            

            ; example of code which can be transformed into a cmd line tool
            ( PublicMethod compile:void (inputFileName:string outputFileName:string logMessageGroup:string)

                ; the utility information for package.json
                @shellUtility(
                    @name("ranger-compiler")
                    @directory("tools/ranger-compiler")
                    @description("Ranger command-line compiler utility")
                    @author("Tero Tolonen")
                    @license("MIT")
                    @version("1.0.16")
                ) 

                (

                    @onError(
                        (print "Unknown compiler error.")
                        (display_errors _)
                    )

                    (if (file_exists "." inputFileName)
                        ()
                        (
                            (print "File does not exists!")
                            (return _)
                        )
                    )

                    (def c:string (file_read "." inputFileName))
                    
                    (def code:SourceCode (new SourceCode (c)))
                    (= code.filename inputFileName)

                    (def parser:RangerLispParser (new RangerLispParser (code)))
                    (call parser parse ())

                    (if parser.had_error
                        (
                            (return _)
                        )
                    )


                    (= appCtx (new RangerAppWriterContext()))

                    (if ( > (strlen logMessageGroup) 0)
                        (
                            (set appCtx.compilerSettings "log_group" logMessageGroup  )
                        )
                    )

                    (def cwr:RangerES5Writer (new RangerES5Writer ()))
                    (def node:CodeNode parser.rootNode)
                    (def wr:CodeWriter (new CodeWriter ()))

                    (call cwr CollectMethods (node appCtx wr))
                    (call cwr StartCodeWriting (node appCtx wr))


                    (if ( > (strlen logMessageGroup) 0)
                        (
                            (call appCtx printLogs (logMessageGroup))
                        )
                    )


                    (def had_errors:boolean false)
                    (if (== (array_length appCtx.compilerErrors) 0)
                        (
                            ; (print "No compiler errors or warnings")
                            (call wr newline ())

                            (if ( > (shell_arg_cnt _) 1 )
                                (

                                )
                                (
                                    (call wr out ("(new TestCodeCompiler()).test1()" false))
                                )
                            )

                            ; (def c:string (file_read "." inputFileName))

                            (file_write "." outputFileName (call wr getCode ()))
                            (print "Compiled succesfully!")
                            (display_todolist _)
                        )
                        (
                            (= had_errors true)
                            (print "Had following compiler errors:")
                            (for appCtx.compilerErrors e:RangerCompilerMessage i 
                                (
                                    (def line_index:int (call e.node getLine ()))                                
                                    (print (+ (call e.node getFilename ()) " Line: " line_index))
                                    (print e.description)
                                    (print (call e.node getLineString(line_index)))
                                )
                            )                    
                        )
                    )

                )
            )
            
            ( PublicMethod test1:void () 
                (

                ; annotation when error occurs
                @onError(
                    (print "Compilation error occurred !!")
                )

                (def read_filename:string "./TestCodeCompiler.clj" )

                (if ( > (shell_arg_cnt _) 1 )
                    (= read_filename (shell_arg 0) (shell_arg 1) "" )
                )

                (compile read_filename "compiler3.js" "memory4" )

            ))            
                              
        )
    )
    
)