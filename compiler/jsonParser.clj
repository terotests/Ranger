(
    (Import "DictNode.clj")
    
    ( CreateClass JSONParser:void 
        (
            (def code:SourceCode)
            (def s:string)
            (def len:int)
            (def i:int 0)
            (def parents:[DictNode])
            (def next:DictNode)


            (def rootNode:DictNode)
            (def curr_node:DictNode)

            (def tag_depth:int 0)

            (Constructor (code_module:SourceCode )
                (
                    (= s code_module.code)
                    (= code code_module)
                    (= len (strlen code_module.code))
                )
            )  
            ( PublicMethod skip_space:int ()
                (
                        (while ( && (< i len) 
                                    (<= (charAt s i) 32 ) )
                               (
                                   (= i (+ 1 i))
                               )
                        )            
                        (return i)        
                )
            )
         

            ( PublicMethod parse:DictNode () (


                (def c:char)
                (def next_c:char)
                (def fc:char)

                (def new_node:DictNode)

                (def sp:int i)
                (def ep:int i)

                (def last_i:int 0)

                (def cc1:char)
                (def cc2:char)

                (while (< i len)
                    (
                        (= last_i i)
                        ; skip whitespace
                        (while ( && (< i len) (<= (charAt s i) 32 ) ) (= i (+ 1 i)) )

                        (= cc1 (charAt s i))

                        ; (print i)

                        (if (== cc1 (charcode "]"))
                            (
                                (removeLast parents)
                                ; if property value, remove property from stack
                                (if curr_node.is_property_value (removeLast parents) )

                                (def p_cnt:int (array_length parents))
                                (def last_parent:DictNode (itemAt parents (- p_cnt 1)) )
                                (= curr_node last_parent)
                        
                                (= i (+ i 1))
                                (continue _)

                            )
                        )                         

                        (if (== cc1 (charcode "}"))
                            (
                                (removeLast parents)
                                ; if property value, remove property from stack
                                (if curr_node.is_property_value (removeLast parents) )
                                
                                (def p_cnt:int (array_length parents))
                                (def last_parent:DictNode (itemAt parents (- p_cnt 1)) )
                                (= curr_node last_parent)
                        
                                (= i (+ i 1))
                                (continue _)

                            )
                        )                         

                        (if (== cc1 (charcode ",")) 
                            (
                                ; { "key" : "value", "key" : value }
                                ; (print "found comma... skipping it")
                                (= i (+ i 1))
                                (continue _)
                            )
                        )         

                        (if (== cc1 (charcode ":")) 
                            (
                                ; { "key" : "value", "key" : value }
                                ; (print "found :... skipping it")
                                (= i (+ i 1))
                                (continue _)
                            )
                        )                      
                        
                        (= fc cc1)


                        ; test for null
                        (if (  && (== fc (charcode "n"))
                                  (== (charAt s (+ i 1)) (charcode "u"))
                                  (== (charAt s (+ i 2)) (charcode "l"))
                                  (== (charAt s (+ i 3)) (charcode "l")) )
                            (

                                (if curr_node.is_property
                                    (
                                        ; (= new_node (new DictNode (code sp ep)))
                                        (= curr_node.value_type DictNodeType.Null) 

                                        (removeLast parents)
                                        (def p_cnt:int (array_length parents))
                                        (def last_parent:DictNode (itemAt parents (- p_cnt 1)) )      
                                        (= curr_node last_parent)                                      
                                    )
                                    (
                                        ; must be array then
                                        ; push new string object to array and continue
                                        (def new_attr:DictNode (new DictNode (code sp ep)))
                                        (= new_attr.value_type DictNodeType.Null)
                                        (push curr_node.children new_attr)
                                ))                                

                                (= i (+ i 4))
                                (continue _)
                            )
                        )                        

                        ; test for true / false
                        (if (  && (== fc (charcode "t"))
                                  (== (charAt s (+ i 1)) (charcode "r"))
                                  (== (charAt s (+ i 2)) (charcode "u"))
                                  (== (charAt s (+ i 3)) (charcode "e")) )
                            (

                                (if curr_node.is_property
                                    (
                                        ; (= new_node (new DictNode (code sp ep)))
                                        (= curr_node.value_type DictNodeType.Boolean) 
                                        (= curr_node.boolean_value true)

                                        (removeLast parents)
                                        (def p_cnt:int (array_length parents))
                                        (def last_parent:DictNode (itemAt parents (- p_cnt 1)) )      
                                        (= curr_node last_parent)                                      
                                    )
                                    (
                                        ; must be array then
                                        ; push new string object to array and continue
                                        (def new_attr:DictNode (new DictNode (code sp ep)))
                                        (= new_attr.value_type DictNodeType.Boolean)
                                        (= new_attr.boolean_value true)
                                        (push curr_node.children new_attr)
                                ))                                

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

                                (if curr_node.is_property
                                    (
                                        ; (= new_node (new DictNode (code sp ep)))
                                        (= curr_node.value_type DictNodeType.Boolean) 
                                        (= curr_node.boolean_value false)

                                        (removeLast parents)
                                        (def p_cnt:int (array_length parents))
                                        (def last_parent:DictNode (itemAt parents (- p_cnt 1)) )      
                                        (= curr_node last_parent)                                      
                                    )
                                    (
                                        ; must be array then
                                        ; push new string object to array and continue
                                        (def new_attr:DictNode (new DictNode (code sp ep)))
                                        (= new_attr.value_type DictNodeType.Boolean)
                                        (= new_attr.boolean_value false)
                                        (push curr_node.children new_attr)
                                ))                                

                                (= i (+ i 5))
                                (continue _)
                            )
                        )

                 

                        ; test for number...
                        
                        (if ( || ( && (== fc 45) (>= (charAt s (+ i 1)) 46) (<= (charAt s (+ i 1)) 57)   ) 
                                    ( && (>= fc 48) (<= fc 57)   ) )
                        (
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
                                    (= i (+ 1 i))
                                    (= c (charAt s i))
                                )
                            )
                            (= ep i)
                            (if curr_node.is_property
                                (
                                    ; (= new_node (new DictNode (code sp ep)))
                                    (= curr_node.value_type DictNodeType.Double) 
                                    (= curr_node.double_value (str2double (substring s sp ep)))

                                    (removeLast parents)
                                    (def p_cnt:int (array_length parents))
                                    (def last_parent:DictNode (itemAt parents (- p_cnt 1)) )      
                                    (= curr_node last_parent)                                      

                                    ; (= i (+ i 1))
                                    (continue _ )
                                )
                                (
                                    ; must be array then
                                    ; push new string object to array and continue
                                    (def new_attr:DictNode (new DictNode (code sp ep)))
                                    (= new_attr.value_type DictNodeType.Double)
                                    (= new_attr.double_value (str2double (substring s sp ep)))
                                    (push curr_node.children new_attr)

                                    ; (= i (+ i 1))
                                    (continue _)
                            ))
                            
                        ))                                    
                        
                        ; if " then either key or string value
                        (if (== cc1 34) ; "
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

                                                                    (case 98 ; b
                                                                        ( = encoded_str (+ encoded_str (strfromcode 8 ) ) ) 
                                                                    )
                                                                    (case 102 ; f
                                                                        ( = encoded_str (+ encoded_str (strfromcode 12 ) ) ) 
                                                                    )
                                                                    (case 110 ; n
                                                                        (
                                                                            ( = encoded_str (+ encoded_str (strfromcode 10 ) ) ) 
                                                                        )
                                                                        
                                                                    )
                                                                    (case 114 ; r
                                                                        ( = encoded_str (+ encoded_str (strfromcode 13 ) ) ) 
                                                                    )
                                                                    (case 116 ; t
                                                                        ( = encoded_str (+ encoded_str (strfromcode 9 ) ) ) 
                                                                    )
                                                                    (case 117 ; u 
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

                                        ; some kind of string was found...
                                        
                                        ; if currently at property set the property value & pop
                                        (if curr_node.is_property
                                            (
                                                ; set property value to string and pop parent
                                                (if must_encode
                                                    (= curr_node.string_value encoded_str)
                                                    (= curr_node.string_value (substring s sp ep))
                                                )
                                                (= curr_node.value_type DictNodeType.String)
                                                (removeLast parents)
                                                (def p_cnt:int (array_length parents))
                                                (def last_parent:DictNode (itemAt parents (- p_cnt 1)) )      
                                                (= curr_node last_parent)  

                                                (= i (+ i 1))
                                                (continue _)                                       
                                            )
                                        )

                                        (if ( == curr_node.value_type DictNodeType.Array )
                                            (
                                                ; push new string object to array and continue
                                                (def new_attr:DictNode (new DictNode (code sp ep)))
                                                (= new_attr.value_type DictNodeType.String)
                                                ; (= new_attr.string_value (substring s sp ep))
                                                (if must_encode
                                                    (= new_attr.string_value encoded_str)
                                                    (= new_attr.string_value (substring s sp ep))
                                                )
                                                (push curr_node.children new_attr)
                                                (= i (+ i 1))
                                                (continue _)
                                            )
                                        )           

                                        ; then it must be a key in a property
                                        (if ( == curr_node.value_type DictNodeType.Object )
                                            (
                                                ; create new property key and continue
                                                (def new_prop:DictNode (new DictNode (code sp ep)))
                                                (= new_prop.is_property true) 
                                                (= new_prop.vref (substring s sp ep))      
                                                ; (def objects:[string:DictNode])
                                                ; (def keys:[string])
                                                (push curr_node.keys new_prop.vref )
                                                (set curr_node.objects new_prop.vref new_prop)

                                                ; add to the and of parents array
                                                (push parents new_prop)       
                                                (= curr_node new_prop)
                                                (= i (+ i 1))
                                                (continue 1)                                   
                                            )
                                        )                                                                        

                                    )
                                )   
                            )
                        )

                        ; new object starts
                        (if (== cc1 (charcode "{"))
                            (

                                (def new_node:DictNode (new DictNode (code sp ep)))
                                (= new_node.value_type DictNodeType.Object)
                                (push parents new_node)

                                (if (null? curr_node)
                                    (
                                        (= curr_node new_node)
                                        (= rootNode new_node)
                                    )
                                    (
                                        ; object can be either part of array or property
                                        (if curr_node.is_property
                                            (
                                                ; if property, like { "visitor" : { ... } }

                                                (= curr_node.object_value new_node)
                                                (= curr_node.value_type DictNodeType.Object)
                                                (= new_node.value_type DictNodeType.Object)
                                                (= new_node.is_property_value true)

                                            )
                                            (
                                                ; must be array then...
                                                (push curr_node.children new_node)
                                            )
                                        )
                                        
                                        (= curr_node new_node)
                                    )
                                )                                
                                
                                (= i (+ i 1))
                             
                                (continue _)

                            )                    
                        )

                        (if (== cc1 (charcode "["))
                            (

                                (def new_node:DictNode (new DictNode (code sp ep)))
                                (= new_node.value_type DictNodeType.Array)
                                (push parents new_node)

                                (if (null? curr_node)
                                    (
                                        (= curr_node new_node)
                                        (= rootNode new_node)
                                    )
                                    (
                                        ; object can be either part of array or property
                                        (if curr_node.is_property
                                            (
                                                ; if property, like { "visitor" : { ... } }
                                                
                                                (= curr_node.object_value new_node)
                                                (= curr_node.value_type DictNodeType.Object)
                                                (= new_node.is_property_value true)

                                                
                                            )
                                            (
                                                ; must be array then...
                                                (push curr_node.children new_node)
                                            )
                                        )
                                        
                                        (= curr_node new_node)
                                    )
                                )                                
                                
                                (= i (+ i 1))
                             
                                (continue _)

                            )                    
                        )                        

                        (if (== last_i i)
                            (= i (+ 1 i))
                        )

                    )
                )
                (return rootNode)
            ))
        )
    )    

)