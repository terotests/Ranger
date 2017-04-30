(

    ; import datatypes and writer
    (Import "CompilerGeneric.clj")
    (Import "writer.clj")

    ( CreateClass RangerLispParser:void 
        (
            (def code:SourceCode)
            (def s:string)
            (def len:int)
            (def i:int 0)
            (def parents:[CodeNode])
            (def next:CodeNode)

            (def rootNode:CodeNode)
            (def curr_node:CodeNode)

            (Constructor (code_module:SourceCode )
                (
                    (= s code_module.code)
                    (= code code_module)
                    (= len (strlen code_module.code))
                )
            )    

            ( PublicMethod getCode:string () (
                (return (call rootNode getCode ()))
            ))        

            ( PublicMethod parse:void () (

                (def c:char)
                (def next_c:char)
                (def fc:char)

                (def new_node:CodeNode)

                (def sp:int i)
                (def ep:int i)

                (def last_i:int 0)

                (while (< i len)
                    (
                        ; (print i)
                        (= last_i i)
                        (while ( && (< i len) 
                                    (<= (charAt s i) 32 ) )
                               (
                                   ; (print "-- space --")
                                   (= i (+ 1 i))
                               )
                        )
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

                                    (= new_node (new CodeNode (code sp i)))
                                    (= new_node.value_type RangerNodeType.Comment) 
                                    (= new_node.string_value (substring s sp i))
                                    (push curr_node.children new_node)
                                    
                                    (continue _)
                                ))                                                            
                                
                                (if (== c 40)
                                (
                                    ; (print "Found ( ")
                                    (if (null? curr_node)
                                        (
                                            (= curr_node (new CodeNode (code i i)))
                                            (= curr_node.expression true)
                                            (= rootNode curr_node)
                                            (push parents curr_node)
                                            ; (print "-> new root node")
                                        )
                                        (
                                            (= new_node (new CodeNode (code i i)))
                                            (= new_node.expression true)
                                            (push curr_node.children new_node)
                                            (= curr_node new_node)
                                            (push parents curr_node)
                                            ; (print "added a new child node")
                                        )
                                    )
                                    (= i (+ 1 i))
                                    (call this parse ())
                                    (continue _)

                                ))

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
                                                    ( == c (charcode "e"))
                                                    ( == c (charcode "E"))
                                                    ( == c (charcode "."))
                                                    ( == c (charcode "+"))
                                                    ( == c (charcode "-"))
                                                    
                                                ) 
                                            )
                                        (
                                            (if ( ||
                                                    ( == c (charcode "e"))
                                                    ( == c (charcode "E"))
                                                    ( == c (charcode "."))                                               
                                                )
                                                (
                                                    (= is_double true)
                                                )
                                            )
                                            (= i (+ 1 i))
                                            (= c (charAt s i))
                                        )
                                    )
                                    (= ep i)

                                    (= new_node (new CodeNode (code sp ep)))

                                    (if is_double
                                        (
                                            (= new_node.value_type RangerNodeType.Double) 
                                            (= new_node.double_value (str2double (substring s sp ep)))
                                        )
                                        (
                                            (= new_node.value_type RangerNodeType.Integer) 
                                            (= new_node.int_value (str2int (substring s sp ep)))    
                                        )
                                        
                                    )
                                    

                                    (push curr_node.children new_node)
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
        
                                                        (def orig_str:string (substring s sp ep))
                                                        (def str_length:int (strlen orig_str))
                                                        (def ii:int 0)

                                                        ; a bit slow algorithm, could be improved much faster by copying
                                                        ; longer slices 
                                                        (while (< ii str_length)
                                                            (
                                                                (def cc:char (charAt orig_str ii))

                                                                (if (== cc 92) 
                                                                    (
                                                                        (def next_ch:char (charAt orig_str (+ ii 1)))
                                                                        (switch next_ch
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

                                                (= new_node (new CodeNode (code sp ep)))
                                                (= new_node.value_type RangerNodeType.String)

                                                (if must_encode
                                                    (= new_node.string_value encoded_str)
                                                    (= new_node.string_value (substring s sp ep))
                                                )

                                                (push curr_node.children new_node)
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

                                        (= new_node (new CodeNode (code sp (+ sp 4))))
                                        (= new_node.value_type RangerNodeType.Boolean)
                                        (= new_node.boolean_value true)

                                        (push curr_node.children new_node)

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


                                        (= new_node (new CodeNode (code sp (+ sp 5))))
                                        (= new_node.value_type RangerNodeType.Boolean)
                                        (= new_node.boolean_value false)

                                        (push curr_node.children new_node)

                                        (= i (+ i 5))
                                        (continue _)
                                    )
                                )

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
                                                (def a_node:CodeNode (new CodeNode (code sp ep)))
                                                (def a_name:string (substring s sp ep))

                                                (= a_node.expression true)
                                                (= curr_node a_node)

                                                (push parents a_node)
                                                (= i (+ i 1))

                                                (call this parse ())

                                                ;(= new_node (new CodeNode (code sp vt_ep)))
                                                ;(= new_node.vref (substring s sp ep))
                                                ;(= new_node.ns ns_list)
                                                ;(= new_node.expression_value a_node)               
                                                ;(= new_node.value_type RangerNodeType.ExpressionType)      

                                                (if (== 1 (array_length a_node.children))
                                                    (
                                                        (def ch1:CodeNode (itemAt a_node.children 0))
                                                        (if (call ch1 isPrimitive ())
                                                            (
                                                                (set curr_node.props a_name ch1)
                                                            )
                                                            (
                                                                (set curr_node.props a_name a_node)
                                                            )
                                                        )

                                                    )
                                                    (
                                                        (set curr_node.props a_name a_node)
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
                                (def ns_list:[string])
                                (def last_ns:int i)
                                (def ns_cnt:int 1)  

                                (while ( && (< i len) 
                                            (> (charAt s i) 32 ) 
                                            (!= c 58)
                                            (!= c 40)
                                            (!= c 41)
                                        )
                                    (
                                        ; (print (+ "char:" c))
                                        (= i (+ 1 i))
                                        (= c (charAt s i))
                                        ; obj.
                                        (if (== c (charcode "."))
                                            (
                                                (push ns_list (substring s last_ns i))
                                                (= last_ns (+ i 1))
                                                (= ns_cnt (+ 1 ns_cnt))
                                            )
                                        )
                                    )
                                )
                                (push ns_list (substring s last_ns i))
                                (= ep i)

                                ; skip empty space
                                (while ( && (< i len) 
                                            (<= (charAt s i) 32 ) 
                                        )
                                    (
                                        ; (print "-- space --")
                                        (= i (+ 1 i))
                                        (= c (charAt s i))
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
                                                (def a_node:CodeNode (new CodeNode (code sp ep)))
                                                (= a_node.expression true)
                                                (= curr_node a_node)

                                                (push parents a_node)
                                                (= i (+ i 1))

                                                (call this parse ())

                                                (= new_node (new CodeNode (code sp vt_ep)))
                                                (= new_node.vref (substring s sp ep))
                                                (= new_node.ns ns_list)
                                                (= new_node.expression_value a_node)               
                                                (= new_node.value_type RangerNodeType.ExpressionType)                                                 

                                                (push curr_node.children new_node)

                                                (continue _)

                                            )
                                        )

                                        (if (== c (charcode "["))
                                            (
                                                ; handle start of array
                                                (= i (+ i 1))
                                                (= vt_sp i)
                                                
                                                (def hash_sep:int 0)
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
                                                        (= new_node (new CodeNode (code sp vt_ep)))
                                                        (= new_node.vref (substring s sp ep))
                                                        (= new_node.ns ns_list)
                                                        (= new_node.value_type RangerNodeType.Hash) 
                                                        
                                                        (= new_node.array_type type_name)
                                                        (= new_node.key_type key_type_name)

                                                        (= new_node.parent curr_node)
                                                        (push curr_node.children new_node)
                                                        ; (print new_node.vref)
                                                        (= i (+ 1 i))
                                                        (continue _)

                                                    )
                                                    (
                                                        ; array
                                                        ; (print "Found ARRAY type")
                                                        (= vt_ep i)
                                                        (def type_name:string (substring s vt_sp vt_ep))    

                                                        ; also add namespace....
                                                        (= new_node (new CodeNode (code sp vt_ep)))
                                                        (= new_node.vref (substring s sp ep))
                                                        (= new_node.ns ns_list)
                                                        (= new_node.value_type RangerNodeType.Array) 
                                                        
                                                        (= new_node.array_type type_name)
                                                        (= new_node.parent curr_node)
                                                        (push curr_node.children new_node)

                                                        (= i (+ 1 i))
                                                        (continue _)
                                                                
                                                   )
                                                )
                                            )
                                        )

                                        ; parse normal type like :int, :double etc.
                                        (while ( && (< i len) 
                                                    (> (charAt s i) 32 ) 
                                                    (!= c 58)
                                                    (!= c 40)
                                                    (!= c 41)
                                                )
                                            (
                                                ; (print (+ "char:" c))
                                                (= i (+ 1 i))
                                                (= c (charAt s i))
                                            )
                                        )                                        
                                        (if (< i len)
                                            (
                                                (= vt_ep i)
                                                (def type_name:string (substring s vt_sp vt_ep))    

                                                ; also add namespace....
                                                (= new_node (new CodeNode (code sp ep)))
                                                (= new_node.vref (substring s sp ep))
                                                (= new_node.ns ns_list)
                                                (= new_node.value_type RangerNodeType.VRef) 
                                                (= new_node.type_name (substring s vt_sp vt_ep))
                                                (= new_node.parent curr_node)
                                                ; (print (+ "Found type " new_node.type_name))
                                                (push curr_node.children new_node)
                                                (continue _)
                                            )
                                        )                    
                                    )
                                    (
                                        ; variable without a type definition
                                        ; TODO: add namespace parsing here for
                                        ; types like obj.foo.x
                                        (if ( && (< i len) (> ep sp) )
                                            (
                                                (= new_node (new CodeNode (code sp ep)))
                                                (= new_node.vref (substring s sp ep))
                                                (= new_node.value_type RangerNodeType.VRef) 
                                                (= new_node.ns ns_list)
                                                (= new_node.parent curr_node)
                                                (push curr_node.children new_node)

                                            )
                                        )                                                            
                                    )
                                )                      





                                (if (== c 41)
                                (
                                    ; (print "Found ) ")
                                    (= i (+ 1 i))
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
                
            ))
        )
    )    


)
    
        
    
        
            
    