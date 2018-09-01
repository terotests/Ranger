(
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

    (class SourceCode {
        def code:string ""
        def sp:int 0 
        def ep:int 0

        (Constructor (code_str:string ) {
            code = code_str
        })
    })

    ; XML is good in expressing following strings:
    ; <div> info: <b>my name is <i>{name}</i> and </b> </div>
    ; e("div", " info: ", e("b", "my name is ", e("i", name), " and "), " ")
    ( CreateClass XMLNode:void 
        (
            (def code:SourceCode)
            (def sp:int 0)
            (def ep:int 0)

            (def vref:string "")
            (def ns:[string])
            (def value_type:RangerNodeType RangerNodeType.NoType)
            (def double_value:double)
            (def string_value:string "")
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

            ( PublicMethod walk:void () (
                (if (== value_type RangerNodeType.Double)
                    (print "DOUBLE")
                )
                (print (substring code.code sp ep))

                (for attrs attr:XMLNode idx
                    (
                        (print ("attr[" + idx + "] "+ attr.vref + " = " + attr.string_value))
                    )
                )

                (for children item:XMLNode i 
                    (item.walk ())
                )    
            ))

        )
    )
    
    ( CreateClass XMLParser:void  {
            (def code:SourceCode)
            (def buff:charbuffer)
            (def len:int 0)
            (def i:int 0)
            (def parents@(weak):[XMLNode])
            (def next:XMLNode)

            (def rootNode:XMLNode)
            (def last_parent_safe:XMLNode)
            (def curr_node@(weak):XMLNode)

            (def tag_depth:int 0)

            (Constructor (code_module:SourceCode )
                (
                    (= buff (to_charbuffer code_module.code))
                    (= code code_module)
                    (= len (length (unwrap buff)))
                )
            )  

            sfn theMain@(main):void () {

                print "Hello World"
                def read_code:string (unwrap (read_file "." "testCode.xml") )

                ; def read_code:string "<div><span class=\"foobar\">Hello</span></div>"
                def the_code:SourceCode (new SourceCode(  read_code ))
                
                def p:XMLParser (new XMLParser(the_code))
                timer "Time for parsing the code:" {
                    p.parse()
                }

                def rn:XMLNode (unwrap p.rootNode)
                rn.walk()
                print("--- done --- ")
            
            }

            

            ( PublicMethod parse_attributes:boolean () {
                
                    (def s:charbuffer (unwrap buff))
                    (def last_i:int 0)
                    (def do_break:boolean false)
                    (def attr_name:string "")

                    (def sp:int i)
                    (def ep:int i)
                    (def c:char 0)                    
                    (def cc1:char 0)
                    (def cc2:char 0)          


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

                            (if (i >= len) (break _) )

                            (if (== cc1 (charcode ">")) {
                                return do_break
                            })     
                            (if (&& (== cc1 (charcode "/") ) (== cc2 (charcode ">")))
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
                            (if (i >= len) (break _) )

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
                                            (def new_attr:XMLNode (new XMLNode( (unwrap code) an_sp ep)))
                                            (= new_attr.value_type RangerNodeType.XMLAttr)
                                            ; (= new_attr.value_type RangerNodeType.String )
                                            ; name
                                            (= new_attr.vref (substring s an_sp (an_ep + 1)))
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
                    return do_break
            })          

            ( PublicMethod parse:void () (

                (def s:charbuffer (unwrap buff))

                (def c:char 0)
                (def next_c:char 0)
                (def fc:char 0)

                (def new_node:XMLNode)

                (def sp:int i)
                (def ep:int i)

                (def last_i:int 0)

                (def cc1:char 0)
                (def cc2:char 0)

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

                        (if (i >= (len - 1)) (break _) )

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

                        (if (i >= len ) (break _) )                        

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
                                (if (== 0 p_cnt)
                                    (break _)
                                )
                                (def last_parent:XMLNode (itemAt parents (- p_cnt 1)) )      
                                (= last_parent_safe last_parent)
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

                                (if (null? curr_node)
                                    (
                                        (def new_rnode:XMLNode (new XMLNode( (unwrap code) sp ep)))
                                        (= new_rnode.vref new_tag)
                                        (= new_rnode.value_type RangerNodeType.XMLNode)
                                        (= rootNode new_rnode)

                                        (push parents new_rnode)                                        
                                        (= curr_node new_rnode)
                                    )
                                    (
                                        (def new_node:XMLNode (new XMLNode( (unwrap code) sp ep)))
                                        (= new_node.vref new_tag)
                                        (= new_node.value_type RangerNodeType.XMLNode)
                                        (push curr_node.children new_node)

                                        (push parents new_node)                                        
                                        (= curr_node new_node)
                                    )
                                )

                                (if ( this.parse_attributes ())
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
                                        (def new_node:XMLNode (new XMLNode( (unwrap code) sp ep)))
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
    }
    )    

)