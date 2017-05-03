(

    (Enum RangerNodeType:int
        (
            NoType
            Double
            Integer
            String
            Boolean
            Array
            Hash
            Object
            VRef
            Comment
            ExpressionType
            XMLNode
            XMLText
            XMLAttr
            XMLCDATA
            Dictionary
            Any
            Class
            Method
            ClassVar
            Function
            Literal
            Quasiliteral
            Null
        )
    )
    
    ( CreateClass CodeNode 
        (

            (doc
 "
 NOTE: This is just a documentation test, not a real documentation entry!!!
 The codenode represents AST node which can be used for parsers and intepreters of the system.
 ```
    (def n:CodeNode (new CodeNode (src start end)))
    (def str:string (node getCode ()))
 ```
 "           
            )

            (def code:SourceCode)
            (def sp:int 0)
            (def ep:int 0)

            (def expression:boolean false)
            (def vref:string)

            (def type_type:string "")  ; hash, function, array ? 
            (def type_name:string "")
            (def key_type:string)
            (def array_type:string)

            (def ns:[string]) ; obj.foo.x etc => ["obj", "foo", "x"]

            (def value_type:int RangerNodeType.NoType)

            ; set after the code has been preprosessed
            (def eval_type:int RangerNodeType.NoType)
            (def eval_type_name:string "")

            (def double_value:double)
            (def string_value:string)
            (def int_value:int)
            (def boolean_value:boolean)
            (def expression_value:CodeNode)

            ; annotations or properties
            (def props:[string:CodeNode])
            (def prop_keys:[string])

            (def comments:[CodeNode])
            (def children:[CodeNode])
            (def parent:CodeNode)

            ; execution state
            (def execState:CodeExecState)

            (Constructor (source:SourceCode start:int end:int)
                (
                    (= sp start)
                    (= ep end)
                    (= code source)
                )
            )

            ( PublicMethod getFilename:string () (
                (return code.filename)
            ))            

            ( PublicMethod getLine:int () (
                (return (call code getLine (sp)))
            ))
                        
            ( PublicMethod getLineString:string (line_index:int) (
                (return (call code getLineString (line_index)))
            ))
           

            (PublicMethod getPositionalString:string () 
                (
                    (if (&& (> ep sp) ( < (- ep sp) 50 ))
                        (
                            (def start:int sp)
                            (def end:int ep)
                            (= start (- start 100))
                            (= end (+ end 50))
                            (if (< start 0)
                                (= start 0)
                            )
                            (if (>= end (strlen code.code))
                                (= end (- (strlen code.code) 1))
                            )
                            (return (substring code.code start end))
                        )
                    )
                    (return "")
                )
            )
            

            (PublicMethod isVariableDef:boolean () 
                (
                    (return (isFirstVref "def"))
                )
            )

            (PublicMethod isFunctionDef:boolean () 
                (
                    (return (isFirstVref "defn"))
                )
            )

            (PublicMethod isFunctionCall:boolean () 
                (
                    (if (isVariableDef _) (return false))
                    (if (isFunctionDef _) (return false))

                    (if ( && (isFirstTypeVref _ )
                        ( > (array_length children) 1) )
                        (
                            (return true)
                        )
                    )
                    (return false)
                )
            )


            (PublicMethod isPrimitive:boolean () 
                (
                    (if (||
                            (== value_type RangerNodeType.Double)
                            (== value_type RangerNodeType.String)
                            (== value_type RangerNodeType.Integer)
                            (== value_type RangerNodeType.Boolean)
                        )
                        (
                            (return true)
                        )
                    )
                    (return false)
                )
            )
            

            (PublicMethod getFirst:CodeNode () 
                (
                    (return (itemAt children 0))
                )
            )

            (PublicMethod getSecond:CodeNode () 
                (
                    (return (itemAt children 1))
                )
            )

            (PublicMethod getThird:CodeNode () 
                (
                    (return (itemAt children 2))
                )
            )

            (PublicMethod isSecondExpr:boolean () 
                (
                    (if ( > (array_length children) 1)
                        (
                            (def second:CodeNode (itemAt children 1))
                            (if second.expression
                                (return true)
                            )
                        )
                    )
                    (return false)
                )
            )

            (PublicMethod getOperator:string () 
                (
                    (def s:string "")
                    (if ( > (array_length children) 0)
                        (
                            (def fc:CodeNode (itemAt children 0))
                            (if (== fc.value_type RangerNodeType.VRef)
                                (return fc.vref)
                            )
                        )
                    )
                    (return s)
                )
            )


            (PublicMethod getVRefAt:string (idx:int) 
                (
                    (def s:string "")
                    (if ( > (array_length children) idx)
                        (
                            (def fc:CodeNode (itemAt children idx))
                            (return fc.vref)
                        )
                    )
                    (return s)
                )
            )

           (PublicMethod getStringAt:string (idx:int) 
                (
                    (def s:string "")
                    (if ( > (array_length children) idx)
                        (
                            (def fc:CodeNode (itemAt children idx))
                            (if (== fc.value_type RangerNodeType.String)
                                (return fc.string_value)
                            )
                        )
                    )
                    (return s)
                )
            )
            


            (PublicMethod hasExpressionProperty:boolean (name:string) 
                (
                    (def ann:CodeNode (get props name))
                    (if (!null? ann)
                        (
                            (return ann.expression)
                            ;(def fc:CodeNode (itemAt ann.children 0))
                            ;(if (== fc.value_type RangerNodeType.VRef)
                            ;    (return true)
                            ;)   
                        )
                    )
                    (return false)
                )
            )              

            (PublicMethod getExpressionProperty:CodeNode (name:string) 
                (
                    (def ann:CodeNode (get props name))
                    (if (!null? ann)
                        (
                            (return ann)  
                        )
                    )
                    (return false)
                )
            )   

            (PublicMethod hasIntProperty:boolean (name:string) 
                (
                    (def ann:CodeNode (get props name))
                    (if (!null? ann)
                        (
                            (def fc:CodeNode (itemAt ann.children 0))
                            (if (== fc.value_type RangerNodeType.Integer)
                                (return true)
                            )   
                        )
                    )
                    (return false)
                )
            )             

            (PublicMethod getIntProperty:double (name:string) 
                (
                    (def ann:CodeNode (get props name))
                    (if (!null? ann)
                        (
                            (def fc:CodeNode (itemAt ann.children 0))
                            (if (== fc.value_type RangerNodeType.Integer)
                                (return fc.int_value)
                            )   
                        )
                    )
                    (return 0.0)
                )
            )              

            (PublicMethod hasDoubleProperty:boolean (name:string) 
                (
                    (def ann:CodeNode (get props name))
                    (if (!null? ann)
                        (

                            (if (== ann.value_type RangerNodeType.Double)
                                (return true)
                            )                               
                            ;(def fc:CodeNode (itemAt ann.children 0))
                            ;(if (== fc.value_type RangerNodeType.Double)
                            ;    (return true)
                            ;)   
                        )
                    )
                    (return false)
                )
            )             

            (PublicMethod getDoubleProperty:double (name:string) 
                (
                    (def ann:CodeNode (get props name))
                    (if (!null? ann)
                        (
                            ; (def fc:CodeNode (itemAt ann.children 0))
                            (if (== ann.value_type RangerNodeType.Double)
                                (return ann.double_value)
                            )   
                        )
                    )
                    (return 0.0)
                )
            )             

            (PublicMethod hasStringProperty:boolean (name:string) 
                (
                    (def ann:CodeNode (get props name))
                    (if (!null? ann)
                        (
                            ; (def fc:CodeNode (itemAt ann.children 0))
                            (if (== ann.value_type RangerNodeType.String)
                                (return true)
                            )   
                        )
                    )
                    (return false)
                )
            )             

            (PublicMethod getStringProperty:string (name:string) 
                (
                    (def ann:CodeNode (get props name))
                    (if (!null? ann)
                        (
                            ; (def fc:CodeNode (itemAt ann.children 0))
                            (if (== ann.value_type RangerNodeType.String)
                                (return ann.string_value)
                            )   
                        )
                    )
                    (return "")
                )
            )              
            
            (PublicMethod hasBooleanProperty:boolean (name:string) 
                (
                    (def ann:CodeNode (get props name))
                    (if (!null? ann)
                        (
                            ; (def fc:CodeNode (itemAt ann.children 0))
                            (if (== ann.value_type RangerNodeType.Boolean)
                                (return true)
                            )   
                        )
                    )
                    (return false)
                )
            )             

            (PublicMethod getBooleanProperty:boolean (name:string) 
                (
                    (def ann:CodeNode (get props name))
                    (if (!null? ann)
                        (
                            ; (def fc:CodeNode (itemAt ann.children 0))
                            (if (== ann.value_type RangerNodeType.Boolean)
                                (return ann.boolean_value)
                            )   
                        )
                    )
                    (return false)
                )
            )            

            (PublicMethod isFirstTypeVref:boolean (vrefName:string) 
                (
                    (if ( > (array_length children) 0)
                        (
                            (def fc:CodeNode (itemAt children 0))
                            (if (== fc.value_type RangerNodeType.VRef)
                                (return true)
                            )
                        )
                    )
                    (return false)
                )
            )
            

            (PublicMethod isFirstVref:boolean (vrefName:string) 
                (
                    (if ( > (array_length children) 0)
                        (
                            (def fc:CodeNode (itemAt children 0))
                            (if (== fc.vref vrefName)
                                (return true)
                            )
                        )
                    )
                    (return false)
                )
            )

            ( PublicMethod getString:string () (
                (return (substring code.code sp ep))
            ))


            ( PublicMethod writeCode:void (wr:CodeWriter) (

                (switch value_type
                    (case RangerNodeType.Double
                        (
                            (call wr out ( ( double2str double_value ) false ))
                        )
                    )
                    (case RangerNodeType.String
                        (
                            (call wr out  ( (+ (strfromcode 34) string_value (strfromcode 34)) false) )
                        )
                    )
                    (case RangerNodeType.Integer
                        (
                            (call wr out (( + "" int_value) false))
                        )
                    )
                    (case RangerNodeType.Boolean
                        (
                            (if boolean_value
                                (call wr out ("true" false))
                                (call wr out ("false" false))
                            )
                        )   
                    )                    
                    (case RangerNodeType.VRef
                        (
                            (def res:string vref)
                            (if (> (strlen type_name) 0)
                                (= res (+ res ":" type_name))
                            )
                            (call wr out (res false))  
                        )
                    )                    
                    (case RangerNodeType.Array
                        (
                            ; (print ( + "Array : " vref " : " array_type))
                            
                            (def res:string vref)
                            (if (> (strlen array_type) 0)
                                (= res (+ res ":[" array_type "]"))
                            )
                            (call wr out (res false))                            
                        )
                    )                    
                    (case RangerNodeType.Hash
                        (
                            ; (print ( + "Hash : " vref " : [" key_type ":" array_type "]"))

                            (def res:string vref)
                            (if (> (strlen array_type) 0)
                                (= res (+ res ":[" key_type ":" array_type "]"))
                            )
                            (call wr out (res false))                             
                            
                        )
                    )
                    (case RangerNodeType.ExpressionType
                        (
                            (call wr out ((+ vref ":") false)) 
                            (if (null? expression_value)
                                (

                                )
                                (
                                    (call expression_value writeCode (wr))
                                )
                            )
                            
                        )
                    )                                        
                    (case RangerNodeType.Comment
                        (
                            ; ignore comments
                            ; (return "")
                            ; (call wr out ("" true)) 
                            (call wr out (";" false))
                            (call wr out (string_value true))
                        )
                    )                    
                    (default
                        (
                            (if expression
                                (
                                    ;(call wr out ("" true))
                                    ;(call wr indent (1))
                                    (call wr out ("(" false))

                                    (for prop_keys key:string i
                                        (
                                            (call wr out (" @" false))
                                            (call wr out (key false))

                                            (def propVal:CodeNode (get props key))
                                            (if (call propVal isPrimitive())
                                                (
                                                    (call wr out ("(" false))
                                                    (call propVal writeCode (wr))
                                                    (call wr out (")" false))
                                                )
                                                (
                                                    (call propVal writeCode (wr))
                                                )
                                            )
                                            
                                            (call wr out (" " false))
                                        )
                                    )

                                    (def is_block:boolean false)
                                    (def exp_cnt:int 0)
                                    (for children item:CodeNode i 
                                        (
                                            (if (== i 0)
                                                (
                                                    (= is_block item.expression)
                                                    (if is_block
                                                        (
                                                            (call wr out ("" true))
                                                            (call wr indent (1))
                                                        )
                                                        (

                                                        )
                                                    )
                                                )
                                            )
                                            (if ( || item.expression (== item.value_type RangerNodeType.Comment) )
                                                (= exp_cnt (+ 1 exp_cnt))
                                            )
                                            (if ( && (== is_block false) (> exp_cnt 0) )
                                                (
                                                    ; (call wr out ("" true))
                                                    (= is_block true)
                                                    (call wr out ("" true))
                                                    (call wr indent (1))
                                                )
                                            )

                                            (if is_block
                                                (                                                    
                                                    (call item writeCode (wr))
                                                    (if (== item.value_type RangerNodeType.Comment)
                                                        ()
                                                        (call wr out ("" true))
                                                    )
                                                )
                                                (
                                                    (if (> i 0)
                                                        (call wr out (" " false))
                                                    )
                                                    (call item writeCode (wr))
                                                )
                                            )
                                        )
                                    )
                                    (if is_block
                                        (
                                            (call wr indent (-1))
                                        )
                                    )                           
                                    (call wr out (")" false))      
                                    ;(call wr indent (-1))                                   
                                )
                            )
                        )
                    )

                )

            ))             


            ( PublicMethod getCode:string () (

                (def wr:CodeWriter (new CodeWriter ()))

                (call this writeCode (wr))

                (return (call wr getCode ()))


                (switch value_type
                    (case RangerNodeType.Double
                        (
                            (return ( double2str double_value ) )
                        )
                    )
                    (case RangerNodeType.String
                        (
                            (return (+ (strfromcode 34) string_value (strfromcode 34)) )
                        )
                    )
                    (case RangerNodeType.Integer
                        (
                            (return ( + "" int_value))
                        )
                    )
                    (case RangerNodeType.Boolean
                        (
                            (if boolean_value
                                (return "true")
                                (return "false")
                            )
                        )
                    )                    
                    (case RangerNodeType.VRef
                        (
                            (def res:string vref)
                            (if (> (strlen type_name) 0)
                                (= res (+ res ":" type_name))
                            )
                            (return res)
                        )
                    )                    
                    (case RangerNodeType.Array
                        (
                            ; (print ( + "Array : " vref " : " array_type))
                            
                            (def res:string vref)
                            (if (> (strlen array_type) 0)
                                (= res (+ res ":[" array_type "]"))
                            )
                            (return res)                            
                        )
                    )                    
                    (case RangerNodeType.Hash
                        (
                            ; (print ( + "Hash : " vref " : [" key_type ":" array_type "]"))

                            (def res:string vref)
                            (if (> (strlen array_type) 0)
                                (= res (+ res ":[" key_type ":" array_type "]"))
                            )
                            (return res)                             
                            
                        )
                    )
                    (case RangerNodeType.ExpressionType
                        (
                            
                            (if (null? expression_value)
                                (return "")
                            )
                            (return (call expression_value getCode ()))
                        )
                    )                                        
                    (case RangerNodeType.Comment
                        (
                            ; ignore comments

                            (return "")
                        )
                    )                    

                )

                (if expression
                    (
                        (def res:string "( ")
                        (for children item:CodeNode i 
                            (
                                (= res (+ res " "))
                                (= res (+ res (call item getCode ())))
                                (= res (+ res " "))
                            )
                        )                          
                        (= res (+ res " ) "))
                        (return res)                                                
                    )
                )
                (return "")
            ))            
            
            ; debugging function, to be removed:
            ( PublicMethod walk:void  () (

                (switch value_type
                    (case RangerNodeType.Double
                        (
                            (print ( + "Double : " double_value))
                        )
                    )
                    (case RangerNodeType.String
                        (
                            (print ( + "String : " string_value))
                        )
                    )
                    (case RangerNodeType.Integer
                        (
                            (print ( + "Integer : " int_value))
                        )
                    )
                    (case RangerNodeType.Boolean
                        (
                            (print ( + "Boolean : " boolean_value))
                        )
                    )                    
                    (case RangerNodeType.VRef
                        (
                            (print ( + "VREF : " vref " : " type_name))
                            (print ns)
                        )
                    )                    
                    (case RangerNodeType.Array
                        (
                            (print ( + "Array : " vref " : " array_type))
                            
                        )
                    )                    
                    (case RangerNodeType.Hash
                        (
                            (print ( + "Hash : " vref " : [" key_type ":" array_type "]"))
                            
                        )
                    )
                    (case RangerNodeType.ExpressionType
                        (
                            (print ( + "Expression type : " vref ))
                            (print "----- expression starts ------")
                            (call expression_value walk ())                    
                            (print "----- expression ends ------")
                        )
                    )                                        
                    (case RangerNodeType.Comment
                        (
                            (print ( + "Comment : " string_value))
                        )
                    )                    

                )

                (if expression
                    (print "(")
                    (print (substring code.code sp ep))
                )
                
                (for children item:CodeNode i 
                    (call item walk ())
                )    

                (if expression
                    (print ")")
                )
            ))

        )
    )
    
)