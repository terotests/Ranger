(
    (Import "RangerCommonWriter.clj")
    ; TODO: think about creating a common writer class which has the methods
    ; implemented at the top level: most of the methods are very similar in different languages
    ; and there is almost no need at all to re-implement them, for example +, * etc. are similar in
    ; most commonly used languages

    ( CreateClass RangerJavaScriptWriter 
        (
            (Extends (RangerCommonWriter))

            ; just a test function to test inheritance
            (PublicMethod getWriterLang:string ()
                (
                    (return "JavaScript")
                )
            )       

            (PublicMethod cmdArgv:void (node:CodeNode ctx:RangerContext wr:CodeWriter)
                (

                    (def argIndex:CodeNode (call node getSecond ()))
                
                    (call wr out ( "process.argv[ 2 + process.execArgv.length + " false))
                    (call ctx setInExpr ())
                    (call this WalkNode (argIndex ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out ( "]" false))                    
                )
            )              


            (PublicMethod cmdArgvCnt:void (node:CodeNode ctx:RangerContext wr:CodeWriter)
                (
                    (call wr out ( "( process.argv.length - ( 2 + process.execArgv.length ) )" false))
                )
            ) 

            (PublicMethod cmdFileRead:void (node:CodeNode ctx:RangerContext wr:CodeWriter)
                (

                    (def pathName:CodeNode (call node getSecond ()))
                    (def fileName:CodeNode (call node getThird ()))
                    ; 
                    (call wr out ( (+ "require(" (strfromcode 34) "fs" (strfromcode 34) ").readFileSync( __dirname + " ) false))
                    (call wr out ( (+ (strfromcode 34) "/" (strfromcode 34) " + " )  false))

                    (call ctx setInExpr ())
                    (call this WalkNode (pathName ctx wr))

                    (call wr out ( (+ " + " (strfromcode 34) "/" (strfromcode 34) " + " )  false))
                    (call this WalkNode (fileName ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out ( (+ ", " (strfromcode 34) "utf8" (strfromcode 34) ")" )  false))                   
                )
            )  

            (PublicMethod cmdFileWrite:void (node:CodeNode ctx:RangerContext wr:CodeWriter)
                (

                    (def pathName:CodeNode (call node getSecond ()))
                    (def fileName:CodeNode (call node getThird ()))
                    (def dataToWrite:CodeNode (itemAt node.children (3)))

                    (call wr newline ()) 
                    
                    (call wr out ( (+ "require(" (strfromcode 34) "fs" (strfromcode 34) ").writeFileSync( __dirname + " ) false))
                    (call wr out ( (+ (strfromcode 34) "/" (strfromcode 34) " + " )  false))

                    (call ctx setInExpr ())
                    (call this WalkNode (pathName ctx wr))

                    (call wr out ( (+ " + " (strfromcode 34) "/" (strfromcode 34) " + " )  false))
                    (call this WalkNode (fileName ctx wr))
                    
                    (call wr out ( ", "  false))       

                    (call this WalkNode (dataToWrite ctx wr))   

                    (call wr out ( ");"  true))                                              

                    (call ctx unsetInExpr ())            
                )
            )  

            (PublicMethod cmdIsFile:void (node:CodeNode ctx:RangerContext wr:CodeWriter)
                (
                    (def pathName:CodeNode (call node getSecond ()))
                    (def fileName:CodeNode (call node getThird ()))
                    ; 
                    (call wr out ( (+ "require(" (strfromcode 34) "fs" (strfromcode 34) ").existsSync( __dirname + " ) false))
                    (call wr out ( (+ (strfromcode 34) "/" (strfromcode 34) " + " )  false))

                    (call ctx setInExpr ())
                    (call this WalkNode (pathName ctx wr))
                    (call wr out ( (+ " + " (strfromcode 34) "/" (strfromcode 34) " + " )  false))
                    (call this WalkNode (fileName ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out ( ")"  false))  
                )
            )
            (PublicMethod cmdIsDir:void (node:CodeNode ctx:RangerContext wr:CodeWriter)
                (
                    (def pathName:CodeNode (call node getSecond ()))
                    ; 
                    (call wr out ( (+ "require(" (strfromcode 34) "fs" (strfromcode 34) ").existsSync( __dirname + " ) false))
                    (call wr out ( (+ (strfromcode 34) "/" (strfromcode 34) " + " )  false))
                    (call ctx setInExpr ())
                    (call this WalkNode (pathName ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out ( ")"  false))  
                )
            )

            
            (PublicMethod cmdCreateDir:void (node:CodeNode ctx:RangerContext wr:CodeWriter)
                (
                    ; mkdirSync


                    (def pathName:CodeNode (call node getSecond ()))
                    (call wr newline ()) 
                    
                    (call wr out ( (+ "require(" (strfromcode 34) "fs" (strfromcode 34) ").mkdirSync( __dirname + " ) false))
                    (call wr out ( (+ (strfromcode 34) "/" (strfromcode 34) " + " )  false))

                    (call ctx setInExpr ())
                    (call this WalkNode (pathName ctx wr))

                    (call wr out ( ");"  true))                                              

                    (call ctx unsetInExpr ())                     
                )
            )                

            (PublicMethod PublicMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def nameDef:CodeNode (call node getSecond ()))
                    (call wr newline ())
                    (call wr out ( (+ nameDef.vref "(") false ) )

                    ; parameters
                    (def args:CodeNode (call node getThird ()))

                    (for args.children arg:CodeNode i
                        (
                            (if (> i 0)
                                (call wr out (", " false))
                            )
                            (call wr out (arg.vref false))
                        )
                    )
                    
                    (call wr out ( ") { " true ) )

                    (call ctx setInMethod ())
                    (call wr indent (1))
                    (def fnBody:CodeNode (itemAt node.children 3))
                    (call this WalkNodeChildren (fnBody ctx wr))
                    (call wr newline ())
                    (call wr indent (-1))
                    (call ctx unsetInMethod ())

                    (call wr out ( (+ "}") true ) )
                )
            )

            (PublicMethod CreateClass:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def nameDef:CodeNode (call node getSecond ()))
                    (def classInfo:RangerAppClassDesc (call ctx findClass (nameDef.vref)))

                    (call wr newline ())
                    (call wr out ( (+ "class " nameDef.vref " " ) false ) )

                    (def b_extended:boolean false)

                    (if (> (array_length classInfo.extends_classes) 0)
                        (
                            (call wr out (" extends " false))                    
                            (= b_extended true)        
                            (for classInfo.extends_classes pName:string i
                                (
                                    (if (> i 0)
                                        (call wr out ("," false))
                                    )
                                    (call wr out (pName false))
                                )
                            )
                        )
                    )

                    (call wr out ( " {" true ) )

                        (call wr indent (1))


                        ; create constructor writer
                        (call wr out ("" true))
                        (def cw:CodeWriter (call wr createTag ("constructor")))

                        (call cw out ("constructor(" false))

                        (if classInfo.has_constructor
                            (
                                ; (call cw out ("<cparams>" false))
                                (def constr:CodeNode classInfo.constructor_node)
                                (def cParams:CodeNode (call constr getSecond ()))
                                (for cParams.children param:CodeNode i
                                    (
                                        (if (> i 0)
                                            (call cw out (", " false))
                                        )
                                        (call cw out (param.vref false))
                                    )
                                )
                            )
                        )

                        ; for example
                        ; (Constructor (filePath:string fileName:string)


                        (call cw out (") {" true))
                        (call cw indent (1))

                        (if b_extended
                            (call cw out ("super()" true))
                        )

                        ; the class information...

                        (def fnBody:CodeNode (itemAt node.children 2))
                        (call this WalkNodeChildren (fnBody ctx wr))
                        
                        ; (call this WalkNodeChildren (node ctx wr))

                        ; after children have been written finalize the constructor
                        (call cw indent (-1))
                        (call cw out ("}" true))

                        (call wr indent (-1))
                    (call wr out ( (+ "}") true ) )
                )
            )            

            ; perhaps the params should be different to support for example constructor and
            ; desctuctor variables and others

            (PublicMethod DefineVar:void (node:CodeNode ctx:RangerContext wr:CodeWriter)
                (
                    ; (call wr out ("// var definition" true))

                    ; (call ctx setInMethod ())
                    (if (call ctx isInMethod ())
                        (
                            ; method variable declaration
                            (def v:CodeNode (call node getSecond ()))
                            (call wr out ( (+ "var " v.vref) false ))

                            (if (> (array_length node.children) 2)
                                (
                                    (call wr out ( " = " false))
                                    (call ctx setInExpr ())
                                    (call this WalkNode ((call node getThird ()) ctx wr))
                                    (call ctx unsetInExpr ())
                                )
                                (
                                    (switch v.value_type
                                        (case RangerNodeType.Hash 
                                            (call wr out ( " = {}" false))
                                        )
                                        (case RangerNodeType.Array 
                                            (call wr out ( " = []" false))
                                        )
                                        (default
                                            (call wr out ( "" false))
                                        )
                                    )
                                    
                                )                                
                                ; (call this)
                            )

                            (call wr out ( ";" true))

                        )
                        (
                            (def cw:CodeWriter (call wr getTag ("constructor")))
                            (def v:CodeNode (call node getSecond ()))
                            (call cw out ( (+ "this." v.vref) false ))

                            (if (> (array_length node.children) 2)
                                (
                                    (call cw out ( " = " false))
                                    (call ctx setInExpr ())
                                    ; (print "walking the class var init...")
                                    (call this WalkNode ((call node getThird ()) ctx cw))
                                    (call ctx unsetInExpr ())
                                )
                                (
                                    (switch v.value_type
                                        (case RangerNodeType.Hash 
                                            (call cw out ( " = {}" false))
                                        )
                                        (case RangerNodeType.Array 
                                            (call cw out ( " = []" false))
                                        )
                                        (default
                                            (call cw out ( " = undefined" false))
                                        )
                                    )
                                    
                                )
                            )

                            (call cw out ( ";" true))                            
                        )
                    )


                    ; Question: how to add callback to the constructor from the method ? 
                    ; TODO: writing to the future constructor function ??
                    
                )
            )

            (PublicMethod DefineMethod:void (node:CodeNode ctx:RangerContext wr:CodeWriter)
                (
                    (def s:string (call node getVRefAt (1)))
                    (call wr out ("// DefineMethod" true))
                    (call wr out (( + s "() {") true) )
                        (call wr indent(1))
                        (call wr out ("// the code..." true))
                        (call wr indent(-1))
                    (call wr out ("}" true))                    
                )
            )



        )
    )
    
)