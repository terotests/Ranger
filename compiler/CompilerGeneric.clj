(
    (Import "writer.clj")
    (Import "DictNode.clj")
    (Import "CodeNode.clj")

    ( CreateClass SourceCode:void
        (
            (def code:string)
            (def filename:string "")
            (def lines:[string])

            (Constructor (code_string:string)
                (
                    (= code code_string)
                    (= lines (strsplit code_string "\n"))
                )
            )

            ( PublicMethod getLineString:string (line_index:int) (
                (if (> (array_length lines) line_index)
                    (return (itemAt lines line_index))
                )
                (return "")
            ))
                        
            ( PublicMethod getLine:int (sp:int) (
                (def cnt:int 0)
                (for lines str:string i 
                    (
                        (= cnt (+ cnt (+ (strlen str) 1)))
                        (if (> cnt sp)
                            (return i)
                        )
                    )
                )
                (return -1)
            ))            

        )
    )

    ; the code execution state and information
    ( CreateClass CodeExecState:void 
        (

            (def is_running:boolean false)
            (def is_ready:boolean false)

            (def expand_args:boolean false)
            (def param_index:int 0)
            (def child_index:int 0)

            (def value_type:int RangerNodeType.NoType)

            ; evaluated value for the node
            (def double_value:double)
            (def string_value:string)
            (def int_value:int)
            (def boolean_value:boolean)
            (def expression_value:CodeNode)

            (def ctx:RangerContext)

        )
    )    

    ; possible context events... writing new values for the variables
    ( CreateClass RangerContextEvent 
        (

            (def ctx:RangerContext)
            (def var_name:string)

            ( PublicMethod fire:void ( ) (
                ; 
            ))            
        )
    )

    ( CreateClass RangerContextEventContainer 
        (       
            (def listeners:[RangerContextEvent])

            ( PublicMethod fire:void () (
                (for listeners observer:RangerContextEvent i
                    (call observer fire ( ))
                )
            ))            
        )
    )
    

    ; the context is essential for all the client applications
    ; one of the things the context should have is to have also possibility
    ; to have events.
    ( CreateClass RangerContext 
        (

            (def parent:RangerContext @weak(true))

            (def defined_values:[string:boolean])
            (def set_values:[string:boolean])
            (def set_types:[string:int])

            (def int_values:[string:int])
            (def str_values:[string:string])
            (def double_values:[string:double])
            (def bool_values:[string:double])

            ; possible dictionaries in the context.
            (def dict_values:[string:DictNode])
            
            ; ---------------------------------------------
            ; TODO: think if code_values could be enough ? 
            
            ; if context defines runnable functions
            (def code_values:[string:CodeNode])

            (def events:[string:RangerContextEventContainer])

            ( PublicMethod fork:RangerContext () (
                (def new_ctx:RangerContext (new RangerContext ()))
                (= new_ctx.parent this)
                (return new_ctx)
            ))

            ; is of type RangerNodeType 
            ( PublicMethod getTypeOf:int ( key:string) (
                (if (has defined_values key )
                    (
                        (return (get set_types key))
                    )
                    (
                        ; maybe parent context has the key
                        (if (!null? parent)
                            (
                                (return (call parent getTypeOf (key)))
                            )
                        )
                    )
                )
                (return RangerNodeType.NoType)
            ))

            ( PublicMethod isString:boolean ( key:string) (
                (if (has set_values key)
                    ( return (== (get set_types key) RangerNodeType.String))            
                )
                (if (!null? parent)
                    (return (call parent isString (key)))
                )
                (return false)
            ))

            ( PublicMethod isDouble:boolean ( key:string) (
                (if (has set_values key)
                    ( return (== (get set_types key) RangerNodeType.Double))            
                )
                (if (!null? parent)
                    (return (call parent isDouble (key)))
                )
                (return false)
            ))

            ( PublicMethod isInt:boolean ( key:string) (
                (if (has set_values key)
                    ( return (== (get set_types key) RangerNodeType.Integer))            
                )
                (if (!null? parent)
                    (return (call parent isInt (key)))
                )
                (return false)
            ))

            ( PublicMethod isBoolean:boolean ( key:string) (
                (if (has set_values key)
                    ( return (== (get set_types key) RangerNodeType.Boolean))            
                )
                (if (!null? parent)
                    (return (call parent isBoolean (key)))
                )
                (return false)
            ))
            
            ( PublicMethod isDefinedString:boolean ( key:string) (
                (if (has defined_values key)
                    ( return (== (get set_types key) RangerNodeType.String))            
                )
                (if (!null? parent)
                    (return (call parent isString (key)))
                )
                (return false)
            ))

            ( PublicMethod isDefinedDouble:boolean ( key:string) (
                (if (has defined_values key)
                    ( return (== (get set_types key) RangerNodeType.Double))            
                )
                (if (!null? parent)
                    (return (call parent isDefinedDouble (key)))
                )
                (return false)
            ))

            ( PublicMethod isDefinedInt:boolean ( key:string) (
                (if (has defined_values key)
                    ( return (== (get set_types key) RangerNodeType.Integer))            
                )
                (if (!null? parent)
                    (return (call parent isDefinedInt (key)))
                )
                (return false)
            ))

            ( PublicMethod isDefinedBoolean:boolean ( key:string) (
                (if (has defined_values key)
                    ( return (== (get set_types key) RangerNodeType.Boolean))            
                )
                (if (!null? parent)
                    (return (call parent isDefinedBoolean (key)))
                )
                (return false)
            ))

            ; varible definitions
            ( PublicMethod defineString:void ( key:string) (
                (set set_types key RangerNodeType.String)
                (set defined_values key true)
            ))

            ( PublicMethod defineInt:void ( key:string) (
                (set set_types key RangerNodeType.Integer)
                (set defined_values key true)
            ))

            ( PublicMethod defineBoolean:void ( key:string) (
                (set set_types key RangerNodeType.Boolean)
                (set defined_values key true)
            ))

            ( PublicMethod defineDouble:void ( key:string) (
                (set set_types key RangerNodeType.Boolean)
                (set defined_values key true)
            ))


            ( PublicMethod setString:void ( key:string value:string) (
                ; TODO: throw error if string is not really defined...
                (set str_values key value)
            ))

            ( PublicMethod getString:string ( key:string) (
                (if (has str_values key) 
                    (return (get str_values key))
                    (if (!null? parent)
                        (return (call parent getString (key)))
                        (return "")
                    )
                )
            ))

        )
    )    

)