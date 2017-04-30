(
    (Import "CompilerGeneric.clj")

    (Enum DictNodeType:int
        (
            NoType
            Double
            Integer
            String
            Boolean
            Array
            Object
            Null
        )
    )
    ( CreateClass DictNode:void 
        (
            (def code:SourceCode)
            (def sp:int 0)
            (def ep:int 0)

            (def is_property:boolean false)
            (def is_property_value:boolean false)

            (def vref:string)
            (def value_type:int DictNodeType.NoType)

            (def double_value:double)
            (def string_value:string)
            (def boolean_value:boolean)
            (def object_value:DictNode)

            (def children:[DictNode])
            (def objects:[string:DictNode])
            (def keys:[string])

            (Constructor (source:SourceCode start:int end:int)
                (
                    (= sp start)
                    (= ep end)
                    (= code source)
                )
            )

            ( PublicMethod createEmptyObject:DictNode () (
                (def emptyCode:SourceCode (new SourceCode ("")))
                (def v:DictNode (new DictNode (emptyCode 0 0)))
                (= v.value_type DictNodeType.Object)
                (return v)
            ))

            ( PublicMethod addObject:DictNode (key:string) (
                (if (== value_type DictNodeType.Object)
                    (
                        (def p:DictNode (new DictNode (code 0 0)))                       
                        (def v:DictNode (new DictNode (code 0 0)))
                        (= p.value_type DictNodeType.Object)
                        (= p.vref key)
                        (= p.is_property true)
                        (= v.value_type DictNodeType.Object)
                        (= v.vref key)
                        (= v.is_property_value true)
                        (= p.object_value v)
                        (push keys key) 
                        (set objects key p)       

                        (return v)  
                    )
                )
            ))
            

            ( PublicMethod addString:void (key:string value:string) (
                (if (== value_type DictNodeType.Object)
                    (
                    
                        (def v:DictNode (new DictNode (code 0 0)))
                        (= v.string_value value)
                        (= v.value_type DictNodeType.String)
                        (= v.vref key)
                        (= v.is_property true)
                        (push keys key) 
                        (set objects key v)         
                    )
                )
            ))
            

            ( PublicMethod getDoubleAt:double (index:int) (
            
                (if (< index (array_length children))
                    (
                        (def k:DictNode (itemAt children index))
                        (return k.double_value)
                    )
                )
                (return 0)
            ))
            ;
            ( PublicMethod getDouble:double (key:string) (
                (if (has objects key)
                    (
                        (def k:DictNode (get objects key))
                        (return k.double_value)
                    )
                )
                (return 0)
            ))

            ( PublicMethod getStringAt:string (index:int) (
            
                (if (< index (array_length children))
                    (
                        (def k:DictNode (itemAt children index))
                        (return k.string_value)
                    )
                )
                (return "")
            ))
            ;
            ( PublicMethod getString:string (key:string) (
                (if (has objects key)
                    (
                        (def k:DictNode (get objects key))                     
                        (return k.string_value)
                    )
                )
                (return "")
            ))

            ( PublicMethod getArray:DictNode (key:string) (
                (if (has objects key)
                    (
                        (def obj:DictNode (get objects key))
                        (if obj.is_property
                            (return obj.object_value)
                        )
                    )
                )
                (return  (new DictNode ((new SourceCode ("")) 0 0) ))
            ))  

            ( PublicMethod getArrayAt:DictNode (index:int) (
                (if (< index (array_length children))
                    (
                        (def k:DictNode (itemAt children index))
                        (return k)
                    )
                )
                (return  (new DictNode ((new SourceCode ("")) 0 0) ))
            ))    

            ( PublicMethod getObject:DictNode (key:string) (
                (if (has objects key)
                    (
                        (def obj:DictNode (get objects key))
                        (if obj.is_property
                            (return obj.object_value)
                        )
                    )
                )
                (return  (new DictNode ((new SourceCode ("")) 0 0) ))
            ))  

            ( PublicMethod getObjectAt:DictNode (index:int) (

                (if (< index (array_length children))
                    (
                        (def k:DictNode (itemAt children index))
                        (return k)
                    )
                )
                (return  (new DictNode ((new SourceCode ("")) 0 0) ))
            ))                                  
            
            ( PublicMethod walk:void () (

                (if is_property
                    (
                        (if (== value_type DictNodeType.Null)
                            (print (+ vref " : null"))
                        )                
                        (if (== value_type DictNodeType.Double)
                            (print (+ vref " : " double_value))
                        )
                        (if (== value_type DictNodeType.String)
                            (print (+ vref " : " string_value))
                        )
                        (if (== value_type DictNodeType.Boolean)
                            (if boolean_value
                                (print (+ vref " : " "true"))
                                (print (+ vref " : " "false"))
                            )
                        )
                    )
                    (
                        (if (== value_type DictNodeType.Null)
                            (print "null")
                        )                
                        (if (== value_type DictNodeType.Double)
                            (print double_value)
                        )
                        (if (== value_type DictNodeType.String)
                            (print string_value)
                        )
                        (if (== value_type DictNodeType.Boolean)
                            (if boolean_value
                                (print "true")
                                (print "false")
                            )
                        )
                    )                    
                )


                (if (== value_type DictNodeType.Array)
                    (
                        (if is_property
                            (print (+ vref " : Array("))
                            (print "Array(")
                        )
                        (print (+ "child cnt == " (array_length children)))
                        (for children item:DictNode i 
                            (
                                (call item walk ())
                                (print ",")
                            )
                        )   
                        (print ")") 
                    )
                )

                (if (== value_type DictNodeType.Object)
                    (
                        ; (print (+ "obj child cnt == " (array_length children)))
                        (if is_property
                            (
                                (print (+ vref " : "))
                                (call object_value walk ())
                            )
                            (
                                (print "Object(")
                                (for keys key:string i 
                                    (
                                        (def item:DictNode (get objects key))
                                        (call item walk ())
                                        (print ",")
                                    )
                                ) 
                                (print ")") 
                            )
                        )
                              
                        
                    )
                )                

            ))

            ( PublicMethod stringify:string () (

                (if is_property
                    (
                        (if (== value_type DictNodeType.Null)
                            (return (+ (strfromcode 34) vref (strfromcode 34) ":null"))
                        )                
                        (if (== value_type DictNodeType.Double)
                            (return (+ (strfromcode 34) vref (strfromcode 34) ":" double_value))
                        )
                        (if (== value_type DictNodeType.String)
                            (return (+ (strfromcode 34) vref (strfromcode 34) ":" (strfromcode 34) string_value (strfromcode 34) ))
                        )
                        (if (== value_type DictNodeType.Boolean)
                            (if boolean_value
                                (return (+ (strfromcode 34) vref (strfromcode 34) ":" "true"))
                                (return (+ (strfromcode 34) vref (strfromcode 34) ":" "false"))
                            )
                        )
                    )
                    (
                        (if (== value_type DictNodeType.Null)
                            (return "null")
                        )                
                        (if (== value_type DictNodeType.Double)
                            (return ( + "" double_value) )
                        )
                        (if (== value_type DictNodeType.String)
                            (return ( + (strfromcode 34) string_value (strfromcode 34)))
                        )
                        (if (== value_type DictNodeType.Boolean)
                            (if boolean_value
                                (return "true")
                                (return "false")
                            )
                        )
                    )                    
                )


                (if (== value_type DictNodeType.Array)
                    (
                        (def str:string "")
                        (if is_property
                            (
                                (= str (+ (strfromcode 34) vref (strfromcode 34) ":["))                            
                            )
                            (
                                (= str "[")
                            )
                        )
                        (for children item:DictNode i 
                            (
                                (if (> i 0)
                                    (= str (+ str ","))
                                )
                                (= str (+ str (call item stringify ()) ))
                            )
                        )   
                        (= str (+ str "]"))
                        (return str)
                    )
                )

                (if (== value_type DictNodeType.Object)
                    (
                        (def str:string "")

                        (if is_property
                            (
                                (return (+ (strfromcode 34) vref (strfromcode 34) ":"
                                    (call object_value stringify ())
                                ))
                                
                            )
                            (
                                (= str "{")
                                (for keys key:string i 
                                    (
                                        (if (> i 0)
                                            (= str (+ str ","))
                                        )
                                        (def item:DictNode (get objects key))
                                        (= str ( + str (call item stringify ())))
                                    )
                                ) 
                                (= str (+ str "}"))
                                (return str) 
                            )
                        )                        
                        
                    )
                )       
                (return "")         

            ))


        )
    )
    
    
)