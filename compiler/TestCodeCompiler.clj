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
            ; example of code which can be transformed into a cmd line tool
            ( PublicMethod compile:void (fileName:string)

                ; the utility information for package.json
                @shellUtility(
                    @name("ranger-compiler")
                    @directory("tools/ranger-compiler")
                    @description("Ranger command-line compiler utility")
                    @author("Tero Tolonen")
                    @license("MIT")
                    @version("1.0.13")
                ) 

                (

                    @onError(
                        (print "Unknown compiler error.")
                    )

                    (if (file_exists "." fileName)
                        ()
                        (
                            (print "File does not exists!")
                            (return _)
                        )
                    )

                    (def c:string (file_read "." fileName))
                    
                    (def code:SourceCode (new SourceCode (c)))
                    (= code.filename fileName)

                    (def parser:RangerLispParser (new RangerLispParser (code)))
                    (call parser parse ())

                    (if parser.had_error
                        (
                            (return _)
                        )
                    )


                    (def appCtx:RangerAppWriterContext (new RangerAppWriterContext()))
                    (def cwr:RangerES5Writer (new RangerES5Writer ()))
                    (def node:CodeNode parser.rootNode)
                    (def wr:CodeWriter (new CodeWriter ()))

                    (call cwr CollectMethods (node appCtx wr))
                    (call cwr StartCodeWriting (node appCtx wr))

                    (def had_errors:boolean false)
                    (if (== (array_length appCtx.compilerErrors) 0)
                        (
                            ; (print "No compiler errors or warnings")
                            (call wr newline ())

                            (if ( > (shell_arg_cnt _) 0 )
                                (

                                )
                                (
                                    (call wr out ("(new TestCodeCompiler()).test1()" false))
                                )
                            )
                            (print (call wr getCode ()))                       
                        )
                        (
                            (= had_errors true)
                            (print "Had following compiler errors:")
                            (for appCtx.compilerErrors e:RangerCompilerError i 
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

                (if ( > (shell_arg_cnt _) 0 )
                    (= read_filename (shell_arg 0))
                )

                (compile read_filename)

            ))            
                              
        )
    )
    
)