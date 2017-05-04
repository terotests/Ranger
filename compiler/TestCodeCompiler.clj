(
    (Import "writer.clj")
    (Import "parser.clj")

	(Import "RangerCommonWriter.clj")
	(Import "RangerJavaScriptWriter.clj")

    ; node tooltest.js TestCodeCompiler.clj TestCodeCompiler compile tools/compile ranger-compile 1
    ; There could be annotations to allow compiling shell scripts out from the file
    
    ( CreateClass TestCodeCompiler 
        (
            ; example of code which can be transformed into a cmd line tool
            ( PublicMethod compile:void (fileName:string)

                ; the utility information for package.json
                @shellUtility(
                    @name("ranger-compiler")
                    @directory("tools\\ranger-compiler")
                    @description("Ranger command-line compiler utility")
                    @author("Tero Tolonen")
                    @license("MIT")
                    @version("1.0.7")
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
                    (def cwr:RangerJavaScriptWriter (new RangerJavaScriptWriter ()))
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
                                    (call wr out ("(new TestCodeCompiler()).test1()"))
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

                ; should evaluate the fileName
                ; external dependencies could be marked

                (def read_filename:string "./TestCodeCompiler.clj" )

                (if ( > (shell_arg_cnt _) 0 )
                    (= read_filename (shell_arg 0))
                )

				(def c:string (file_read "." read_filename))

				(def code:SourceCode (new SourceCode (c)))
                (= code.filename read_filename)
				(def parser:RangerLispParser (new RangerLispParser (code)))
				(call parser parse ())

                (if parser.had_error
                    (
                        (return _)
                    )
                )

				; --> parsing the file and dependencies

                (def appCtx:RangerAppWriterContext (new RangerAppWriterContext()))

                ; test using the JS writer
				(def cwr:RangerJavaScriptWriter (new RangerJavaScriptWriter ()))

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
                                (call wr out ("(new TestCodeCompiler()).test1()"))
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

                ;(print "classes")
                ;(for appCtx.definedClassList name:string ii
                ;    (
                ;        (print name)
                ;        (def cc:RangerAppClassDesc (call appCtx findClass (name)))
                ;        (for cc.variables vv:RangerAppParamDesc i2
                ;            (print (+ "def " vv.name))
                ;        )
                ;        (for cc.methods mm:RangerAppParamDesc i2
                ;            (print (+ "method::" mm.name))
                ;        )
                ;
                ;    )
                ;)



            ))            
                    
            ( PublicMethod run:void () 
                (
                ; should evaluate the fileName
                ; external dependencies could be marked

                (def fileSystem:CodeFileSystem (new CodeFileSystem ()))
                ; 

                (print (shell_arg 0))

				(def c:string (file_read "." "./TestFS.clj"))
				(def code:SourceCode (new SourceCode (c)))
				(def parser:RangerLispParser (new RangerLispParser (code)))
				(call parser parse ())

				; --> parsing the file and dependencies

                (def appCtx:RangerAppWriterContext (new RangerAppWriterContext()))

                ; test using the JS writer
				(def cwr:RangerJavaScriptWriter (new RangerJavaScriptWriter ()))

				(def node:CodeNode parser.rootNode)

                (def cf:CodeFile (call fileSystem getFile ("ranger/test1" "fstest.js")) )
                (def wr:CodeWriter (call cf getWriter ()))

				; (def wr:CodeWriter (new CodeWriter ()))

				(call cwr CollectMethods (node appCtx wr))
                (call cwr StartCodeWriting (node appCtx wr))

                ; (call ww out ( (call wr getCode ()) false ))

                (call fileSystem saveTo ("output"))

                ;(print "classes")
                ;(for appCtx.definedClassList name:string ii
                ;    (
                ;        (print name)
                ;        (def cc:RangerAppClassDesc (call appCtx findClass (name)))
                ;        (for cc.variables vv:RangerAppParamDesc i2
                ;            (print (+ "def " vv.name))
                ;        )
                ;        (for cc.methods mm:RangerAppParamDesc i2
                ;            (print (+ "method::" mm.name))
                ;        )
                ;
                ;    )
                ;)

                ; (print (call wr getCode ()))
                

            ))            
        )
    )
    
)