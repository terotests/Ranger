(

    (Enum RangerNodeRefType:int (
        NoType
    ))

    (Enum RangerNodeType:int
        (
            NoType
            InvalidType
            Double
            Integer
            String
            Boolean
            Array
            Hash
            Object
            VRef
            Comment
            Enum
            Char
            CharBuffer
            Expression
            ExpressionType
            Lambda
            XMLNode
            XMLText
            XMLAttr
            XMLCDATA
            Dictionary
            Any
            Class
            GenericClass
            ClassRef
            Method
            ClassVar
            Function
            Literal
            Quasiliteral
            Null
        )
    )

    ( CreateClass CodeNode {

            (def code:SourceCode)
            (def sp:int 0)
            (def ep:int 0)

            (def has_operator:boolean false)
            (def op_index:int 0)
            
            ; could be also vref_annotation
            (def mutable_def:boolean false)

            (def expression:boolean false)
            (def vref:string "")
            (def is_block_node:boolean false)     ; specifically marked as a block node

            (def infix_operator:boolean false)    ; if we are collecting infix nodex like 4 + 2 * 10
            (def infix_node@(weak):CodeNode )
            (def infix_subnode:boolean false)

            (def operator_pred:int 0)
            (def to_the_right:boolean false)
            (def right_node@(weak):CodeNode )

            (def type_type:string "")  ; hash, function, array ? 
            (def type_name:string "")
            (def key_type:string "")
            (def array_type:string "")

            (def ns:[string])   

            (def has_vref_annotation:boolean false)
            (def vref_annotation:CodeNode)

            (def has_type_annotation:boolean false)            
            (def type_annotation:CodeNode)

            ; (def typeClass:RangerTypeClass @weak(true))

            (def value_type:RangerNodeType RangerNodeType.NoType)

            ; after node has been evaluated
            (def eval_type:RangerNodeType RangerNodeType.NoType)
            (def eval_type_name:string "")
            (def eval_key_type:string "")
            (def eval_array_type:string "")
            
            (def flow_done:boolean false)
            (def ref_change_done:boolean false)

            ; if the node references to object, if this reference is weak or not
            (def ref_type:RangerNodeRefType RangerNodeRefType.NoType)
            (def ref_need_assign:int 0)  

            (def double_value:double 0.0)
            (def string_value:string "")
            (def int_value:int 1)
            (def boolean_value:boolean false )
            (def expression_value:CodeNode)

            (def props:[string:CodeNode])
            (def prop_keys:[string])

            (def comments:[CodeNode])
            (def children:[CodeNode])
            (def parent@(weak):CodeNode )

            (def didReturnAtIndex:int -1)

            (def hasVarDef:boolean false)
            (def hasClassDescription:boolean false)
            (def hasNewOper:boolean false)
            (def hasFnCall:boolean false)
            (def hasParamDesc:boolean false)

            (Constructor (source:SourceCode start:int end:int)
                (
                    (= sp start)
                    (= ep end)
                    (= code source)
                )
            )

            fn getCode:string () {
                return "--code--"
            }

            fn getParsedString:string () {
                return (substring code.code sp ep)
            }
            

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

            ( PublicMethod walk:void  () (

                (switch value_type (
                    (case RangerNodeType.Double {
                        print "Double " + double_value
                    })
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
                            (if boolean_value 
                                (print ( "Boolean : true "))
                                (print ( "Boolean : false" ))
                            )
                        )
                    )                    
                    (case RangerNodeType.VRef
                        (
                            (print ( "VREF : " + vref + " : " + type_name))
                        )
                    )                    
                    (case RangerNodeType.Array
                        (
                            (print ( "Array : " + vref + " : " +  array_type))
                            
                        )
                    )                    
                    (case RangerNodeType.Hash
                        (
                            (print ( "Hash : "  + vref  + " : [" +  key_type +  ":"  + array_type  + "]"))
                            
                        )
                    )
                    (case RangerNodeType.ExpressionType
                        (
                            (print ( + "Expression type : " vref ))
                            (print "----- expression starts ------")
                            (expression_value.walk ())                    
                            (print "----- expression ends ------")
                        )
                    )                                        
                    (case RangerNodeType.Comment
                        (
                            (print ( + "Comment : " string_value))
                        )
                    )
                    (default {

                    })
                    
                    )

                )

                (if expression
                    (print "(")
                )

                (if has_vref_annotation (
                    (print "-------------------- ANNOTATION STARTS ----------------------")
                    (vref_annotation.walk())
                    (print "-------------------- ANNOTATION ENDS ----------------------")
                ))
                
                (for children item:CodeNode i 
                    (item.walk())
                )    

                (if expression
                    (print ")")
                )                


            ))
            


    })
    
    (class SourceCode {
        def code:string ""
        def sp:int 0 
        def ep:int 0

        (Constructor (code_str:string ) {
            code = code_str
        })
    })


    ( CreateClass RangerLispParser:void {
            (def code:SourceCode)
            (def buff:charbuffer)
            (def len:int 0)
            (def i:int 0)
            (def parents@(weak):[CodeNode] )
            (def next:CodeNode)

            (def paren_cnt:int 0)
            (def get_op_pred:int 0)

            (def rootNode:CodeNode )
            (def curr_node@(weak):CodeNode @weak(true) )
            
            (def had_error:boolean false)
            ; (def had_lf false)

            (Constructor (code_module:SourceCode )
                (
                    (= buff (to_charbuffer code_module.code))
                    (= code code_module)

                    (= len (length (unwrap buff)))

                    (= rootNode (new CodeNode ( (unwrap code) 0 0))) 
                    (= rootNode.is_block_node true) 
                    (= rootNode.expression true)
                    (= curr_node rootNode)
                    (push parents (unwrap curr_node))
                    (= paren_cnt 1)

                )
            )    

            ( PublicMethod getCode:string () {
                return (rootNode.getCode())
            })


            ( PublicMethod parse_raw_annotation:CodeNode () {
                
                    (def sp:int i)
                    (def ep:int i)
                    
                    ; skip annotation mark and continue
                    (= i (+ i 1))
                    (= sp i)
                    (= ep i)

                    (if (< i len) {
                            ; parse new expression as variable type
                            (def a_node2@(returnvalue):CodeNode (new CodeNode((unwrap code) sp ep)))

                            (= a_node2.expression true)
                            (= curr_node a_node2)

                            (push parents a_node2)
                            (= i (+ i 1))
                            (= paren_cnt (+ paren_cnt 1))

                            (this.parse())

                            return a_node2                       
                        } {
                            
                        }
                    )
                    return (new CodeNode((unwrap code) sp ep))
            })

            ( PublicMethod skip_space:boolean (is_block_parent : boolean) {
                    (def s:charbuffer (unwrap buff))                    
                    (def did_break:boolean false)
                

                    (if (i >= len) {
                        return true
                    })

                    (def c:char (charAt s i))


                    def bb:boolean (== c (charcode "."))

                    ; --> skipping of comma (== c (charcode ",")) removed
                    (while ( && (< i len) 
                                (<= c 32 ) )
                            (

                                (if (&& is_block_parent (|| (== c 10) (== c 13) ))
                                    (
                                        
                                        (this.end_expression())
                                        (= did_break true)
                                        (break _)
                                    )
                                )

                                (= i (+ 1 i))

                                (if (i >= len) {
                                    return true
                                })                                
                                (= c (charAt s i))                                   
                            )
                    )
                    return did_break                    
            }
            )
          

            ( PublicMethod end_expression:boolean () (

                (= i (+ 1 i))
                (if (i >= len) {
                    return false
                })           

                (= paren_cnt (- paren_cnt 1))
                (if (< paren_cnt 0)
                    (print "Parser error ) mismatch")
                )

                (removeLast parents)
                (if (!null? curr_node) 
                    (
                        (= curr_node.ep i)
                        (= curr_node.infix_operator false)
                    )
                )

                (if (> (array_length parents) 0)
                    (
                        (= curr_node (itemAt parents (- (array_length parents) 1 ) ))
                    )
                    (
                        (= curr_node rootNode)
                    )
                )
                (= curr_node.infix_operator false)
                (return true)
            ))

            (PublicMethod getOperator:int () {

                (def s:charbuffer (unwrap buff))

                if ( i + 2 >= len ) {
                    return 0
                }

                def c:char (charAt s i)
                def c2:char (charAt s (+ i 1))

                switch c {

                    case ( (charcode "*" ) ) {
                        i = i + 1
                        return 14
                    } 

                    case ( (charcode "/" ) ) {
                        i = i + 1
                        return 14
                    } 

                    case ( (charcode "+" ) ) {
                        i = i + 1
                        return 13
                    } 

                    case ( (charcode "-" ) ) {
                        i = i + 1
                        return 13
                    } 
                    
                    case ( (charcode "<" ) ) {
                        if (c2 == (charcode "=")) {
                            i = i + 2
                            return 11
                        }
                        i = i + 1
                        return 11
                    } 

                    case ( (charcode ">" ) ) {
                        if (c2 == (charcode "=")) {
                            i = i + 2
                            return 11
                        }
                        i = i + 1
                        return 11
                    } 

                    case ( (charcode "!" ) ) {
                        if (c2 == (charcode "=")) {
                            i = i + 2
                            return 10
                        }
                        return 0  ; currently negation not supported
                    } 
                    case ( (charcode "=" ) ) {
                        if (c2 == (charcode "=")) {
                            i = i + 2
                            return 10 ; == operator
                        }
                        i = i + 1
                        return 3  ; assigment operator
                    } 

                    case ( (charcode "&" ) ) {
                        if (c2 == (charcode "&")) {
                            i = i + 2
                            return 6 ; && operator
                        }
                        return 0 
                    } 

                    case ( (charcode "|" ) ) {
                        if (c2 == (charcode "|")) {
                            i = i + 2
                            return 5 ; && operator
                        }
                        return 0 
                    } 

                    default {

                    }

                }

                return 0 
            })

            (PublicMethod isOperator:int () {

                (def s:charbuffer (unwrap buff))

                if ( i - 2 > len ) {
                    return 0
                }

                def c:char (charAt s i)
                def c2:char (charAt s (+ i 1))

                switch c {

                    case ( (charcode "*" ) ) {
                        return 1
                    } 

                    case ( (charcode "/" ) ) {
                        return 14
                    } 

                    case ( (charcode "+" ) ) {
                        return 13
                    } 

                    case ( (charcode "-" ) ) {
                        return 13
                    } 
                    
                    case ( (charcode "<" ) ) {
                        if (c2 == (charcode "=")) {
                            return 11
                        }
                        return 11
                    } 

                    case ( (charcode ">" ) ) {
                        if (c2 == (charcode "=")) {
                            return 11
                        }
                        return 11
                    } 

                    case ( (charcode "!" ) ) {
                        if (c2 == (charcode "=")) {
                            return 10
                        }
                        return 0  ; currently negation not supported
                    } 
                    case ( (charcode "=" ) ) {
                        if (c2 == (charcode "=")) {
                            return 10 ; == operator
                        }
                        return 3  ; assigment operator
                    } 

                    case ( (charcode "&" ) ) {
                        if (c2 == (charcode "&")) {
                            return 6 ; && operator
                        }
                        return 0 
                    } 

                    case ( (charcode "|" ) ) {
                        if (c2 == (charcode "|")) {
                            return 5 ; && operator
                        }
                        return 0 
                    } 
                    default {

                    }
                }

                return 0 
            })
            

            (PublicMethod getOperatorPred:int (str:string)
                {

                    switch str {
                        case ( "<" ) {
                            return 11
                        }
                        case ( ">" ) {
                            return 11
                        }  
                        case ( "<=" ) {
                            return 11
                        }                         
                        case ( ">=" ) {
                            return 11
                        } 
                        case ( "==" ) {
                            return 10
                        }

                        case ( "!=" ) {
                            return 10
                        }                        
                        case ( "=" ) {
                            return 3
                        }                                                                        
                        case "&&" {
                            return 6
                        }
                        case "||" {
                            return 5
                        }                                                
                        case "+"  {
                            return 13
                        }

                        case "-"  {
                            return 13
                        }                        
                        case "*" {
                            return 14
                        }
                        case "/" {
                            return 14
                        }                        
                        default {

                        }
                    }                
                    return 0
                }
            )
            (PublicMethod insert_node:void (p_node@(strong lives):CodeNode) {

                def push_target@(weak lives):CodeNode curr_node

                if(curr_node.infix_operator) {
                    push_target = curr_node.infix_node
                    if(push_target.to_the_right) {
                        push_target = push_target.right_node
                        p_node.parent = push_target
                    }
                }
                push push_target.children p_node
    
            })      

            ( PublicMethod parse:void () (

                (def s:charbuffer (unwrap buff))

                @onError(
                    (if (!null? curr_node)
                        (
                            (def line_index:int (call curr_node getLine ()))     
                            (= line_index (call curr_node getLine ()))                           
                            (print (+ (call curr_node getFilename ()) " Line: " line_index))
                            (print "Parser error close to")
                            (print (call curr_node getLineString(line_index)))           

                            (= had_error true)         
                        )
                    )
                )

                (def c:char (charAt s 0))
                (def next_c:char 0)
                (def fc:char 0)

                (def new_node:CodeNode)

                (def sp:int 0)
                (def ep:int 0)

                (def last_i:int 0)
                (def had_lf:boolean false)

                (while (< i len)
                    (

                        (if had_error (break _))
                        ; (print i)
                        (= last_i i)

                        (def is_block_parent:boolean false)

                        (if had_lf 
                            (
                                (= had_lf false)
                                (this.end_expression())
                                (break _)
                            )
                        )

                        
                        (if (!null? curr_node) 
                            (

                                (if (!null? curr_node.parent)
                                    (
                                        (def nodeParent:CodeNode curr_node.parent)
                                        (if nodeParent.is_block_node (
                                            (= is_block_parent true)
                                        ))
                                    )
                                )
                            )
                        )
                        

                        ; comma expression
                        ; (|| (<= (charAt s i) 32 ) (== (charAt s i) (charcode ","))

                        ; original:         (<= (charAt s i) 32 ) )
                        ; new with comma:   (|| (<= (charAt s i) 32 ) (== (charAt s i) (charcode ",")))

                        (if (this.skip_space(is_block_parent)) {
                            break _
                        })

                        (= had_lf false)
                        (= c (charAt s i))

                        (if (< i len)
                            (
                                (= c (charAt s i))
                                (if (== c 59) 
                                (
                                    (= sp (+ i 1))
                                    ; read the comment
                                    (while ( && (< i len) 
                                                (> (charAt s i) 31 ) )
                                        (
                                            ; (print "-- comment --")
                                            (= i (+ 1 i))
                                        )
                                    )

                                    (if (i >= len)
                                        (break _)
                                    )

                                    (= new_node (new CodeNode((unwrap code) sp i)))
                                    (= new_node.value_type RangerNodeType.Comment) 
                                    (= new_node.string_value (substring s sp i))
                                    (push curr_node.comments (unwrap new_node))
                                    
                                    (continue _)
                                ))                                                            
                                
                                ; NEW S-EXPRESSION STARTS HERE!!!!!
                                (if (< i (- len 1))
                                    (
                                        (= fc (charAt s (+ i 1)))
                                        (if (||
                                                (== c 40)
                                                (== c (charcode "{"))               ; support also braces for now
                                                (&& (== c 39) (== fc 40) )
                                                (&& (== c 96) (== fc 40) ) )
                                        (
                                            ; (print "Found ( ")
                                            (= paren_cnt (+ paren_cnt 1))
                                            (if (null? curr_node)
                                                (
                                                    (= rootNode (new CodeNode((unwrap code) i i)))                                                    
                                                    (= curr_node rootNode)
                                                    (if (== c 96) (= curr_node.value_type RangerNodeType.Quasiliteral))
                                                    (if (== c 39) (= curr_node.value_type RangerNodeType.Literal))
                                                    (= curr_node.expression true)
                                                    (push parents (unwrap curr_node))
                                                    ; (print "-> new root node")
                                                )
                                                (
                                                    (def new_qnode@(lives):CodeNode (new CodeNode((unwrap code) i i)))
                                                    (if (== c 96) (= new_qnode.value_type RangerNodeType.Quasiliteral))
                                                    (if (== c 39) (= new_qnode.value_type RangerNodeType.Literal))                                                    
                                                    (= new_qnode.expression true)

                                                    (this.insert_node(new_qnode))
                                                    ; (push curr_node.children new_qnode)
                                                    (push parents new_qnode) ; lifetime?
                                                    (= curr_node new_qnode)
                                                    
                                                    ; (print "added a new child node")
                                                )
                                            )
                                            (if (== c (charcode "{"))
                                                (
                                                    ( = curr_node.is_block_node true )
                                                )
                                            )
                                            (= i (+ 1 i))
                                            (this.parse())
                                            (continue _)

                                        ))
                                    )
                                )

                                (= sp i)
                                (= ep i)
                                (= fc (charAt s i))

                                (if ( || ( && (== fc 45) (>= (charAt s (+ i 1)) 46) (<= (charAt s (+ i 1)) 57)   ) 
                                         ( && (>= fc 48) (<= fc 57)   ) )
                                (
                                    ; (print "Found number ")
                                    (def is_double:boolean false)
                                    (= sp i)
                                    (= i (+ 1 i))
                                    (= c (charAt s i))
                                    (while ( && (< i len) 
                                                ( || ( && (>= c 48) (<= c 57))
                                                    ;( == c (charcode "e"))
                                                    ;( == c (charcode "E"))
                                                    ( == c (charcode "."))
                                                    (&& (== i sp)
                                                        ( || ( == c (charcode "+"))
                                                             ( == c (charcode "-")) ) )
                                                    
                                                ) 
                                            )
                                        (
                                            (if ( == c (charcode "."))                                               
                                                (
                                                    (= is_double true)
                                                )
                                            )
                                            (= i (+ 1 i))
                                            (= c (charAt s i))
                                        )
                                    )
                                    (= ep i)

                                    (def new_num_node:CodeNode (new CodeNode((unwrap code) sp ep)))

                                    (if is_double
                                        (
                                            (= new_num_node.value_type RangerNodeType.Double) 
                                            (= new_num_node.double_value (unwrap (str2double (substring s sp ep))))
                                        )
                                        (
                                            (= new_num_node.value_type RangerNodeType.Integer) 
                                            (= new_num_node.int_value (unwrap (str2int (substring s sp ep))))    
                                        )
                                        
                                    )
                                    

                                    (this.insert_node(new_num_node))
                                    ; (push curr_node.children new_num_node)
                                    ; (print (call new_node getString ()))
                                    ; set type to number...
                                    (continue _ )
                                    
                                ))                        

                                ; if " then we have a string value
                                (if (== fc 34) 
                                    (
                                        ; (= i (+ i 1))
                                        (= sp (+ i 1))
                                        (= ep sp)                                    
                                        (= c (charAt s i))

                                        (def must_encode:boolean false)
                                        ; find the end of ""
                                        (while (< i len) 
                                            (
                                                (= i (+ 1 i))
                                                (= c (charAt s i))
                                                (if (== c 34)
                                                    (break _)
                                                )
                                                (if (== c 92) 
                                                    (   
                                                        ; escape character after \...
                                                        ; \"\"
                                                        (= i (+ 1 i))   
                                                        (if (< i len)
                                                            (
                                                                (= must_encode true)
                                                                (= c (charAt s i))
                                                            )
                                                            (break _)
                                                        )
                                                    )
                                                )
                                            )
                                        )                
                                        (= ep i)
                                        (if (< i len) 
                                            (
                                                (def encoded_str:string "")
                                                (if must_encode
                                                    (
        
                                                        (def orig_str:charbuffer (to_charbuffer (substring s sp ep)))
                                                        (def str_length:int (length orig_str))
                                                        (def ii:int 0)

                                                        ; a bit slow algorithm, could be improved much faster by copying
                                                        ; longer slices 
                                                        (while (< ii str_length)
                                                            (
                                                                (def cc:char (charAt orig_str ii))

                                                                (if (== cc 92) 
                                                                    (
                                                                        (def next_ch:char (charAt orig_str (+ ii 1)))
                                                                        (switch next_ch (
                                                                            (case 34 ( ( = encoded_str (+ encoded_str (strfromcode 34 ) ) ) ) )
                                                                            (case 92 ( ( = encoded_str (+ encoded_str (strfromcode 92 ) ) ) ) )
                                                                            (case 47 ( ( = encoded_str (+ encoded_str (strfromcode 47 ) ) ) ) )

                                                                            (case 98 
                                                                                ( = encoded_str (+ encoded_str (strfromcode 8 ) ) ) 
                                                                            )
                                                                            (case 102 
                                                                                ( = encoded_str (+ encoded_str (strfromcode 12 ) ) ) 
                                                                            )
                                                                            (case 110 
                                                                                (
                                                                                    ( = encoded_str (+ encoded_str (strfromcode 10 ) ) ) 
                                                                                )
                                                                                
                                                                            )
                                                                            (case 114 
                                                                                ( = encoded_str (+ encoded_str (strfromcode 13 ) ) ) 
                                                                            )
                                                                            (case 116 
                                                                                ( = encoded_str (+ encoded_str (strfromcode 9 ) ) ) 
                                                                            )
                                                                            (case 117 
                                                                                ( 
                                                                                    ;; \uxxxx
                                                                                    ;; then have to create UTF encoded string using the hex values
                                                                                    ;; TODO
                                                                                    ( = ii (+ ii 4)) ; 2 + 4
                                                                                ) 
                                                                            )
                                                                            (default ())
                                                                        )
                                                                        )
                                                                        ( = ii (+ ii 2))
                                                                    )
                                                                    (
                                                                        ; add normal char to the string
                                                                        ( = encoded_str (+ encoded_str (substring orig_str ii (+ 1 ii))))
                                                                        ( = ii (+ ii 1))
                                                                    )
                                                                )
                                                            )
                                                        )
                                                    )
                                                )

                                                (def new_str_node:CodeNode (new CodeNode((unwrap code) sp ep)))
                                                (= new_str_node.value_type RangerNodeType.String)

                                                (if must_encode
                                                    (= new_str_node.string_value encoded_str)
                                                    (= new_str_node.string_value (substring s sp ep))
                                                )

                                                (this.insert_node(new_str_node))
                                                ;(push curr_node.children new_str_node)

                                                ; (print (call new_node getString ()))
                                                ; set type to number...
                                                (= i (+ 1 i))
                                                (continue _ )
                                                
                                            )
                                        )                                
                                    )
                                ) ; if " " ends

                                ; test for true / false
                                (if (  && (== fc (charcode "t"))
                                        (== (charAt s (+ i 1)) (charcode "r"))
                                        (== (charAt s (+ i 2)) (charcode "u"))
                                        (== (charAt s (+ i 3)) (charcode "e")) )
                                    (

                                        (def new_true_node:CodeNode (new CodeNode((unwrap code) sp (+ sp 4))))
                                        (= new_true_node.value_type RangerNodeType.Boolean)
                                        (= new_true_node.boolean_value true)

                                        (this.insert_node(new_true_node))
                                        ; (push curr_node.children new_true_node)

                                        (= i (+ i 4))
                                        (continue _)
                                    )
                                )

                                (if (  && (== fc (charcode "f"))
                                        (== (charAt s (+ i 1)) (charcode "a"))
                                        (== (charAt s (+ i 2)) (charcode "l"))
                                        (== (charAt s (+ i 3)) (charcode "s"))
                                        (== (charAt s (+ i 4)) (charcode "e")) )
                                    (


                                        (def new_f_node:CodeNode (new CodeNode((unwrap code) sp (+ sp 5))))
                                        (= new_f_node.value_type RangerNodeType.Boolean)
                                        (= new_f_node.boolean_value false)

                                        (this.insert_node(new_f_node))
                                        ; (push curr_node.children new_f_node)

                                        (= i (+ i 5))
                                        (continue _)
                                    )
                                )

                                ; expression annotation...
                                ; @prop(true)
                                (if (== fc (charcode "@")) 
                                    (
                                        ; skip annotation mark and continue
                                        (= i (+ i 1))
                                        (= sp i)
                                        (= ep i)
                                        (= c (charAt s i))

                                        ; read the annontation element
                                        (while ( && (< i len) 
                                                    (> (charAt s i) 32 ) 
                                                    (!= c 40)
                                                    (!= c 41)
                                                    (!= c (charcode "}"))
                                                    
                                                )
                                            (
                                                ; (print (+ "char:" c))
                                                (= i (+ 1 i))
                                                (= c (charAt s i))
                                            )
                                        )                         
                                        (= ep i)

                                        (if (&& (< i len) (> ep sp) )
                                            (
                                                ; parse new expression as variable type
                                                (def a_node2@(lives):CodeNode (new CodeNode((unwrap code) sp ep)))
                                                (def a_name:string (substring s sp ep))

                                                (= a_node2.expression true)
                                                (= curr_node a_node2)

                                                (push parents a_node2)
                                                (= i (+ i 1))
                                                (= paren_cnt (+ paren_cnt 1))

                                                (this.parse())

                                                @todo("add get strong reference from array")
                                                ; the branching is mildly proglematic...
                                                (def use_first:boolean false)
                                                (if (== 1 (array_length a_node2.children))
                                                    (
                                                        (def ch1:CodeNode (itemAt a_node2.children 0))
                                                        (= use_first (ch1.isPrimitive()))
                                                    )
                                                )            
                                                (if use_first
                                                    (
                                                        (def theNode:CodeNode (array_extract a_node2.children 0))
                                                        (set curr_node.props a_name theNode)
                                                    )(
                                                        (set curr_node.props a_name a_node2)                                                        
                                                    )
                                                )    
                                                                           
                                                (push curr_node.prop_keys a_name)
                                                (continue _)

                                            )
                                        ) 
                                    )
                                )

                                ; collect namespaces like obj.foo.x into separate array
                                ; ["obj", "foo", "x"]
                                (def ns_list@(temp):[string])
                                (def last_ns:int i)
                                (def ns_cnt:int 1)  

                                (def vref_had_type_ann:boolean false)
                                (def vref_ann_node@(temp):CodeNode )
                                (def vref_end:int i)

                                ; collect the reference symbol.
                                ; change: if the parent node is a block node the reference is interpreted
                                ; as a new S-expression
                                (if ( && (< i len) 
                                            (> (charAt s i) 32 ) 
                                            (!= c 58)
                                            (!= c 40)
                                            (!= c 41)
                                            (!= c (charcode "}"))
                                            
                                        )
                                    (
                                        ; if reference symbol is observed in block node, make it a call immediately
                                        (if (== curr_node.is_block_node true)
                                            (
                                                (def new_expr_node:CodeNode (new CodeNode((unwrap code) sp ep)))
                                                (= new_expr_node.parent curr_node)
                                                (= new_expr_node.expression true)
                                                (push curr_node.children new_expr_node)
                                                (= curr_node new_expr_node)
                                                (push parents new_expr_node)
                                                (= paren_cnt (+ 1 paren_cnt))

                                                (this.parse())
                                                (continue _)
                                            )
                                        )
                                    )
                                )

                                ; op check

                                (def op_c:int 0)
                                (if (>= (array_length curr_node.children) 0)
                                    (
                                        (= op_c (this.getOperator()))
                                    )
                                )

                                (def last_was_newline:boolean false)
                                (if (> op_c 0)
                                    (
                                        ; (print "--> found operator !!!")
                                    )
                                    (
                                        (while ( && (< i len) 
                                                    (> (charAt s i) 32 ) 
                                                    (!= c 58)
                                                    (!= c 40)
                                                    (!= c 41)
                                                    (!= c (charcode "}"))
                                                    
                                                )
                                            (

                                                (if (> i sp) 
                                                    (
                                                        (def is_opchar:int (this.isOperator()))
                                                        (if (> is_opchar 0)
                                                            (
                                                                ; (print (+ "opchar around " (substring s last_ns (+ i 1))))
                                                                (break _)
                                                            )
                                                        )
                                                    )
                                                )
                                                
                                                ; (print (+ "char:" c))
                                                (= i (+ 1 i))
                                                (= c (charAt s i))

                                                (if ( || (== c 10) (== c 13))
                                                    (
                                                        (= last_was_newline true)
                                                        (break _)
                                                    )
                                                )                                                


                                                ; obj.
                                                (if (== c (charcode "."))
                                                    (
                                                        (push ns_list (substring s last_ns i))
                                                        (= last_ns (+ i 1))
                                                        (= ns_cnt (+ 1 ns_cnt))
                                                    )
                                                )

                                                (if ( && ( > i vref_end ) (== c (charcode "@")) )
                                                    (
                                                        (= vref_had_type_ann true)
                                                        (= vref_end i)
                                                        (= vref_ann_node (this.parse_raw_annotation ()))
                                                        ; (print "found annotation node")
                                                        (= c (charAt s i))
                                                        (break _)
                                                    )
                                                )                                        
                                            )
                                        )

                                    )
                                )
                                
                                (= ep i)

                                (if vref_had_type_ann
                                    (
                                        (= ep vref_end)
                                    )
                                )
                                (push ns_list (substring s last_ns ep))


                                ;(if (skip_space is_block_parent)
                                ;    (break _)
                                ;)           
                                ;(= c (charAt s i))                     

                                ; skip empty space
                                (= c (charAt s i)) 
                                (while ( && (< i len) 
                                            (<= c 32 )
                                            (== false last_was_newline) 
                                        )
                                    (                                        
                                        ; (print "-- space --")
                                        (= i (+ 1 i))
                                        (= c (charAt s i))

                                        ; no newlines allowed here...
                                        ; 
                                        (if (&& is_block_parent ( || (== c 10) (== c 13)))
                                            (       
                                                (= i (- i 1))
                                                (= c (charAt s i))
                                                (= had_lf true)
                                                (break _)      
                                            )
                                        )                           
                                    )
                                )          

                                ; : found, i:int or similar, variable type definition comes here
                                (if (== c 58)
                                    (
                                        ; (print "==> variable type")
                                        (= i (+ i 1))
                                        
                                        ; skip whitespace
                                        (while ( && (< i len) (<= (charAt s i) 32 ) ) (= i (+ 1 i)) )
                                        
                                        ; type definition start, end 
                                        (def vt_sp:int i)
                                        (def vt_ep:int i)

                                        (= c (charAt s i))

                                        ; if variable type is function declaration like
                                        ; (def f:(_:int(_:int _int)))
                                        (if (== c (charcode "("))
                                            (
                                                ; parse new expression as variable type
                                                (def a_node3@(lives):CodeNode (new CodeNode((unwrap code) sp ep)))
                                                (= a_node3.expression true)
                                                (= curr_node a_node3)

                                                (push parents a_node3)
                                                (= i (+ i 1))

                                                (this.parse())

                                                (def new_expr_node:CodeNode (new CodeNode((unwrap code) sp vt_ep)))
                                                (= new_expr_node.vref (substring s sp ep))
                                                (= new_expr_node.ns ns_list)
                                                (= new_expr_node.expression_value a_node3)               
                                                (= new_expr_node.value_type RangerNodeType.ExpressionType)   

                                                (if vref_had_type_ann 
                                                    (
                                                        (= new_expr_node.vref_annotation vref_ann_node)
                                                        (= new_expr_node.has_vref_annotation true)
                                                    )
                                                )
                                                (push curr_node.children new_expr_node)

                                                (continue _)

                                            )
                                        )

                                        (if (== c (charcode "["))
                                            (
                                                ; handle start of array
                                                (= i (+ i 1))
                                                (= vt_sp i)
                                                
                                                (def hash_sep:int 0)
                                                (def had_array_type_ann:boolean false)
                                                (= c (charAt s i))
                                                (while (&& (< i len) (> c 32)
                                                        (!= c 93) )
                                                        (
                                                            (= i (+ 1 i))
                                                            (= c (charAt s i))
                                                            (if (== c (charcode ":"))
                                                                (
                                                                    (= hash_sep i)
                                                                )
                                                            )

                                                            (if (== c (charcode "@"))
                                                                (
                                                                    (= had_array_type_ann true)
                                                                    (break _)
                                                                )
                                                            )                                                            
                                                        )
                                                )
                                                (= vt_ep i)
                                                (if (> hash_sep 0)
                                                    (
                                                        ; hash
                                                        ; (print "Found HASH type")
                                                        ; (print (substring s sp ep))
                                                        (= vt_ep i)
                                                        (def type_name:string (substring s (+ 1 hash_sep) vt_ep)) 
                                                        (def key_type_name:string (substring s vt_sp hash_sep)) 
                                                           
                                                        ; also add namespace....
                                                        (def new_hash_node:CodeNode (new CodeNode((unwrap code) sp vt_ep)))
                                                        (= new_hash_node.vref (substring s sp ep))
                                                        (= new_hash_node.ns ns_list)
                                                        (= new_hash_node.value_type RangerNodeType.Hash) 
                                                        
                                                        (= new_hash_node.array_type type_name)
                                                        (= new_hash_node.key_type key_type_name)

                                                        (if vref_had_type_ann 
                                                            (
                                                                (= new_hash_node.vref_annotation vref_ann_node)
                                                                (= new_hash_node.has_vref_annotation true)
                                                            )
                                                        )

                                                        (if had_array_type_ann
                                                            (
                                                                (def vann_hash:CodeNode (this.parse_raw_annotation ()))
                                                                (= new_hash_node.type_annotation vann_hash)
                                                                (= new_hash_node.has_type_annotation true)
                                                                (print "--> parsed HASH TYPE annotation")                                                                
                                                            )
                                                        )

                                                        (= new_hash_node.parent curr_node)
                                                        (push curr_node.children new_hash_node)
                                                        ; (print new_node.vref)
                                                        (= i (+ 1 i))
                                                        (continue _)

                                                    )
                                                    (
                                                        ; array
                                                        (= vt_ep i)
                                                        (def type_name:string (substring s vt_sp vt_ep))    
                                                        ; (print type_name)
                                                        ; also add namespace....
                                                        (def new_arr_node:CodeNode (new CodeNode((unwrap code) sp vt_ep)))
                                                        (= new_arr_node.vref (substring s sp ep))
                                                        (= new_arr_node.ns ns_list)
                                                        (= new_arr_node.value_type RangerNodeType.Array) 
                                                        
                                                        (= new_arr_node.array_type type_name)
                                                        (= new_arr_node.parent curr_node)
                                                        (push curr_node.children new_arr_node)


                                                        (if vref_had_type_ann 
                                                            (
                                                                (= new_arr_node.vref_annotation vref_ann_node)
                                                                (= new_arr_node.has_vref_annotation true)
                                                            )
                                                        )

                                                        (if had_array_type_ann
                                                            (
                                                                (def vann_arr:CodeNode (this.parse_raw_annotation ()))
                                                                (= new_arr_node.type_annotation vann_arr)
                                                                (= new_arr_node.has_type_annotation true)
                                                                (print "--> parsed ARRAY TYPE annotation")                                                                
                                                            )
                                                        )

                                                        (= i (+ 1 i))
                                                        (continue _)
                                                                
                                                   )
                                                )
                                            )
                                        )

                                        ; parse normal type like :int, :double etc.
                                        (def had_type_ann:boolean false)
                                        (while ( && (< i len) 
                                                    (> (charAt s i) 32 ) 
                                                    (!= c 58)
                                                    (!= c 40)
                                                    (!= c 41)
                                                    (!= c (charcode "}"))
                                                    (!= c (charcode ","))
                                                    
                                                )
                                            (
                                                ; (print (+ "char:" c))
                                                (= i (+ 1 i))
                                                (= c (charAt s i))

                                                (if (== c (charcode "@"))
                                                    (
                                                        (= had_type_ann true)
                                                        ;(= i (- i 1))
                                                        (break _)
                                                    )
                                                )
                                            )
                                        )                                        
                                        (if (< i len)
                                            (
                                                (= vt_ep i)
                                                (def type_name:string (substring s vt_sp vt_ep))    

                                                ; if current node is a block node then the expression will be the first child of
                                                ; a new S-expression

                                                ; also add namespace....
                                                (def new_ref_node:CodeNode (new CodeNode((unwrap code) sp ep)))
                                                (= new_ref_node.vref (substring s sp ep))
                                                (= new_ref_node.ns ns_list)
                                                (= new_ref_node.value_type RangerNodeType.VRef) 
                                                (= new_ref_node.type_name (substring s vt_sp vt_ep))
                                                (= new_ref_node.parent curr_node)

                                                (if vref_had_type_ann 
                                                    (
                                                        (= new_ref_node.vref_annotation vref_ann_node)
                                                        (= new_ref_node.has_vref_annotation true)
                                                    )
                                                )

                                                ; (print (+ "Found type " new_node.type_name))
                                                (push curr_node.children new_ref_node)
                                                (if had_type_ann
                                                    (
                                                        (def vann:CodeNode (this.parse_raw_annotation ()))
                                                        (= new_ref_node.type_annotation vann)
                                                        (= new_ref_node.has_type_annotation true)
                                                        ; (print "--> parsed TYPE annotation")
                                                    )
                                                )
                                                (continue _)
                                            )
                                        )                    
                                    )
                                    (
                                        ; variable without a type definition

                                        ; (= c (charAt s i))

                                        (if ( && (< i len) (> ep sp) )
                                            (
                                                (def new_vref_node:CodeNode (new CodeNode((unwrap code) sp ep)))
                                                (= new_vref_node.vref (substring s sp ep))
                                                (= new_vref_node.value_type RangerNodeType.VRef) 
                                                (= new_vref_node.ns ns_list)
                                                (= new_vref_node.parent curr_node)

                                                ; test if this is operator
                                                (def op_pred:int (this.getOperatorPred(new_vref_node.vref)))

                                                ; comma will stop the infix processing...

                                                (if (== new_vref_node.vref ",")
                                                    (
                                                        (= curr_node.infix_operator false)
                                                        (continue _)
                                                    )
                                                )                           

                                                ; TODO: check the IF below...
                                                (def pTarget@(weak):CodeNode curr_node)
                                                (if curr_node.infix_operator {
                                                    def iNode:CodeNode curr_node.infix_node
                                                    if (|| (> op_pred 0) (== iNode.to_the_right false) ) {
                                                        pTarget = iNode
                                                    } {
                                                        
                                                        def rn@(lives):CodeNode iNode.right_node
                                                        new_vref_node.parent = rn
                                                        pTarget = rn                                                        
                                                    }
                                                })

                                                (push pTarget.children new_vref_node)

                                                
                                                (if vref_had_type_ann
                                                    (
                                                        ; (def vann:CodeNode (this.parse_raw_annotation ()))
                                                        (= new_vref_node.vref_annotation vref_ann_node)
                                                        (= new_vref_node.has_vref_annotation true)
                                                        ; (print "--> had a normal vref annotation")
                                                        ; (print (substring s sp ep))
                                                    )
                                                )

                                                ; call operator consideration here, not implemented because it is hard if not impossible to determine
                                                ; if the expression is starting simply a new list or is it actually a call.
                                                (if ( || (== (charAt s (+ i 1)) (charcode "(") ) (== (charAt s (+ i 0)) (charcode "(")) )
                                                    (
                                                        (if ( && (== 0 op_pred) curr_node.infix_operator (== 1 (array_length curr_node.children)))    
                                                            (
                                                                ; TODO: consider options for call operator here.
                                                            )
                                                        )
                                                    )
                                                )


                                                (if ( || ( && (> op_pred 0) curr_node.infix_operator) ( && (> op_pred 0) (>= (array_length curr_node.children) 2) ) )    
                                                    (

                                                        ; assigment operator...
                                                        (if ( && (== op_pred 3) ( == 2 (array_length curr_node.children) ) )
                                                            (
                                                                ; just swap the first and second node...
                                                                (def n_ch:CodeNode (array_extract curr_node.children 0))
                                                                (push curr_node.children n_ch)

                                                            )
                                                            (

                                                                (if (== false curr_node.infix_operator)
                                                                    (
                                                                        ; (print "we should create a new infix_operator node right here...")
                                                                        (def if_node@(lives temp):CodeNode (new CodeNode((unwrap code) sp ep)))                                                                    
                                                                        (= curr_node.infix_node if_node)                                                                        
                                                                        (= curr_node.infix_operator true)
                                                                        (= if_node.infix_subnode true)

                                                                        (= curr_node.value_type RangerNodeType.NoType)
                                                                        (= curr_node.expression true)

                                                                        (= if_node.expression true)

                                                                        ; move the nodes to the infix node and use that node instead
                                                                        (def ch_cnt:int (array_length curr_node.children))
                                                                        (def ii:int 0)
                                                                        (def start_from:int (- ch_cnt 2))

                                                                        ; possible memory leak:
                                                                        (def keep_nodes:CodeNode (new CodeNode((unwrap code) sp ep)))
                                                                        (while (> ch_cnt 0)
                                                                            (
                                                                                (def n_ch:CodeNode (array_extract curr_node.children 0))
                                                                                (def p_target:CodeNode if_node)
                                                                                (if ( || (< ii start_from) n_ch.infix_subnode )
                                                                                    ( = p_target keep_nodes)
                                                                                )
                                                                                (push p_target.children n_ch)                                                                        
                                                                                (= ch_cnt (- ch_cnt 1))
                                                                                (= ii (+ 1 ii))
                                                                            )
                                                                        )
                                                                        (for keep_nodes.children keep:CodeNode i
                                                                            (
                                                                                (push curr_node.children keep)
                                                                            )
                                                                        )                                                                
                                                                        (push curr_node.children if_node)
                                                                    )
                                                                )

                                                                ; lives annotation removes the warnings...
                                                                (def ifNode@(lives):CodeNode curr_node.infix_node)

                                                                ; (print ( + "operator" new_vref_node.vref  " close to") )
                                                                ; (def c_line_index:int (call curr_node getLine ())) 
                                                                ; (print (call curr_node getLineString(c_line_index)))    
                                                                ; (print (+ "now has " (array_length curr_node.children) " nodes "))
                                                                

                                                                (def new_op_node:CodeNode (new CodeNode((unwrap code) sp ep)))
                                                                (= new_op_node.expression true)
                                                                (= new_op_node.parent ifNode)

                                                                (def until_index:int (- (array_length ifNode.children) 1))
                                                                (def to_right:boolean false)
                                                                (def just_continue:boolean false)

                                                                (if ( && (> ifNode.operator_pred 0) ( < ifNode.operator_pred op_pred) )
                                                                    (
                                                                        (= to_right true)
                                                                    )
                                                                )

                                                                (if ( && (> ifNode.operator_pred 0) ( > ifNode.operator_pred op_pred) )
                                                                    (
                                                                        (= ifNode.to_the_right false)
                                                                    )
                                                                )             

                                                                (if ( && (> ifNode.operator_pred 0) ( == ifNode.operator_pred op_pred) )
                                                                    (
                                                                        (= to_right ifNode.to_the_right)
                                                                    )
                                                                )       
        
                                                                (def opTarget:CodeNode ifNode)
                                                                (if to_right   
                                                                    (
                                                                        ; 3 * 4 + 5 * 7 
                                                                        (def op_node:CodeNode (array_extract ifNode.children until_index))
                                                                        (def last_value:CodeNode (array_extract ifNode.children (- until_index 1)))

                                                                        (push new_op_node.children op_node)
                                                                        (push new_op_node.children last_value)

                                                                    )
                                                                    (
                                                                        (if (== false just_continue)
                                                                            (
                                                                                (while (> until_index 0)
                                                                                    (
                                                                                        (def what_to_add:CodeNode (array_extract ifNode.children 0))
                                                                                        (push new_op_node.children what_to_add)
                                                                                        (= until_index (- until_index 1))
                                                                                    )
                                                                                )
                                                                            )
                                                                        )
                                                                    )
                                                                )
                                                                (if ( to_right || (== false just_continue) ) {
                                                                    push ifNode.children new_op_node
                                                                })

                                                                (if to_right {
                                                                    (= ifNode.right_node new_op_node)
                                                                    (= ifNode.to_the_right true)                                                                    
                                                                })

                                                                (= ifNode.operator_pred op_pred)
                                                                (continue _) 

                                                                
                                                            )
                                                        )



                                                    )
                                                )                                                
                                            
                                                (continue _) 
                                            )
                                        )                                                            
                                    )
                                )                      

                                (if ( || (== c 41) (== c (charcode "}")) )
                                (
                                    ; } is the same as newline and if we have { return "foobar" } it is required to end the current expression first
                                    (if (&& (== c (charcode "}"))  is_block_parent  ( > (array_length curr_node.children) 0) ) 
                                        (
                                            (this.end_expression())
                                        )
                                    )

                                    ; (print "Found ) ")
                                    (= i (+ 1 i))
                                    (= paren_cnt (- paren_cnt 1))
                                    (if (< paren_cnt 0) {
                                        ; was throwing exception here...
                                        break _
                                    })
   
                                    (removeLast parents)
                                    (if (!null? curr_node) 
                                        (= curr_node.ep i)
                                    )

                                    (if (> (array_length parents) 0)
                                        (
                                            (= curr_node (itemAt parents (- (array_length parents) 1 ) ))
                                        )
                                        (
                                            (= curr_node rootNode)
                                        )
                                    )
                                    (break _)
                                    
                                ))                                

                                (if (== last_i i)
                                    (= i (+ 1 i))                                
                                )
                            )
                        )

                    )
                )
                
            )
            }
        )
    )    

    
    
        
            
    