(

    (Import "RangerAppEnums.clj")    
    (Import "RangerAppFunctionDesc.clj")    
    (Import "RangerAppMessages.clj")    
    (Import "RangerAppParamDesc.clj")
    (Import "RangerAppClassDesc.clj")

    ; RangerNodeValue could be used for default values
    ( CreateClass RangerNodeValue
        (
            (def double_value:double)
            (def string_value:string)
            (def int_value:int)
            (def boolean_value:boolean)
            (def expression_value:CodeNode @weak(true)) 
        )
    )

    ; when class is de-allocated, it can have a weak reference to some class
    ( CreateClass RangerBackReference
        (
            (def from_class:string) ; Context
            (def var_name:string)   ; parent  <- must set this to NULL or remove the item from it
            (def ref_type:string)   ; Object  <- type of the reference
        )
    )


    ( CreateClass RangerAppEnum
        (
            (def name:string "")
            (def cnt:int 0)
            (def values:[string:int])
            (def node:CodeNode)

            (PublicMethod add:void (n:string)
                (
                    (set values n cnt)
                    (= cnt (+ cnt 1))
                )
            )
        )
    )
    


    ( CreateClass RangerAppWriterContext
        (

            (def ctx:RangerContext)
            (def parent:RangerAppWriterContext @weak(true))

            (def defined_imports:[string])
            (def already_imported:[string:boolean])
            
            (def fileSystem:CodeFileSystem)

            ; block control variables
            (def is_function:boolean false)
            (def is_block:boolean false)
            (def has_block_exited:boolean false)
            ; maybe:
            ; - block exit values
            ; - block start node
            ; - list of child contexts / blocks for
            ; - if the block is looping block


            (def in_expression:boolean false)
            (def expr_stack:[boolean])

            (def in_method:boolean false)
            (def method_stack:[boolean])

            (def currentClassName:string )
            (def currentClass:RangerAppClassDesc)
            (def currentMethod:RangerAppFunctionDesc)

            (def thisName:string "this")
            (def definedEnums:[string:RangerAppEnum])

            (def definedClasses:[string:RangerAppClassDesc])
            (def definedClassList:[string])

            (def templateClassNodes:[string:CodeNode] @weak(true))
            (def templateClassList:[string])
            
            (def classStaticWriters:[string:CodeWriter])

            ; list of local variables
            (def localVariables:[string:RangerAppParamDesc])
            (def localVarNames:[string])

            (def compilerFlags:[string:boolean])
            (def compilerSettings:[string:string])

            (def compilerErrors:[RangerCompilerMessage])
            (def compilerMessages:[RangerCompilerMessage])
            (def compilerLog:[string:RangerCompilerMessage])

            ; to statically analyze the code, metadata about the function is collected
            (def instantiatedObjects:[RangerAppObjectInstance])

            (def instanceVariables:[string:RangerAppObjectInstance])
            (def resignedInstancesVars:[string:RangerAppObjectInstance])

            ; during compile time collect TODO items
            (def todoList:[RangerAppTodo])

            ; if the target language does not support local block variables, then
            ; temporary block variables could be used

            (def defCounts:[string:int])


            (Constructor ()
                (
                    ; initialize the file system here
                    (= fileSystem (new CodeFileSystem ()))
                )
            )


            (PublicMethod getStrongLocals:[RangerAppParamDesc] ()
                (
                    (def list:[RangerAppParamDesc])

                    (for localVarNames n:string i
                        (
                            (def p:RangerAppParamDesc (get localVariables n))
                            (if (== p.refType RangerNodeRefType.Strong)
                                (
                                    (push list p)
                                )
                            )
                        )
                    )

                    (return list)
                )
            )    

            (PublicMethod getFileWriter:CodeWriter (path:string fileName:string)
                (
                    (def root:RangerAppWriterContext (call this getRoot ()))                    
                    (def fs:CodeFileSystem root.fileSystem)
                    (def file:CodeFile (call fs getFile(path fileName )))
                    (def wr:CodeWriter (call file getWriter ()))
                    (return wr)
                )
            )

            ; RangerAppTodo
            (PublicMethod addTodo:void (node:CodeNode descr:string)
                (
                    (def e:RangerAppTodo (new RangerAppTodo ()))
                    (= e.description descr)
                    (= e.node node)

                    (def root:RangerAppWriterContext (call this getRoot ()))
                    (push root.todoList e)
                )
            )    

            (PublicMethod setThisName:void (the_name:string)
                (
                    (def root:RangerAppWriterContext (call this getRoot ()))
                    (= root.thisName the_name)
                )
            )    
            
            (PublicMethod getThisName:string ()
                (
                    (def root:RangerAppWriterContext (call this getRoot ()))
                    (return root.thisName)
                )
            )    

            (PublicMethod printLogs:void (logName:string)
                (
                    (def root:RangerAppWriterContext (getRoot _))                   
                    (print "--------------------------------------------------------------------")
                    (print ( + "log " logName))                    
                    (if (has root.compilerLog logName )
                        (
                            (def logObjs:[RangerCompilerMessage] (get root.compilerLog logName))                            
                            (if (> (array_length logObjs) 0)
                                (
                                    (for logObjs e:RangerCompilerMessage i 
                                        (
                                            (def line_index:int (call e.node getLine ()))                                
                                            (print (+ "[" logName "] "(call e.node getFilename ()) ", Line " line_index ": " e.description))
                                            (print (call e.node getLineAsString ()))
                                        )
                                    )                    
                                )
                                (print "<no entries>")                            
                            )                   
                        )
                        (
                            (print "<no entries>")
                        )
                    ) 
                    
                )
            )

            (PublicMethod log:void (node:CodeNode logName:string descr:string)
                (
                    (def root:RangerAppWriterContext (getRoot _))
                    (def logObjs:[RangerCompilerMessage])
                    (if (== false (has root.compilerLog logName))
                        (
                            (set root.compilerLog logName logObjs)
                        )
                        (
                            (= logObjs (get root.compilerLog logName))
                        )
                    )

                    (def e:RangerCompilerMessage (new RangerCompilerMessage ()))
                    (= e.description descr)
                    (= e.node node)

                    (def root:RangerAppWriterContext (call this getRoot ()))
                    (push logObjs e)
                )
            )    

            (PublicMethod addMessage:void (node:CodeNode descr:string)
                (
                    (def e:RangerCompilerMessage (new RangerCompilerMessage ()))
                    (= e.description descr)
                    (= e.node node)

                    (def root:RangerAppWriterContext (call this getRoot ()))
                    (push root.compilerMessages e)

                )
            )    

            (PublicMethod addError:void (node:CodeNode descr:string)
                (
                    (def e:RangerCompilerMessage (new RangerCompilerMessage ()))
                    (= e.description descr)
                    (= e.node node)

                    (def root:RangerAppWriterContext (call this getRoot ()))
                    (push root.compilerErrors e)

                )
            )           

;            (def templateClassNodes:[string:CodeNode] @weak(true))
;            (def templateClassList:[string])

            (PublicMethod addTemplateClass:void (name:string node:CodeNode)
                (
                    (def root:RangerAppWriterContext (call this getRoot ()))
                    (push root.templateClassList name)
                    (set root.templateClassNodes name node)
                )
            )           

            (PublicMethod hasTemplateNode:boolean (name:string)
                (
                    (def root:RangerAppWriterContext (call this getRoot ()))
                    (return (has root.templateClassNodes name))
                )
            )           

            (PublicMethod findTemplateNode:CodeNode (name:string)
                (
                    (def root:RangerAppWriterContext (call this getRoot ()))                    
                    (return (get root.templateClassNodes name))
                )
            )           


            ;             (def classStaticWriters:[string:CodeWriter])

            (PublicMethod setStaticWriter:void (className:string writer:CodeWriter)
                (
                    (def root:RangerAppWriterContext (call this getRoot ()))
                    (set root.classStaticWriters className writer)
                )
            )           

            (PublicMethod getStaticWriter:CodeWriter (className:string )
                (
                    (def root:RangerAppWriterContext (call this getRoot ()))
                    (return (get root.classStaticWriters className) )
                )
            )           
 





            (PublicMethod isEnumDefined:boolean (n:string)
                (
                    (if (has definedEnums n)
                        (return true)
                    )
                    (if (null? parent)
                        (return false)
                    )
                    (return (call parent isEnumDefined (n)))
                )
            )
            
            (PublicMethod getEnum:RangerAppEnum (n:string)
                (
                    (if (has definedEnums n)
                        (return (get definedEnums n))
                    )
                    ; what if there is no ? 
                    (if (null? parent)
                        (return (new RangerAppEnum ()))
                    )
                    (return (call parent getEnum (n)))
                )
            )


            (PublicMethod isVarDefined:boolean (name:string)
                (
                    (if (has localVariables name)
                        (return true)
                    )
                    (if (null? parent)
                        (return false)
                    )
                    (return (call parent isVarDefined (name)))
                )
            )

            (PublicMethod hasCompilerFlag:boolean (s_name:string)
                (
                    (if (has compilerFlags s_name)
                        (return (get compilerFlags s_name))
                    )
                    (if (null? parent)
                        (
                            (return false)
                        )
                    )
                    (return (call parent hasCompilerFlag (s_name)))
                )
            )            


            (PublicMethod getCompilerSetting:string (s_name:string)
                (
                    (if (has compilerSettings s_name)
                        (return (get compilerSettings s_name))
                    )
                    (if (null? parent)
                        (
                            (return "")
                        )
                    )
                    (return (call parent getCompilerSetting (s_name)))
                )
            )              


            (PublicMethod hasCompilerSetting:boolean (s_name:string)
                (
                    (if (has compilerSettings s_name)
                        (return true)
                    )
                    (if (null? parent)
                        (
                            (return false)
                        )
                    )
                    (return (call parent hasCompilerSetting (s_name)))
                )
            )            


            (PublicMethod getCompilerSetting:string (s_name:string)
                (
                    (if (has compilerSettings s_name)
                        (return (get compilerSettings s_name))
                    )
                    (if (null? parent)
                        (
                            (return "")
                        )
                    )
                    (return (call parent getCompilerSetting (s_name)))
                )
            )  

            (PublicMethod getVariableDef:RangerAppParamDesc (name:string)
                (
                    (if (has localVariables name)
                        (return (get localVariables name))
                    )
                    (if (null? parent)
                        (
                            (def tmp:RangerAppParamDesc (new RangerAppParamDesc ()))
                            (return tmp)
                        )
                    )
                    (return (call parent getVariableDef (name)))
                )
            )

            (PublicMethod findFunctionCtx:RangerAppWriterContext ()
                (
                    (if is_function (return this))
                    (if (null? parent)
                        (return this)
                    )
                    (return (call parent findFunctionCtx ()))
                )
            )               

            ; defCounts
            (PublicMethod getFnVarCnt:int (name:string)
                (
                    (def fnCtx:RangerAppWriterContext (call this findFunctionCtx ()))

                    (def ii:int 0)
                    (if (has fnCtx.defCounts name)
                        (
                            (= ii (get fnCtx.defCounts name))
                            (= ii (+ 1 ii))
                        )
                        (
                            (set fnCtx.defCounts name ii)
                            (return 0)
                        )
                    )
                    (def scope_has:boolean (call this isVarDefined ( (+ name "_" ii))))
                    (while scope_has
                        (
                            (= ii (+ 1 ii))
                            (= scope_has (call this isVarDefined ( (+ name "_" ii))))
                        )
                    )
                    (set fnCtx.defCounts name ii)
                    (return ii)                               
                )
            )            


            (PublicMethod defineVariable:void (name:string desc:RangerAppParamDesc @strong(true))
                (
                    (def cnt:int 0)

                    ; property access is not modified
                    (if (== false ( || (== desc.varType RangerContextVarType.Property)
                                       (== desc.varType RangerContextVarType.FunctionParameter)
                                       (== desc.varType RangerContextVarType.Function)))
                        (= cnt (call this getFnVarCnt (name )))
                    )

                    (if (== 0 cnt)
                        (
                            (= desc.compiledName name)
                        )(
                            ; (call this addError (desc.nameNode ( + "Already defined variable: " name ) ))
                            (= desc.compiledName (+ name "_" cnt))                                                      
                        )
                    )
                    (set localVariables name desc)
                    (push localVarNames name)     
                   
                )
            )


            (PublicMethod isDefinedClass:boolean (name:string)
                (
                    (if (has definedClasses name)
                        (
                            (return true)
                        )
                        (
                            (if (!null? parent)
                                (
                                    (return (call parent isDefinedClass (name)))
                                )
                            )
                        )
                    )
                    (return false)
                )
            )

            (PublicMethod getRoot:RangerAppWriterContext ()
                (
                    (if (null? parent)
                        (
                            (return this)
                        )
                        (
                            (return (call parent getRoot ()))
                        )
                    )
                )
            )

            (PublicMethod getClasses:[RangerAppClassDesc] ()
                (
                    (def list:[RangerAppClassDesc])
                    (for definedClassList n:string i
                        (
                            (push list (get definedClasses n))
                        )
                    )
                    (return list)
                )
            )
            
            
            (PublicMethod addClass:void (name:string desc:RangerAppClassDesc @strong(true))
                (
                    (def root:RangerAppWriterContext (getRoot ()))
                    (if (has name root.definedClasses)
                        (
                            (print (+ "ERROR: class " name " already defined"))
                        )
                        (
                            (set root.definedClasses name desc)
                            (push root.definedClassList name)
                        )
                    )
                )
            )

            (PublicMethod findClass:RangerAppClassDesc (name:string)
                (
                    (def root:RangerAppWriterContext (getRoot ()))
                    (return (get root.definedClasses name) )
                )
            )


            (PublicMethod hasClass:boolean (name:string)
                (
                    (def root:RangerAppWriterContext (getRoot ()))
                    (return (has root.definedClasses name) )
                )
            )

            (PublicMethod getCurrentMethod:RangerAppFunctionDesc ()
                (
                    (if (!null? currentMethod)
                        (
                            (return currentMethod)
                        )
                    )
                    (if (!null? parent)
                        (return (call parent getCurrentMethod ()))
                    )
                    (return (new RangerAppFunctionDesc ()))
                )
            )
            

            (PublicMethod getCurrentClass:RangerAppClassDesc ()
                (
                    (if (!null? currentClass)
                        (
                            (return currentClass)
                        )
                    )
                    (if (!null? parent)
                        (return (call parent getCurrentClass ()))
                    )
                    (return (new RangerAppClassDesc ()))
                )
            )
            
            
            
            (PublicMethod isInExpression:boolean ()
                (
                    (if (> (array_length expr_stack) 0)
                        ( return true)
                    )
                    (if (!null? parent)
                        (return (call parent isInExpression ()))
                    )
                    (return false)
                )
            )

            (PublicMethod expressionLevel:int ()
                (
                    (def level:int (array_length expr_stack))

                    (if (!null? parent)
                        (return (+ level (call parent expressionLevel ())))
                    )
                    (return level)                    
                )
            )


            (PublicMethod setInExpr:void ()
                (
                    (push expr_stack true)
                )
            )            


            (PublicMethod unsetInExpr:void ()
                (
                    (removeLast expr_stack)
                )
            ) 

            (PublicMethod isInMethod:boolean ()
                (
                    (if (> (array_length method_stack) 0)
                        ( return true)
                    )
                    (if (!null? parent)
                        (return (call parent isInMethod ()))
                    )
                    (return false)
                )
            )

            (PublicMethod setInMethod:void ()
                (
                    (push method_stack true)
                )
            )            


            (PublicMethod unsetInMethod:void ()
                (
                    (removeLast method_stack)
                )
            ) 


            (PublicMethod fork:RangerAppWriterContext ()
                (
                    (def new_ctx:RangerAppWriterContext (new RangerAppWriterContext ()))
                    (= new_ctx.parent this)

                    (return new_ctx)
                )
            )
        )
    )
)