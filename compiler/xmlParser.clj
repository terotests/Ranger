(

    (Import "CompilerGeneric.clj")
    (Import "writer.clj")

    ; XML is good in expressing following strings:
    ; <div> info: <b>my name is <i>{name}</i> and </b> </div>
    ; e("div", " info: ", e("b", "my name is ", e("i", name), " and "), " ")
    ( CreateClass XMLNode:void 
        (
            (def code:SourceCode)
            (def sp:int 0)
            (def ep:int 0)

            (def vref:string)
            (def ns:[string])
            (def value_type:int RangerNodeType.NoType)
            (def double_value:double)
            (def string_value:string)
            (def int_value:int)
            (def boolean_value:boolean)
      
            (def children:[XMLNode])
            (def attrs:[XMLNode])

            (def parent:XMLNode)

            (Constructor (source:SourceCode start:int end:int)
                (
                    (= sp start)
                    (= ep end)
                    (= code source)
                )
            )

            ( PublicMethod getString:string () (
                (return (substring code.code sp ep))
            ))

            ( PublicMethod writeCode:void (wr:CodeWriter) (

                (if (== value_type RangerNodeType.XMLText)
                    (
                        (call wr out (string_value false) )                
                        (return 1)
                    )
                )

                (if (|| (null? vref) (== 0 (strlen vref) )  )
                    (
                        (return 1)
                    )
                )
                ; (print vref)
                (call wr out ("<" false) )
                (call wr out (vref false))

                (for attrs attr:XMLNode idx
                    (
                        (call wr out (" " false))
                        (call wr out ((+ attr.vref "=" (strfromcode 34) attr.string_value (strfromcode 34)) false ))
                    )
                )

                (if ( > (array_length children) 0 )
                    (
                        (call wr out (">" false) )
                        (for children item:XMLNode i 
                            (call item writeCode (wr))
                        )    
                        (call wr out ("</" false) )
                        (call wr out (vref false))
                        (call wr out (">" false) )
                    )
                    (
                        (call wr out ("/>" false) )
                    )
                )
            ))

            ( PublicMethod getCode:string () (

                (def wr:CodeWriter (new CodeWriter ()))

                (call this writeCode (wr))

                (return (call wr getCode ()))
            ))
            
            ( PublicMethod walk:void () (
                (if (== value_type RangerNodeType.Double)
                    (print "DOUBLE")
                )
                (print (substring code.code sp ep))

                (for attrs attr:XMLNode idx
                    (
                        (print (+ "attr " attr.vref " = " attr.string_value))
                    )
                )

                (for children item:XMLNode i 
                    (call item walk ())
                )    
            ))

        )
    )
    
    ( CreateClass XMLParser:void 
        (
            (def code:SourceCode)
            (def s:string)
            (def len:int)
            (def i:int 0)
            (def parents:[XMLNode])
            (def next:XMLNode)




            (def rootNode:XMLNode)
            (def curr_node:XMLNode)

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
            ( PublicMethod parse_attributes:boolean () 
                (
                    (def last_i:int 0)
                    (def do_break:boolean false)
                    (def attr_name:string "")

                    (def sp:int i)
                    (def ep:int i)
                    (def c:char)                    
                    (def cc1:char)
                    (def cc2:char)          


                    ; (print "attr parser cc1")
                    (= cc1 (charAt s i))
                    ; (print cc1)                                     

                    (while (< i len)
                        (                
                            (= last_i i)    
                            ; skip space
                            (while ( && (< i len) (<= (charAt s i) 32 ) )
                                 (= i (+ 1 i)) 
                            )  

                            (= cc1 (charAt s i))
                            (= cc2 (charAt s (+ i 1)))                   

                            ; (print "attr parser")
                            ; (print cc1)    

                            (if (== cc1 (charcode ">"))
                                (return do_break)
                            )     
                            (if (&& (== cc1 (charcode "/") (== cc2 (charcode ">"))))
                                (
                                    (= i (+ 2 i))
                                    (return true)
                                )
                            )  
                            ; attribute name starts
                            (= sp i)
                            (= ep i)
                            (= c (charAt s i))
                            ; TODO: not actually real XML tag name validation
                            (while ( && (< i len) 
                                        (||
                                            (&& (>= c 65) (<= c 90))   ; upper case alpha
                                            (&& (>= c 97) (<= c 122))  ; lower case alpha
                                            (&& (>= c 48) (<= c 57))  ; numbers
                                            (== c (charcode "_"))
                                            (== c (charcode "-"))  
                                        ) )   
                                (
                                    (= i (+ 1 i))
                                    (= c (charAt s i))
                                )
                            )  

                            (= i (- i 1))
                            
                            (def an_sp:int sp)
                            (def an_ep:int i)

                            ; (print (+ "attr now = " (substring s an_sp i)))

                            (= c (charAt s i))
                            ; skip until =
                            (while ( && (< i len) (!= c (charcode "=") ) )
                                (
                                    (= i (+ 1 i))
                                    (= c (charAt s i))
                                )
                            )                                

                            (if (== c (charcode "="))
                                (= i (+ 1 i))
                            )   
                            ; (print (+ "attr now 2 = " (substring s an_sp i)))

                            ; remove space
                            (while ( && (< i len) (<= (charAt s i) 32 ) )
                                 (= i (+ 1 i)) 
                            )                          

                            ; TODO: add lisp expression to attribute

                            (= c (charAt s i))
                            ; (print c)
                            (if (== c 34) ; "
                                (
                                    ; (print "found ''")
                                    
                                    (= i (+ i 1))
                                    (= sp i)
                                    (= ep i)                                    
                                    (= c (charAt s i))
                                    ; find the end of ""
                                    (while ( && (< i len) (!= c 34) )
                                        (
                                            (= i (+ 1 i))
                                            (= c (charAt s i))
                                        )
                                    )                
                                    (= ep i)
                                    (if (&& (< i len) (> ep sp))
                                        (
                                            (def new_attr:XMLNode (new XMLNode (code an_sp ep)))
                                            (= new_attr.value_type RangerNodeType.XMLAttr)
                                            ; (= new_attr.value_type RangerNodeType.String )
                                            ; name
                                            (= new_attr.vref (substring s an_sp an_ep))
                                            ; (print (+ "found attr  " (substring s an_sp an_ep) " = " (substring s sp ep)))
                                            ; value as string
                                            (= new_attr.string_value (substring s sp ep))

                                            (push curr_node.attrs new_attr)
                                        )
                                    )   
                                    (= i (+ 1 i))

                                )
                            )

                            (if (== last_i i)
                                (= i (+ 1 i))                                
                            )

                        ) ; while code ends
                    )
                    (return do_break)
                )
            )          

            ( PublicMethod parse:void () (


                (def c:char)
                (def next_c:char)
                (def fc:char)

                (def new_node:XMLNode)

                (def sp:int i)
                (def ep:int i)

                (def last_i:int 0)

                (def cc1:char)
                (def cc2:char)

                (while (< i len)
                    (
                        ; (print i)
                        (= last_i i)

                        ;(while ( && (< i len) 
                        ;            (<= (charAt s i) 32 ) )
                        ;       (
                                   ;(print "-- space --")
                        ;           (= i (+ 1 i))
                        ;       )
                        ;)

                        (= cc1 (charAt s i))
                        (= cc2 (charAt s (+ i 1)))

                        ; >
                        (if (== cc1 (charcode ">"))
                            (
                                (= i (+ i 1))
                                (= cc1 (charAt s i))
                                (= cc2 (charAt s (+ i 1)))    
                                (continue 1)
                            )                    
                        )

                        (if (&& (== (charcode "/") cc1) (== cc2 (charcode ">")))
                            (
                                (= tag_depth (- tag_depth 1))
                                (= i (+ i 2))
                                (continue 1)
                            )
                        )

                       (if (&& (== (charcode "<") cc1) (== cc2 (charcode "/")))
                            (
                                (= tag_depth (- tag_depth 1))
                                (= i (+ i 2))
                                ; tag ends
                                (= sp i)
                                (= ep i)
                                (= c (charAt s i))
                                ; fix still... just a test...
                                (while ( && (< i len) 
                                            (> c 32 ) 
                                            (!= c (charcode ">"))
                                        )
                                    (
                                        (= i (+ 1 i))
                                        (= c (charAt s i))
                                    )
                                )
                                (= ep i)

                                (removeLast parents)
                                (def p_cnt:int (array_length parents))
                                (def last_parent:DictNode (itemAt parents (- p_cnt 1)) )      
                                (= curr_node last_parent)                                      

                                ;(print (+ "...ends" (substring s sp ep) ))
;                                (print (substring s sp ep))     
                                (continue 1)               
                            )
                        )
                        ; new tag starts...
                        (if (== cc1 (charcode "<"))
                            (
                                (= i (+ i 1))
                                (= sp i)
                                (= ep i)
                                (= c (charAt s i))
                                ; fix still... just a test...
                                (while ( && (< i len) 
                                            (!= c (charcode ">")) 
                                            (||
                                                (&& (>= c 65) (<= c 90))   ; upper case alpha
                                                (&& (>= c 97) (<= c 122))  ; lower case alpha
                                                (&& (>= c 48) (<= c 57))  ; numbers
                                                (== c 95) ; _
                                                (== c 46) ; .
                                                (== c 64) ; @ )
                                            ) )   
                                    (
                                        (= i (+ 1 i))
                                        (= c (charAt s i))
                                    )
                                )

                                ; get tag                                
                                (= ep i)

                                (def new_tag:string (substring s sp ep))
                                ;(print "new tag:")
                                ;(print new_tag)

                                (def new_node:XMLNode (new XMLNode (code sp ep)))
                                (= new_node.vref new_tag)
                                (= new_node.value_type RangerNodeType.XMLNode)
                                (push parents new_node)

                                (if (null? curr_node)
                                    (
                                        (= curr_node new_node)
                                        (= rootNode new_node)
                                    )
                                    (
                                        (push curr_node.children new_node)
                                        (= curr_node new_node)
                                    )
                                )

                                (if (call this parse_attributes ())
                                    (
                                        ; tag ends immediately... return true
                                    )
                                )
                                (continue 1)
                            )                    
                        )

                        ; if nothing else, read the character data in the node
                        (if (!null? curr_node)
                            (                        
                                (= sp i)
                                (= ep i)
                                (= c (charAt s i))
                                ; fix still... just a test...
                                (while ( && (< i len) 
                                            ; spaces and newlines are supported in XML text
                                            ; (>= c 32 ) 
                                            (!= c (charcode "<"))
                                        )
                                    (
                                        (= i (+ 1 i))
                                        (= c (charAt s i))
                                    )
                                )
                                (= ep i)
                                (if (> ep sp)
                                    (
                                        (def new_node:XMLNode (new XMLNode (code sp ep)))
                                        (= new_node.string_value (substring s sp ep))
                                        (= new_node.value_type RangerNodeType.XMLText)                                       
                                        (push curr_node.children new_node)                                               
                                   )
                                )
                            )
                        )

                        (if (== last_i i)
                            (= i (+ 1 i))                                
                        )

                    )
                )
                ; (print  "Exit" )
            ))
        )
    )    

)