(

    (Enum RangerNodeRefType:int
        (
            NoType
            Weak
            Strong
            Shared
            StrongImmutable
        )
    )

    ( Enum RangerContextVarType
        (
            NoType
            This
            ThisProperty
            NewObject
            FunctionParameter
            LocalVariable
            Array 
            Object
            Property
        )    
    )
    

    ( CreateClass RangerAppTodo
        (
            (def description:string "")
            (def node:CodeNode)
        )    
    )
    
    ( CreateClass RangerCompilerMessage
        (
            (def error_level:int 0)
            (def code_line:int 0)
            (def fileName:string "")
            (def description:string "")
            (def node:CodeNode)
        )
    )
    
    ; RangerNodeValue could be used for default values
    ( CreateClass RangerNodeValue
        (
            (def double_value:double)
            (def string_value:string)
            (def int_value:int)
            (def boolean_value:boolean)
            (def expression_value:CodeNode) 
        )
    )

    ( CreateClass RangerAppParamDesc
        (
            (def name:string "")
            
            (def ref_cnt:int 0)
            (def set_cnt:int 0)
            
            (def value_type:RangerNodeType)
            (def has_default:boolean false)
            (def def_value:CodeNode)

            (def default_value:RangerNodeValue)
            
            (def isThis:boolean false)            
            (def classDesc:RangerAppClassDesc)
            (def fnDesc:RangerAppFunctionDesc)

            ; 
            (def varType:RangerContextVarType RangerContextVarType.NoType)
            (def refType:RangerNodeRefType RangerNodeRefType.NoType)

            (def isParam:boolean)
            (def paramIndex:int 0)

            (def is_optional:boolean false)
            (def is_mutating:boolean false)
            (def is_set:boolean false)
            (def is_class_variable:boolean false)

            (def node:CodeNode)
            (def nameNode:CodeNode)

            (def description:string "")
            (def git_doc:string "")
        )
    )

    ( CreateClass RangerAppFunctionDesc
        (
            (def name:string "")
            (def node:CodeNode)            
            (def nameNode:CodeNode)
            (def params:[RangerAppParamDesc])
            (def return_value:RangerAppParamDesc)

            (def is_method:boolean false)
            (def container_class:RangerAppClassDesc)

            ; function body AST and string
            (def body_ast:CodeNode)
            (def body_str:string)

            ; static code analyzer
            (def createdInstances:[RangerAppObjectInstance])

            ; for example there could be a reference instance to a variable which holds
            ; a new object created in this function or an object which is returned from
            ; some method call.
            (def instanceVariables:[string:RangerAppObjectInstance])

            ; assign a new instance to function and codenode
            (PublicMethod addNewInstance:void (node:CodeNode className:string ctx:RangerAppWriterContext)
                (
                   (def currC:RangerAppClassDesc (call ctx findClass (className)))
                   (def inst:RangerAppObjectInstance (new RangerAppObjectInstance ()))

                   (= inst.className className)
                   (= inst.is_created_here true)                    
                   (push createdInstances inst)
                   (push node.ownedInstances inst)

                   (= node.ref_need_assign 1)
                   ; (print (+ "new instance " className))
                )
            )

            (PublicMethod addParamInstance:void (node:CodeNode className:string ctx:RangerAppWriterContext)
                (
                   (def currC:RangerAppClassDesc (call ctx findClass (className)))
                   (def inst:RangerAppObjectInstance (new RangerAppObjectInstance ()))

                   (= inst.className className)
                   (= inst.is_fn_parameter true)                    
                   (push createdInstances inst)

                   @todo("The owned instances might be simply referenced instances list and the type could be determined from the reference type.")
                   
                   (push node.ownedInstances inst)
                   (call ctx setInstanceVar (node.vref inst))
                   ; (print (+ "new instance " className))
                )
            )

            (PublicMethod addStrongInstance:void (node:CodeNode className:string ctx:RangerAppWriterContext)
                (
                   (def currC:RangerAppClassDesc (call ctx findClass (className)))
                   (def inst:RangerAppObjectInstance (new RangerAppObjectInstance ()))

                   (= inst.className className)               
                   (push createdInstances inst)

                   ; (push node.referencedInstances inst)
                   (push node.ownedInstances inst)
                   (call ctx setInstanceVar (node.vref inst))
                   ; (print (+ "new instance " className))
                )
            )            



            (PublicMethod setInstanceVar:void (i_name:string inst:RangerAppObjectInstance)
                (
                    (set instanceVariables i_name inst)
                )
            )

            (PublicMethod hasInstanceVar:boolean (i_name:string )
                (
                    ( return (has instanceVariables i_name) )
                )
            )

            (PublicMethod getInstanceVar:RangerAppObjectInstance (i_name:string )
                (
                    ( return (get instanceVariables i_name) )
                )
            )


        )
    )

    ; datastructure which tracks the created instances and helps to determine if the
    ; functions and destructors should free the instances or not
    ( CreateClass RangerAppObjectInstance
        (

            (def name:string "")

            (def sourceClass:string "")
            (def sourceFn:string "")

            (def assignedToVariable:RangerAppParamDesc)

            ; if the instance is created at this function
            (def is_created_here:boolean false)
            (def is_fn_parameter:boolean false)
            (def is_assigned_member:boolean false)

            (def is_returned:boolean false)

            ; the function which owns the variable
            (def ownerFunction:RangerAppFunctionDesc)

            (def is_owner:boolean false)

            (def creatorNode:CodeNode)
            (def is_local:boolean)
            
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
    

    ( CreateClass RangerAppClassDesc
        (

            (def name:string "")
            (def ctx:RangerAppWriterContext)
            (def variables:[RangerAppParamDesc])
            (def methods:[RangerAppFunctionDesc])
            (def defined_methods:[string:boolean])
            
            (def has_constructor:boolean false)
            (def constructor_node:CodeNode)
            (def constructor_fn:RangerAppFunctionDesc)

            (def has_destructor:boolean false)
            (def destructor_node:CodeNode)
            (def destructor_fn:RangerAppFunctionDesc)
            
            (def extends_classes:[string])

            ; code written into constructor
            (def contr_writers:[CodeWriter])

            (PublicMethod hasMethod:boolean (m_name:string)
                (
                    (return (has defined_methods m_name))
                )
            )

            (PublicMethod findMethod:RangerAppFunctionDesc (f_name:string)
                (
                    (for methods m:RangerAppFunctionDesc i 
                        (
                            (if (== m.name f_name)
                                (return m)
                            )
                        )
                    )

                    ; (def classDesc:RangerAppClassDesc (call ctx findClass (className)))
                    (for extends_classes cname:string i
                        (
                            (def cDesc:RangerAppClassDesc (call ctx findClass (cname)))
                            (if (call cDesc hasMethod (f_name))
                                (return (call cDesc findMethod (f_name)))
                            )
                        )
                    )

                )
            )

            (PublicMethod findVariable:RangerAppParamDesc (f_name:string)
                (
                    (for variables m:RangerAppParamDesc i 
                        (
                            (if (== m.name f_name)
                                (return m)
                            )
                        )
                    )
                )
            )
            

            (PublicMethod addParentClass:void (p_name:string)
                (
                    (push extends_classes p_name)
                )
            )

            (PublicMethod addVariable:void (desc:RangerAppParamDesc)
                (
                    (push variables desc)
                )
            )

            (PublicMethod addMethod:void (desc:RangerAppFunctionDesc)
                (
                    (set defined_methods desc.name true)
                    (push methods desc)
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

            (def in_expression:boolean false)
            (def expr_stack:[boolean])

            (def in_method:boolean false)
            (def method_stack:[boolean])

            (def currentClassName:string )
            (def currentClass:RangerAppClassDesc)
            (def currentMethod:RangerAppFunctionDesc)

            (def definedEnums:[string:RangerAppEnum])

            (def definedClasses:[string:RangerAppClassDesc])
            (def definedClassList:[string])

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

            (def localTmpVariables:[string:boolean])
            (def localFinalTmpVariables:[string:boolean])
            (def localTmpVarNames:[string])
            (def tmpVarConversions:[string:string])

            (Constructor ()
                (
                    ; initialize the file system here
                    (= fileSystem (new CodeFileSystem ()))
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

            ; resignedInstancesVars

            (PublicMethod resignInstanceVar:void (i_name:string inst:RangerAppObjectInstance)
                (
                    (set resignedInstancesVars i_name inst)
                )
            )

            (PublicMethod hasResignedInstanceVar:boolean (i_name:string )
                (
                    @todo("check that i_name is not referring to a scalar value from lower scope accidentally")

                    (if (has resignedInstancesVars i_name) 
                        (return true)
                    )
                    (if (!null? parent)
                        (return (call parent hasResignedInstanceVar (i_name)))
                    )
                    (return false)
                )
            )



            (PublicMethod setInstanceVar:void (i_name:string inst:RangerAppObjectInstance)
                (
                    (set instanceVariables i_name inst)
                    (= inst.name i_name)
                )
            )

            (PublicMethod hasInstanceVar:boolean (i_name:string )
                (
                    (if (has instanceVariables i_name) 
                        (return true)
                    )
                    (if (!null? parent)
                        (return (call parent hasInstanceVar (i_name)))
                    )
                    (return false)
                )
            )

            (PublicMethod getInstanceVar:RangerAppObjectInstance (i_name:string )
                (
                    (if (has instanceVariables i_name) 
                        (return (get instanceVariables i_name))
                    )
                    (if (!null? parent)
                        (return (call parent getInstanceVar (i_name)))
                    )
                    (return (new RangerAppObjectInstance ()))
                )
            )




            ; (for node.children nn:CodeNode i
            ;   (for nn.children ch:CodeNode i
            ;      (...)
            ;   )
            ; )
            ; -> the variables can be defined in the same context or in nested contexts
            ; -> 

            ; if there is a context where the "i" is defined
            ; then "i" can have different values...

            (PublicMethod defTmpVarName:void (name:string)
                (
                    (set localTmpVariables name true)
                )
            )
            ; localFinalTmpVariables

            (PublicMethod isFinalTmpVarName:boolean (name:string)
                (
                    (if (isVarDefined name)
                        (return true)
                    )
                    (if (has localFinalTmpVariables name)
                        (return true)
                    )
                    (if (!null? parent)
                        (call parent isFinalTmpVarName (name))
                    )
                    (return false)
                )
            )            
            
            (PublicMethod getTmpVarName:string (name:string)
                (
                    ; if tmp variable has been defined...
                    (if (has tmpVarConversions name)
                        (return (get tmpVarConversions name))
                    )

                    ; if not, try to create the temporary variable 

                    (if (== false (isFinalTmpVarName name))
                        (
                            ; if the name was not defined 
                            (set tmpVarConversions name name)
                            (set localFinalTmpVariables name true)
                            (return name)
                        )
                    )

                    (def idx:int 2)
                    (def maxLoops:int 10000)

                    (while (> maxLoops 0)
                        (
                            (def test_str:string (+ name idx))

                            (if (== false (isFinalTmpVarName test_str))
                                (
                                    (set tmpVarConversions name test_str)
                                    (set localFinalTmpVariables test_str true)
                                    (return test_str)
                                )
                            )
                            (= idx (+ idx 1))
                            (= maxLoops (- maxLoops 1))
                        )
                    )

                    (print (+ "ERROR, could not convert variable " name " to tmp variable"))
                    (return "__tmp__")
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


            (PublicMethod defineVariable:void (name:string desc:RangerAppParamDesc)
                (
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
            
            (PublicMethod addClass:void (name:string desc:RangerAppClassDesc)
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