(
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
            (def params:[RangerAppParamDesc])
            (def return_value:RangerAppParamDesc)

            (def is_method:boolean false)
            (def container_class:RangerAppClassDesc)

            ; function body AST and string
            (def body_ast:CodeNode)
            (def body_str:string)
            
        )
    )

    ( CreateClass RangerAppEnum
        (
            (def name:string "")
            (def cnt:integer 0)
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

            (def variables:[RangerAppParamDesc])
            (def methods:[RangerAppFunctionDesc])
            (def defined_methods:[string:boolean])
            
            (def has_constructor:boolean false)
            (def constructor_node:CodeNode)

            (def has_desctructor:boolean false)
            (def descructor_node:CodeNode)
            
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

            (PublicMethod addConstructor:void (desc:RangerAppFunctionDesc)
                (
                    (= constructor_fn desc)
                )
            )
            (PublicMethod addDesctructor:void (desc:RangerAppFunctionDesc)
                (
                    (= descructor_fn desc)
                )
            )

        )
    )

    ( CreateClass RangerAppWriterContext
        (

            (def ctx:RangerContext)
            (def parent:RangerAppWriterContext)

            (def defined_imports:[string])
            (def already_imported:[string:boolean])
            
            (def fileSystem:CodeFileSystem)

            (def in_expression:boolean false)
            (def expr_stack:[boolean])

            (def in_method:boolean false)
            (def method_stack:[boolean])

            (def currentClassName:string )
            (def currentClass:RangerAppClassDesc)

            (def definedEnums:[string:RangerAppEnum])

            (def definedClasses:[RangerAppClassDesc])
            (def definedClassList:[string])

            ; list of local variables
            (def localVariables:[string:RangerAppParamDesc])
            (def localVarNames:[string])

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


            (PublicMethod isEnumDefined:void (n:string)
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
                    (if (null? parent)
                        (return (new RangerAppEnum ()))
                    )
                    (return (call parent getEnum (n)))
                )
            )


            (PublicMethod isVarDefined:void (name:string)
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
                    (if (has name definedClasses)
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