(
    

(gitdoc "README.md"

"
# Ranger kääntäjän dokumentaatio

Yleisesti huomioitavaa: 
- kääntäjä on vielä työn alla ja jotkut ominaisuudet eivät vielä toimi tai toimivat vain osin
- sama koskee myös dokumentaatiota, kaikkia osia ei ole dokumentoitu tai dokumentoitu vain osin

## Kääntäjän asentaminen

```
 npm install -g ranger-compiler
```

## Hello World

Create file `Hello.ran`
```
(
    (gitdoc \"README.md\"
\"
# The Hello World -project
\"    
    )
    (CreateClass Hello
        (
            (PublicMethod hello:void ()
                (
                    (print \"Hello World\")
                )
            )
        )
    )
)
```
Then compile it using `ranger-compiler` using command line

```
ranger-compiler Hello.ran es5 projectdir/hello none
```

Then go to directory `projectdir/hello` and see the compiled result




"
)
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
                        )(
                            (print "TODO-list: <empty>")
                        )
                    )                    
                )            
            )
            
            ; example of code which can be transformed into a cmd line tool
            ( PublicMethod compile:void (inputFileName:string language:string outputDirectory:string logMessageGroup:string)

                ; the utility information for package.json
                @shellUtility(
                    @name("ranger-compiler")
                    @directory("tools/ranger-compiler")
                    @description("Ranger command-line compiler utility")
                    @author("Tero Tolonen")
                    @license("MIT")
                    @version("1.0.24")
                    @usage("languages: js-browser")
                ) 
                (


                    @onError(
                        (print "Unknown compiler error.")
                        (display_errors _)
                    )

                    (def path_parts:[string] (strsplit inputFileName "/"))
                    (def input_file:string (itemAt path_parts (- (array_length path_parts) 1)))
                    (def suffix_parts:[string] (strsplit input_file "."))
                    (def base_name:string (itemAt suffix_parts 0))

                    @todo("set output file name based on the output language")


                    (def outputFileName (+ base_name ".js"))
                    
                    ; is_file ?
                    (if (== false (file_exists "." inputFileName))
                        (
                            (print (+ "File " inputFileName " was not found!"))
                            (return _)
                        )
                    )

                    ; 
                    ; (readfile )                
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

                    (def cwr:RangerCommonWriter (new RangerES5Writer ()))

                    (switch language
                        (case "es5"
                            (= cwr (new RangerES5Writer ()))
                        )
                        (case "es6"
                            (= cwr (new RangerJavaScriptWriter ()))
                        )                        
                        (default
                            (
                                (print (+ "unknown language option " language))
                                (print ("available options are: es5 es6"))
                                (return _)
                            )
                        )
                    )


                    (def node:CodeNode parser.rootNode)

                    ; create directory...
                    (def fs:CodeFileSystem appCtx.fileSystem)
                    (def file:CodeFile (call fs getFile("." outputFileName )))

                    (def wr:CodeWriter (call file getWriter ()))

                    (call cwr CollectMethods (node appCtx wr))
                    (call cwr StartCodeWriting (node appCtx wr))

                    (if ( > (strlen logMessageGroup) 0)
                        (
                            (call appCtx printLogs (logMessageGroup))
                        )
                    )


                    (def had_errors:boolean false)
                    (if (== (array_length appCtx.compilerErrors) 0 )
                        (
                            ; (print "No compiler errors or warnings")
                            (call wr newline ())

                            (if ( == outputFileName "Compiler.js" )
                                (
                                    (call wr out ("(new TestCodeCompiler()).test1()" false))
                                )
                            )

                            (print (+ " out => " outputFileName))

                            ; (def c:string (file_read "." inputFileName))
                            ; (file_write "." outputFileName (call wr getCode ()))

                            (call fs saveTo (outputDirectory))

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

                (def read_filename:string "Compiler.clj" )

                (if ( == (shell_arg_cnt _) 4 )
                    (
                      (compile (shell_arg 0) (shell_arg 1) (shell_arg 2) (shell_arg 3) )
                      (return _)
                    )
                )
                (print "Usage: <input> <directory> <logtype>")
                (print (+ "% 5 2 => " (% 5 2)))
                ; (compile read_filename "ranger_output" "memory4" )

            ))            
                              
        )
    )
    
)