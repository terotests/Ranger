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
            (def parents:[CodeNode] @weak(true))
            (def next:CodeNode)

            (def paren_cnt:int 0)

            (def rootNode:CodeNode )
            (def curr_node:CodeNode @weak(true))
            
            (def had_error:boolean false)

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

            ( PublicMethod parse_raw_annotation:CodeNode ()
                (

                    (def c:char)
                    (def sp:int i)
                    (def ep:int i)
                    
                    ; skip annotation mark and continue
                    (= i (+ i 1))
                    (= sp i)
                    (= ep i)
                    (= c (charAt s i))

                    (if (< i len) 
                        (
                            ; parse new expression as variable type
                            (def a_node2:CodeNode (new CodeNode (code sp ep)))
                            (= a_node2.expression true)
                            (= curr_node a_node2)

                            (push parents a_node2)
                            (= i (+ i 1))
                            (= paren_cnt (+ paren_cnt 1))

                            (call this parse ())

                            (return a_node2)                       

                        )
                    ) 
                    
                )            
            )

            ( PublicMethod parse:void () (

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

                (def c:char)
                (def next_c:char)
                (def fc:char)

                (def new_node:CodeNode)

                (def sp:int i)
                (def ep:int i)

                (def last_i:int 0)

                (while (< i len)
                    (
                        (if had_error (break _))
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
                                    (push curr_node.comments new_node)
                                    
                                    (continue _)
                                ))                                                            
                                
                                (if (< i (- len 1))
                                    (
                                        (= fc (charAt s (+ i 1)))
                                        (if (||
                                                (== c 40)
                                                (&& (== c 39) (== fc 40) )
                                                (&& (== c 96) (== fc 40) ) )
                                        (
                                            ; (print "Found ( ")
                                            (= paren_cnt (+ paren_cnt 1))
                                            (if (null? curr_node)
                                                (
                                                    (= rootNode (new CodeNode (code i i)))                                                    
                                                    (= curr_node rootNode)
                                                    (if (== c 96) (= curr_node.value_type RangerNodeType.Quasiliteral))
                                                    (if (== c 39) (= curr_node.value_type RangerNodeType.Literal))
                                                    (= curr_node.expression true)
                                                    (push parents curr_node)
                                                    ; (print "-> new root node")
                                                )
                                                (
                                                    (def new_qnode (new CodeNode (code i i)))
                                                    (if (== c 96) (= new_qnode.value_type RangerNodeType.Quasiliteral))
                                                    (if (== c 39) (= new_qnode.value_type RangerNodeType.Literal))                                                    
                                                    (= new_qnode.expression true)
                                                    (push curr_node.children new_qnode)
                                                    (= curr_node new_qnode)
                                                    (push parents new_qnode)
                                                    ; (print "added a new child node")
                                                )
                                            )
                                            (= i (+ 1 i))
                                            (call this parse ())
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

                                    (def new_num_node (new CodeNode (code sp ep)))

                                    (if is_double
                                        (
                                            (= new_num_node.value_type RangerNodeType.Double) 
                                            (= new_num_node.double_value (str2double (substring s sp ep)))
                                        )
                                        (
                                            (= new_num_node.value_type RangerNodeType.Integer) 
                                            (= new_num_node.int_value (str2int (substring s sp ep)))    
                                        )
                                        
                                    )
                                    

                                    (push curr_node.children new_num_node)
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

                                                (def new_str_node (new CodeNode (code sp ep)))
                                                (= new_str_node.value_type RangerNodeType.String)

                                                (if must_encode
                                                    (= new_str_node.string_value encoded_str)
                                                    (= new_str_node.string_value (substring s sp ep))
                                                )

                                                (push curr_node.children new_str_node)
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

                                        (def new_true_node:CodeNode (new CodeNode (code sp (+ sp 4))))
                                        (= new_true_node.value_type RangerNodeType.Boolean)
                                        (= new_true_node.boolean_value true)

                                        (push curr_node.children new_true_node)

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


                                        (def new_f_node:CodeNode (new CodeNode (code sp (+ sp 5))))
                                        (= new_f_node.value_type RangerNodeType.Boolean)
                                        (= new_f_node.boolean_value false)

                                        (push curr_node.children new_f_node)

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
                                                (def a_node2:CodeNode (new CodeNode (code sp ep)))
                                                (def a_name:string (substring s sp ep))

                                                (= a_node2.expression true)
                                                (= curr_node a_node2)

                                                (push parents a_node2)
                                                (= i (+ i 1))
                                                (= paren_cnt (+ paren_cnt 1))

                                                (call this parse ())

                                                @todo("add get strong reference from array")
                                                ; the branching is mildly proglematic...
                                                (def use_first:boolean false)
                                                (if (== 1 (array_length a_node2.children))
                                                    (
                                                        (def ch1:CodeNode (itemAt a_node2.children 0))
                                                        (= use_first (call ch1 isPrimitive ()))
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
                                (def ns_list:[string])
                                (def last_ns:int i)
                                (def ns_cnt:int 1)  

                                (def vref_had_type_ann:boolean false)
                                (def vref_ann_node:CodeNode)
                                (def vref_end:int i)

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

                                        (if ( && ( > i vref_end ) (== c (charcode "@")) )
                                            (
                                                (= vref_had_type_ann true)
                                                (= vref_end i)
                                                (= vref_ann_node (call this parse_raw_annotation ()))
                                                (print "found annotation node")
                                                (= c (charAt s i))
                                                (break _)
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
                                                (def a_node3:CodeNode (new CodeNode (code sp ep)))
                                                (= a_node3.expression true)
                                                (= curr_node a_node3)

                                                (push parents a_node3)
                                                (= i (+ i 1))

                                                (call this parse ())

                                                (def new_expr_node (new CodeNode (code sp vt_ep)))
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
                                                        (def new_hash_node:CodeNode (new CodeNode (code sp vt_ep)))
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
                                                                (def vann_hash:CodeNode (call this parse_raw_annotation ()))
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
                                                        (def new_arr_node (new CodeNode (code sp vt_ep)))
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
                                                                (def vann_arr:CodeNode (call this parse_raw_annotation ()))
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

                                                ; also add namespace....
                                                (def new_ref_node:CodeNode (new CodeNode (code sp ep)))
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
                                                        (def vann:CodeNode (call this parse_raw_annotation ()))
                                                        (= new_ref_node.type_annotation vann)
                                                        (= new_ref_node.has_type_annotation true)
                                                        (print "--> parsed TYPE annotation")
                                                    )
                                                )
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
                                                (def new_vref_node:CodeNode (new CodeNode (code sp ep)))
                                                (= new_vref_node.vref (substring s sp ep))
                                                (= new_vref_node.value_type RangerNodeType.VRef) 
                                                (= new_vref_node.ns ns_list)
                                                (= new_vref_node.parent curr_node)
                                                (push curr_node.children new_vref_node)
                                                (if vref_had_type_ann
                                                    (
                                                        ; (def vann:CodeNode (call this parse_raw_annotation ()))
                                                        (= new_vref_node.vref_annotation vref_ann_node)
                                                        (= new_vref_node.has_vref_annotation true)
                                                        (print "--> had a normal vref annotation")
                                                        (print (substring s sp ep))
                                                    )
                                                )

                                            )
                                        )                                                            
                                    )
                                )                      





                                (if (== c 41)
                                (
                                    ; (print "Found ) ")
                                    (= i (+ 1 i))
                                    (= paren_cnt (- paren_cnt 1))
                                    (if (< paren_cnt 0)
                                        (throw "Parser error ) mismatch")
                                    )

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
    
        
    
        
            
    