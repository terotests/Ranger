(
    ( CreateClass RangerAppClassDesc
        (

            (def name:string "")
            (def ctx:RangerAppWriterContext @weak(true))
            (def variables:[RangerAppParamDesc])

            (def methods:[RangerAppFunctionDesc])
            (def defined_methods:[string:boolean])

            (def static_methods:[RangerAppFunctionDesc])
            (def defined_static_methods:[string:boolean])
            
            (def has_constructor:boolean false)
            (def constructor_node:CodeNode @weak(true))
            (def constructor_fn:RangerAppFunctionDesc @weak(true))

            (def has_destructor:boolean false)
            (def destructor_node:CodeNode @weak(true))
            (def destructor_fn:RangerAppFunctionDesc @weak(true))
            
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

            (PublicMethod hasStaticMethod:boolean (m_name:string)
                (
                    (return (has defined_static_methods m_name))
                )
            )

            (PublicMethod findStaticMethod:RangerAppFunctionDesc (f_name:string)
                (
                    (for static_methods m:RangerAppFunctionDesc i 
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
                            (if (call cDesc hasStaticMethod (f_name))
                                (return (call cDesc findStaticMethod (f_name)))
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

            (PublicMethod addVariable:void (desc:RangerAppParamDesc @strong(true))
                (
                    (push variables desc)
                )
            )

            (PublicMethod addMethod:void (desc:RangerAppFunctionDesc @strong(true))
                (
                    (set defined_methods desc.name true)
                    (push methods desc)
                )
            )

            (PublicMethod addStaticMethod:void (desc:RangerAppFunctionDesc @strong(true))
                (
                    (set defined_static_methods desc.name true)
                    (push static_methods desc)
                )
            )

        )
    )
    
)