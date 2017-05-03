(
    (Import "writer.clj")
    (Import "RangerAppWriterContext.clj")
    (Import "parser.clj")
    ; Small TODO list:
    ; - try... catch missing

    ( CreateClass RangerCommonWriter 
        (

            (PublicMethod getWriterLang:string ()
                (
                    (return "common")
                )
            )    

            (PublicMethod EncodeString:string (orig_str:string)
                (
                    (def encoded_str:string "")
                    (def str_length:int (strlen orig_str))
                    (def ii:int 0)

                    ; a bit slow algorithm, could be improved much faster by copying
                    ; longer slices 
                    (while (< ii str_length)
                        (
                            (def cc:char (charAt orig_str ii))

                            (switch cc
                                (case 8 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 98 ) ) ) 
                                )    
                                (case 9 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 116 ) ) ) 
                                )    
                                (case 10 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 110 ) ) ) 
                                )    
                                (case 12 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 102 ) ) ) 
                                )    
                                (case 13 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 114 ) ) ) 
                                )

                                (case 34 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 34 ) ) ) 
                                )  
                                (case 92 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 92 ) ) ) 
                                )
                                (case 47 
                                    ( = encoded_str (+ encoded_str (strfromcode 92 ) (strfromcode 47 ) ) ) 
                                )                                    
                                    
                                (default
                                    ( = encoded_str (+ encoded_str (strfromcode cc) ) ) 
                                )
                            )   
                            (= ii (+ 1 ii))
                        )
                    )
                    (return encoded_str)   
                )
            )

            ; (def definedEnums:[string:RangerAppEnum])
            (PublicMethod cmdEnum:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def fNameNode:CodeNode (itemAt node.children 1))
                    (def enumList:CodeNode (itemAt node.children 2))
                    (def new_enum:RangerAppEnum (new RangerAppEnum ()))

                    (for enumList.children item:CodeNode i
                        (
                            (call new_enum add (item.vref))
                        )
                    )
                    (set ctx.definedEnums fNameNode.vref new_enum)
                )
            )

            (PublicMethod findParamDesc:RangerAppParamDesc (obj:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (

                    (def varDesc:RangerAppParamDesc)    
                    ; (print "findParamDesc")
                    (if (== obj.vref (getThisName _))
                        (
                            ; call to "this"
                            (= varDesc (new RangerAppParamDesc ()))
                            ; TODO: set the this variable description 
                            (return varDesc)
                        )
                        (
                            ; reference of type obj.foo
                            (if (> (array_length obj.ns) 1)
                                (
                                    ; (print "--> has ns")
                                    (def cnt:int (array_length obj.ns))
                                    (def classRefDesc:RangerAppParamDesc)                                        

                                    (for obj.ns strname:string i
                                        (if (== i 0)
                                            (
                                                (= classRefDesc (call ctx getVariableDef (strname)))   
                                                (if (null? classRefDesc)
                                                    (
                                                        (call ctx addError (obj ( + "Error, no description for called object: " strname ) ))
                                                        (break _)
                                                    )
                                                )
                                                (def classDesc:RangerAppClassDesc)
                                                (= classDesc (call ctx findClass (classRefDesc.nameNode.type_name)))
                                                ; (print (+ " looking for class " classRefDesc.nameNode.type_name))                     
                                            )
                                            (
                                                ; TODO: consider if methods should be checed too
                                                (= varDesc (call classDesc findVariable (strname)))       
                                                ; (print (+ "ns variable type " varDesc.nameNode.type_name))                                                                                             
                                            )
                                        )                                        
                                    )
                                    (return varDesc)
                                    ; (= varDesc (call subCtx getVariableDef (obj.vref)))      
                                )
                            )

                            (= varDesc (call ctx getVariableDef (obj.vref)))
                            ; (= varDesc (call this findParamDesc (obj ctx wr)))
                            (if (!null? varDesc.nameNode)
                                (
                                    ; OK, here is what to expect:
                                    ; (print (+ varDesc.nameNode.vref ":" varDesc.nameNode.type_name) )
                                )
                                (
                                    (print (+ "findParamDesc : description not found for " obj.vref ))
                                    (if (!null? varDesc)
                                        (print (+ "Vardesc was found though..." varDesc.name))
                                    )
                                    (call ctx addError (obj ( + "Error, no description for called object: " obj.vref ) ))
                                )
                            )
                            (return varDesc)
                        )
                    )
                )
            )

            (PublicMethod validateEvalTypes:void (n1:CodeNode n2:CodeNode ctx:RangerAppWriterContext)
                (
                    ; (print (+ n1.eval_type_name " vs " n2.eval_type_name))
                    (if ( && (!= n1.eval_type RangerNodeType.NoType)
                             (!= n2.eval_type RangerNodeType.NoType) )
                        (
                            ; (print "had eval def")
                            (if (== n1.eval_type_name n2.eval_type_name)
                                (
                                    ; positively evaluated assigment value...
                                    ; (print (+ "Equals == " n1.eval_type_name))
                                    ; (call ctx addError (node "OK assigment " ))

                                )
                                (
                                    ; check if this is int => enum
                                    (def b_ok:boolean false)
                                    (if ( && (call ctx isEnumDefined (n1.eval_type_name))
                                        ( == n2.eval_type_name "int") )
                                        (
                                            (= b_ok true)
                                        )
                                    )
                                    (if ( && (call ctx isEnumDefined (n2.eval_type_name))
                                        ( == n1.eval_type_name "int") )
                                        (
                                            (= b_ok true)
                                        )
                                    )                                    
                                    (if (== b_ok false)
                                        (call ctx addError (n1 ( + "Invalid assigment " n2.eval_type_name " => " n1.eval_type_name )))                                
                                    )
                                )
                            )
                        )
                    )           

                )
            )

            (PublicMethod cmdImport:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def fNameNode:CodeNode (itemAt node.children 1))
                    (def import_file:string fNameNode.string_value)

                    (if (has ctx.already_imported import_file)
                        (return false)
                        (
                            (set ctx.already_imported import_file true)
                        )
                    )

                    ; read the file contents
                    (def c:string (file_read "." import_file))                    
                    (def code:SourceCode (new SourceCode (c)))
                    (def parser:RangerLispParser (new RangerLispParser (code)))
                    (call parser parse ())

                    ; (def appCtx:RangerAppWriterContext (new RangerAppWriterContext()))
                    ; test using the JS writer
                    ; (def cwr:RangerJavaScriptWriter (new RangerJavaScriptWriter ()))
                    (def rnode:CodeNode parser.rootNode)
                    ; (def wr:CodeWriter (new CodeWriter ()))

                    (call this CollectMethods (rnode ctx wr))
                    (call this StartCodeWriting (rnode ctx wr))
        
                    (return true)
                )           
            )

            (PublicMethod CreateClass (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr out ("----Create class is not defined---- :(" true))
                )
            )

            (PublicMethod getThisName:string ()
                (
                    (return "this")
                )
            )

            (PublicMethod WriteThisVar:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr out ((getThisName _) false))
                )
            )

            (PublicMethod WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                   (if (== node.vref "_")
                       (return _)
                   )
                   ; test if vref is enum type
                   (def rootObjName:string (itemAt node.ns 0))
                   ; (print rootObjName)

                   (if (call ctx isEnumDefined (rootObjName))
                       (
                           (def enumName:string (itemAt node.ns 1))
                           (def e:RangerAppEnum (call ctx getEnum (rootObjName)))
                           (call wr out ((+ (get e.values enumName) "") false)) 
                           (return 1)
                       )
                   )

                   ; (print (+ "ns[0] = " rootObjName))
                   (if (call ctx isVarDefined (rootObjName))
                       (
                           (def vDef:RangerAppParamDesc (call ctx getVariableDef (rootObjName)))                            
                           ; (print (+ "=> Defined variable " rootObjName " type " vDef.value_type))
                           (if vDef.is_class_variable 
                                (
                                    ; (print "Is class variable")
                                    (call this WriteThisVar (node ctx wr))
                                    (call wr out ("." false))
                                    (call wr out ( node.vref false ))
                                    (return 1)
                                )
                            )

                            (= vDef (call this findParamDesc (node ctx wr)))        

                            (if (!null? vDef)
                                (
                                    (def vNameNode:CodeNode vDef.nameNode)
                                    (if ( && (!null? vNameNode) (!null? vNameNode.type_name) )
                                        (
                                            ; (if (== n1.eval_type_name n2.eval_type_name)
                                            (= node.eval_type RangerNodeType.VRef)
                                            (= node.eval_type_name vNameNode.type_name)                                    
                                        )
                                        ; (print (+ "type name: " vNameNode.type_name))                                    
                                        ; (print ( + "!!!!!!!!!!!!!!!!!!!!!!!!!!!! Had no type name : " rootObjName))
                                    )

                                )
                            )                        

                           ; is_class_variable
                       )
                       (
                            (def class_or_this:boolean (== rootObjName (getThisName _)))

                            (if (call ctx isDefinedClass (rootObjName))
                                (= class_or_this true)
                            )

                            (if class_or_this
                                (

                                )
                                (
                                    (def desc:RangerAppClassDesc (call ctx getCurrentClass ()))        
                                    (call ctx addError (node (+ "Undefined variable " rootObjName " in class " desc.name)))
                                )
                            )
                        
                            ; (print "-------==============")
                         
                       )
                   )

                   (call wr out ( node.vref false ))
                )
            )
            
            (PublicMethod Constructor (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                   
                   (def subCtx:RangerAppWriterContext (call ctx fork ()))

                   ; (call wr out ( node.vref false ))
                   (def cw:CodeWriter (call wr getTag ("constructor")))

                   (def cParams:CodeNode (itemAt node.children 1))

                   (for cParams.children cn:CodeNode i
                    (
                        (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                        (= p.name cn.vref)
                        (= p.value_type cn.value_type)
                        (= p.node cn)
                        (= p.nameNode cn)
                        (= p.is_optional false)
                        (call subCtx defineVariable (p.name p))                        
                    )
                   )

                   (def cBody:CodeNode (call node getThird ()))
                   (call ctx setInMethod ())
                   (call this WalkNode (cBody subCtx cw))
                   (call ctx unsetInMethod ())
                )
            )


            (PublicMethod WriteScalarValue (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (= node.eval_type node.value_type)
                    (switch node.value_type
                        (case RangerNodeType.Double
                            (
                                (call wr out ( ( + "" node.double_value ) false ))
                                (= node.eval_type_name "double")                    
                            )
                        )
                        (case RangerNodeType.String
                            (
                                (call wr out  ( (+ (strfromcode 34) (call this EncodeString (node.string_value)) (strfromcode 34)) false) )
                                (= node.eval_type_name "string")
                            )
                        )
                        (case RangerNodeType.Integer
                            (
                                (call wr out (( + "" node.int_value) false))
                                (= node.eval_type_name "int")
                            )
                        )
                        (case RangerNodeType.Boolean
                            (
                                (if node.boolean_value
                                    (call wr out ("true" false))
                                    (call wr out ("false" false))
                                )
                                (= node.eval_type_name "boolean")                                
                            )   
                        )       
                    )             
                )
            )

            ;( new ClassName (...params))
            (PublicMethod cmdNew:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (

                    (def obj:CodeNode (call node getSecond ()))
                    (def params:CodeNode (call node getThird ()))

                    ; might check if there are any required params etc...

                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )

                    (call wr out ("new " false))    
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    
                    (call wr out ("(" false))
                    (for params.children arg:CodeNode i
                        (
                            (if (> i 0)
                                (call wr out ("," false))
                            )
                            (call this WalkNode (arg ctx wr))
                        )
                    )
                    (call wr out (")" false))
                    (call ctx unsetInExpr ())
 
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                    (if ( == (call ctx expressionLevel ()) 0 )
                        (call wr newline ())
                    )

                    ; evaluated object type
                    (= node.eval_type RangerNodeType.Object)
                    (= node.eval_type_name obj.vref)

                )
            )


            ; test if this expression is a call...
            (PublicMethod cmdLocalCall:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def fnNode:CodeNode (call node getFirst ()))
                    (def desc:RangerAppClassDesc (call ctx getCurrentClass ()))    

                    (if (call desc hasMethod (fnNode.vref))
                        (


                            (def subCtx:RangerAppWriterContext (call ctx fork ()))

                            (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                            (= p.name fnNode.vref)
                            (= p.value_type fnNode.value_type)
                            (= p.node fnNode)
                            (= p.nameNode fnNode)
                            (call subCtx defineVariable (p.name p))     
                            
                            (call subCtx setInExpr ())
                            (call this WriteThisVar (fnNode subCtx wr))
                            (call wr out ("." false))
                            (call this WalkNode (fnNode subCtx wr))                            
                            (call wr out ("(" false))

                            (for node.children arg:CodeNode i
                                (
                                    (if (< i 1)
                                        (continue _)
                                    )                                    
                                    (if (> i 1)
                                        (call wr out ("," false))
                                    )
                                    (call this WalkNode (arg subCtx wr))
                                )
                            )

                            (call wr out (")" false))
                            (call ctx unsetInExpr ())
                            (if ( == (call ctx expressionLevel ()) 0 )
                                (call wr newline ())
                            )

                            (return true)
                        )
                        (
                            (return false)
                        )
                    )     
                    (return false)
                )
            )            

            (PublicMethod cmdCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
                    (def method:CodeNode (call node getThird ()))

                    (def subCtx:RangerAppWriterContext (call ctx fork ()))

                    (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                    (= p.name method.vref)
                    (= p.value_type method.value_type)
                    (= p.node method)
                    (= p.nameNode method)
                    (call subCtx defineVariable (p.name p))     

                    ; what is the object to be called ? 
                    (def varDesc:RangerAppParamDesc)

                    (if (== obj.vref (getThisName _))
                        (
                            ; call to "this"
                        )
                        (
                            ; (= varDesc (call subCtx getVariableDef (obj.vref)))
                            (= varDesc (call this findParamDesc (obj subCtx wr)))

                            (if (!null? varDesc)
                                (
                                    ; OK, here is what to expect:
                                    ; (print (+ varDesc.nameNode.vref ":" varDesc.nameNode.type_name) )
                                )
                                (
                                    (print (+ "description not found for " obj.vref ))
                                    (if (!null? varDesc)
                                        (print (+ "Vardesc was found though..." varDesc.name))
                                    )
                                    (call ctx addError (obj ( + "Error, no description for called object: " obj.vref ) ))
                                )
                            )

                        )
                    )

                    ; (print varDesc.node)
                    ; might check if there are any required params etc...

                    (if ( == (call subCtx expressionLevel ()) 0 )
                        (call wr newline ())
                    )

                    (if ( > (call subCtx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )

                    (if (> (array_length node.children) 3)
                        (
                            (def params:CodeNode (itemAt node.children (3)))
                            (call subCtx setInExpr ())
                            (call this WalkNode (obj subCtx wr))
                            (call wr out ("." false))
                            (call this WalkNode (method subCtx wr))
                            
                            (call wr out ("(" false))
                            (for params.children arg:CodeNode i
                                (
                                    ; (if ( == arg.value_type RangerNodeType.NoType)
                                    ;     (call ctx addError (arg ( + "No value defined for argument " arg.vref ) ))
                                    ; )
                                    (if (> i 0)
                                        (call wr out ("," false))
                                    )
                                    (call this WalkNode (arg subCtx wr))
                                )
                            )
                            (call wr out (")" false))
                            (call subCtx unsetInExpr ())
                        )
                        (
                            (call subCtx setInExpr ())
                            (call this WalkNode (obj subCtx wr))
                            (call wr out ("." false))
                            (call this WalkNode (method subCtx wr))
                            
                            (call wr out ("()" false))
                            
                            (call subCtx unsetInExpr ())
                        )
                    )

                    (if ( > (call subCtx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                    (if ( == (call subCtx expressionLevel ()) 0 )
                        (call wr newline ())
                    )

                )
            )

            (PublicMethod cmdJoin:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))

                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (".join(" false))
                    (call this WalkNode (n2 ctx wr))
                    (call wr out (")" false))

                )
            )

            (PublicMethod cmdSplit:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))

                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (".split(" false))
                    (call this WalkNode (n2 ctx wr))
                    (call wr out (")" false))

                )
            )

            (PublicMethod cmdTrim:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (".trim()" false))
                )
            )

            (PublicMethod cmdStrlen:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (".length" false))
                )
            )

            (PublicMethod cmdSubstring:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (def start:CodeNode (itemAt node.children 2))
                    (def end:CodeNode (itemAt node.children 3))

                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call wr out (".substring(" false))
                    (call this WalkNode (start ctx wr))
                    (call wr out (", " false))
                    (call this WalkNode (end ctx wr))
                    (call wr out (")" false))
                    (call ctx unsetInExpr ())
                )
            )

            ; getting the character code for some 
            (PublicMethod cmdCharcode:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))

                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call wr out (".charCodeAt(0)" false))
                    (call ctx unsetInExpr ())
                    
                )
            )             

            (PublicMethod cmdStrfromcode:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (call ctx setInExpr ())
                    (call wr out ("String.fromCharCode(" false))
                    (call this WalkNode (n1 ctx wr))
                    (call wr out (")" false))
                    (call ctx unsetInExpr ())
                )
            )   

            (PublicMethod cmdCharAt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (def index:CodeNode (itemAt node.children 2))

                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call wr out (".charCodeAt(" false))
                    (call this WalkNode (index ctx wr))
                    (call wr out (")" false))
                    (call ctx unsetInExpr ())
                    
                )
            )    

            ;cmdStr2Int     
            (PublicMethod cmdStr2Int:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))

                    (call ctx setInExpr ())
                    (call wr out ("parseInt(" false))
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())

                    (call wr out (")" false))
                    
                )
            )      

            (PublicMethod cmdStr2Double:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))

                    (call ctx setInExpr ())
                    (call wr out ("parseFloat(" false))
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())

                    (call wr out (")" false))
                    
                )
            )                              

            (PublicMethod cmdDouble2Str:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))

                    (call ctx setInExpr ())
                    (call wr out ("(" (strfromcode 34) (strfromcode 34)  " + " false))
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())

                    (call wr out (")" false))
                    
                )
            )            

            (PublicMethod cmdArrayLength:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (".length" false))
                )
            )

            (PublicMethod cmdPrint:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (call wr newline ())
                    (call wr out ("console.log(" false))
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (");" true))
                )
            )

            (PublicMethod cmdDoc:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (call wr out ("/**" false))
                    (if (> (array_length node.children) 1)
                        (
                            (def fc:CodeNode (call node getSecond ()))
                            (call this WalkNode (fc ctx wr))    
                        )
                    )
                    (call wr out ("*/" true))                    
                )
            )

            (PublicMethod cmdContinue:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (call wr out ("continue;" true))
                )
            )  

            (PublicMethod cmdBreak:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (call wr out ("break;" true))
                )
            )            


            (PublicMethod cmdReturn:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr out ("return" false))
                    (if (> (array_length node.children) 1)
                        (
                            (def fc:CodeNode (call node getSecond ()))

                            (if (== fc.vref "_")
                                ()
                                (
                                    (call wr out (" " false))
                                    (call ctx setInExpr ())
                                    (call this WalkNode (fc ctx wr))    
                                    (call ctx unsetInExpr ())    
                                )
                            )
                        )
                    )
                    (call wr out (";" true))                    
                )
            )

            ; (removeLast arr value)
            (PublicMethod cmdRemoveLast:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
 
                    (call wr newline ())
                    
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    (call ctx unsetInExpr ())                    
                    (call wr out (".pop()" true))
                )
            )

            ; (push arr value)
            (PublicMethod cmdPush:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
                    (def value:CodeNode (call node getThird ()))
 
                    (call wr newline ())
                    
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    (call wr out (".push(" false))
                    (call this WalkNode (value ctx wr))
                    (call ctx unsetInExpr ())                    
                    (call wr out (");" true))
                )
            )

            ; (itemAt arr index)
            (PublicMethod cmdItemAt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
                    (def index:CodeNode (call node getThird ()))
                     
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    (call wr out ("[" false))
                    (call this WalkNode (index ctx wr))
                    (call ctx unsetInExpr ())                    
                    (call wr out ("]" false))
                )
            )


            ; (has obj key)
            (PublicMethod cmdHas:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
                    (def key:CodeNode (call node getThird ()))
 
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    (call wr out ("typeof(" false))
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    (call wr out ("[" false))
                    (call this WalkNode (key ctx wr))
                    (call wr out ("]" false))
                    (call ctx unsetInExpr ())
                    (call wr out ((+ ") != " (strfromcode 34) "undefined" (strfromcode 34) ) false))
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                )
            )


            ; (set obj key value)
            (PublicMethod cmdSet:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
                    (def key:CodeNode (call node getThird ()))
                    (def value:CodeNode (itemAt node.children (3)))
 
                    (call wr newline ())
                    
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    (call wr out ("[" false))
                    (call this WalkNode (key ctx wr))
                    (call wr out ("] = " false))
                    (call this WalkNode (value ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (";" true))

                )
            )

            ; (get obj key)
            (PublicMethod cmdGet:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def obj:CodeNode (call node getSecond ()))
                    (def key:CodeNode (call node getThird ()))
 
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    (call ctx setInExpr ())
                    (call this WalkNode (obj ctx wr))
                    (call wr out ("[" false))
                    (call this WalkNode (key ctx wr))
                    (call wr out ("]" false))
                    (call ctx unsetInExpr ())
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                )
            )
            

            ; test for null (null? <value>)
            (PublicMethod cmdIsNull:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
 
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (" == null " false))
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                )
            )

            ; test for not null (!null? <value>)
            (PublicMethod cmdNotNull:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
 
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (" != null " false))
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                )
            )

            ; assigment = operator
            (PublicMethod cmdAssign:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))
                    (call this WalkNode (n1 ctx wr))
                    (call wr out (" = " false))
                    (call ctx setInExpr ())
                    (call this WalkNode (n2 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (";" true))         

                    (call this validateEvalTypes (n1 n2 ctx))
                )
            )

            ; override in child classes
            (PublicMethod mathLibCalled:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                ()
            )

            ;  "sin", "cos", "tan", "atan", "log", "abs", "acos", "asin", "floor", "round", "sqrt"
            (PublicMethod cmdMathLibOp:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def op:CodeNode (call node getFirst ()))
                    (def n1:CodeNode (call node getSecond ()))

                    (call wr out ("Math." false))
                    (call wr out (op.vref false))
                    (call wr out ("(" false))
                    
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call ctx unsetInExpr ())
                    (call wr out (")" false))
                
                    (call this mathLibCalled (node ctx wr))
                )
            )

            ; operators "==", "<", ">", "!=", ">=", "<="
            (PublicMethod cmdComparisionOp:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def op:CodeNode (call node getFirst ()))
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))

                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    (call ctx setInExpr ())
                    (call this WalkNode (n1 ctx wr))
                    (call wr out (op.vref false))
                    (call this WalkNode (n2 ctx wr))
                    (call ctx unsetInExpr ())
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                )
            )

            ; operators "&&", "||"
            (PublicMethod cmdLogicOp:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def op:CodeNode (call node getFirst ()))

                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    ;(&& a b c d)
                    (for node.children item:CodeNode i
                        (if (> i 0)
                            (
                                (if (> i 1)
                                    (call wr out ( (+ " " op.vref " ") false))
                                )
                                (call ctx setInExpr ())
                                (call this WalkNode (item ctx wr))
                                (call ctx unsetInExpr ())
                            )
                        )
                    )
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                )
            )

            ; operators "*", "+", "-", "/", "%"
            (PublicMethod cmdNumericOp:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def op:CodeNode (call node getFirst ()))

                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out ("(" false))
                    )
                    ;(&& a b c d)
                    (for node.children item:CodeNode i
                        (if (> i 0)
                            (
                                (if (> i 1)
                                    (call wr out ( (+ " " op.vref " ") false))
                                )
                                (call ctx setInExpr ())
                                (call this WalkNode (item ctx wr))
                                (call ctx unsetInExpr ())
                            )
                        )
                    )
                    (if ( > (call ctx expressionLevel ()) 1 )
                        (call wr out (")" false))
                    )
                )
            )
            

            (PublicMethod cmdIf:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))

                    ; 
                    (call wr out ("if(" false))
                        (call ctx setInExpr ())
                        (call this WalkNode (n1 ctx wr))
                        (call ctx unsetInExpr ())
                    (call wr out (") {" true))
                        (call wr indent (1))
                        (call this WalkNode (n2 ctx wr))
                        (call wr newline ())
                        (call wr indent (-1))
                    (if (> (array_length node.children) 3)
                        (
                            (def elseb:CodeNode (itemAt node.children 3))
                            (call wr out ("} else {" true))
                            (call wr indent (1))
                            (call this WalkNode (elseb ctx wr))
                            (call wr newline ())
                            (call wr indent (-1))
                        )
                    )
                    (call wr out ("}" true))
                )
            )

            ;(for list node indexname loop)
            (PublicMethod cmdFor:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def listField:CodeNode (itemAt node.children (1)))
                    (def nodeField:CodeNode (itemAt node.children (2)))
                    (def indexField:CodeNode (itemAt node.children (3)))
                    (def loopField:CodeNode (itemAt node.children (4)))

                    ; 

                    (def subCtx:RangerAppWriterContext (call ctx fork ()))
                    
                    (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                    (= p.name indexField.vref)
                    (= p.value_type indexField.value_type)
                    (= p.node indexField)
                    (= p.nameNode indexField)
                    (= p.is_optional false)
                    (call subCtx defineVariable (p.name p))     

                    (def p2:RangerAppParamDesc (new RangerAppParamDesc ()))
                    (= p2.name nodeField.vref)
                    (= p2.value_type nodeField.value_type)
                    (= p2.node nodeField)
                    (= p2.nameNode nodeField)
                    (= p2.is_optional false)

;                     (print (+ "defines for var " p2.name))
                    (call subCtx defineVariable (p2.name p2))   

                    (call wr out ("for( var " false))
                    (call wr out (indexField.vref false))
                    (call wr out ("= 0; " false))
                    (call wr out (indexField.vref false))
                    (call wr out ("< " false))
                        (call this WriteVRef (listField ctx wr))
                        ; (call wr out (listField.vref false))
                        (call wr out (".length; " false))
                        (call wr out (indexField.vref false))
                        (call wr out ("++) { " true))
                        (call wr indent (1))

                        (call wr out ("var " false))
                        (call wr out (nodeField.vref false))
                        (call wr out ("= " false))
                        (call this WriteVRef (listField ctx wr))
                        ; (call wr out (listField.vref false))
                        (call wr out ("[" false))
                        (call wr out (indexField.vref false))
                        (call wr out ("];" true))
                        
                        (call this WalkNode (loopField subCtx wr))
                        (call wr newline ())
                        (call wr indent (-1))
                    (call wr out ("}" true))
                )
            )

            (PublicMethod cmdWhile:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))

                    ; 
                    (call wr out ("while(" false))
                        (call ctx setInExpr ())
                        (call this WalkNode (n1 ctx wr))
                        (call ctx unsetInExpr ())
                    (call wr out (") {" true))
                        (call wr indent (1))
                        (call this WalkNode (n2 ctx wr))
                        (call wr newline ())
                        (call wr indent (-1))
                    (call wr out ("}" true))
                )
            )

            (PublicMethod cmdDefault:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def n1:CodeNode (call node getSecond ()))

                    (call wr out ("default: " true))
                    (call wr indent (1))
                    (call this WalkNode (n1 ctx wr))
                    (call wr newline ())
                    (call wr out ("break;" true))
                    (call wr indent (-1))
                )
            )

            (PublicMethod cmdCase:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))

                    (if n1.expression
                        (
                            (for n1.children item:CodeNode i
                                (
                                    (call wr out ("case " false))
                                    (call ctx setInExpr ())
                                    (call this WalkNode (item ctx wr))
                                    (call ctx unsetInExpr ())
                                    (call wr out (":" true))
                                )
                            )
                        )
                        (
                            (call wr out ("case " false))
                            (call ctx setInExpr ())
                            (call this WalkNode (n1 ctx wr))
                            (call ctx unsetInExpr ())
                            (call wr out (":" true))
                        )
                    )
                    (call wr indent (1))
                    (call this WalkNode (n2 ctx wr))
                    (call wr newline ())
                    (call wr out ("break;" true))
                    (call wr indent (-1))
                )
            )

            (PublicMethod cmdSwitch:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (call wr newline ())
                    (def n1:CodeNode (call node getSecond ()))
                    ; 
                    (call wr out ("switch(" false))
                        (call ctx setInExpr ())
                        (call this WalkNode (n1 ctx wr))
                        (call ctx unsetInExpr ())
                    (call wr out (") {" true))
                        (call wr indent (1))
                        (for node.children cItem:CodeNode i
                            (if (>= i 2)
                                 (call this WalkNode (cItem ctx wr))                   
                            )
                        )
                        (call wr newline ())
                        (call wr indent (-1))
                    (call wr out ("}" true))
                )
            )

            (PublicMethod cmdFileRead:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )

            (PublicMethod cmdFileWrite:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )

            (PublicMethod cmdIsDir:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )

            (PublicMethod cmdIsFile:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )            

            (PublicMethod cmdCreateDir:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )                                           

            (PublicMethod cmdArgv:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )

            (PublicMethod cmdArgvCnt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )                

            

            (PublicMethod WriteComment:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    ; (call wr out ("// " false))                    
                    ; (call wr out (node.string_value true))
                )
            )

            ; When starting at new class declaration...
            (PublicMethod EnterClass:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    ; ctx.currentClass
                    ; 
                    ; ctx.findClass
                    (def cn:CodeNode (itemAt node.children 1))
                    (def desc:RangerAppClassDesc (call ctx findClass (cn.vref)))
                    (def subCtx:RangerAppWriterContext (call ctx fork ()))

                    (= subCtx.currentClass desc)

                    (for desc.variables p:RangerAppParamDesc i
                        (
                            ; TODO: check that the class definition sets the optional values
                            (call subCtx defineVariable (p.name p))
                        )
                    )

                    (for desc.variables p:RangerAppParamDesc i
                        (
                            ; TODO: check that the class definition sets the optional values
                            (call subCtx defineVariable (p.name p))
                        )
                    )

                    (call this CreateClass (node subCtx wr))                     
                )
            )
            
            ; When starting at new method
            (PublicMethod EnterMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (                   
                    
                    (def cn:CodeNode (itemAt node.children 1))                    
                    (def desc:RangerAppClassDesc (call ctx getCurrentClass ()))        

                    ; (print (+ "Entering " desc.name "::" cn.vref))

                    (def subCtx:RangerAppWriterContext (call ctx fork ()))
                    
                    ; get method description
                    (def m:RangerAppFunctionDesc (call desc findMethod (cn.vref)))

                    (for m.params v:RangerAppParamDesc i 
                        (
                            ; (print (+ "param:" v.name))
                            ; defineVariable
                            (call subCtx defineVariable (v.name v))
                        )
                    )
                    
                    (call this PublicMethod (node subCtx wr))                     
                )
            )

            ; set the local variable definition
            (PublicMethod EnterVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (   

                    (if (call ctx isInMethod ())
                        (
                            ; (def n:Type <initializer>)
                            (def cn:CodeNode (itemAt node.children 1))                    
                            (def desc:RangerAppClassDesc ctx.currentClass)         
                                    
                            ; (print (+ "Defining variable " cn.vref))

                            (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                            (= p.name cn.vref)
                            (= p.value_type cn.value_type)
                            (= p.node node)
                            (= p.nameNode cn)

                            (= cn.eval_type cn.value_type)
                            (= cn.eval_type_name cn.type_name)

                            (if (> (array_length node.children) 2)
                                (
                                    (= p.set_cnt 1)
                                    (= p.def_value (itemAt node.children 2))
                                    (= p.is_optional false)
                                )
                                (
                                    (= p.is_optional true)
                                )
                            )
                            (call ctx defineVariable (p.name p))
                            (call this DefineVar (node ctx wr))      

                            (if (> (array_length node.children) 2)
                                (
                                    (call this validateEvalTypes (cn p.def_value ctx))    
                                )
                            )           
                        )
                        (
                            ; class variables should be already defined
                            (call this DefineVar (node ctx wr))                     
                        )
                    )     
                )
            )
            

            (PublicMethod WalkNodeChildren:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (if node.expression
                        (
                            (for node.children item:CodeNode i
                                (
                                    (call this WalkNode (item ctx wr))
                                )
                            )
                        )
                    )
                    ; (if (call node isFirstVref ("Extends"))                                      
                )
            )             

            (PublicMethod WalkNode:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (if (null? node)
                        (return false)
                    )
                    (if (call node isPrimitive ())
                        (
                            (call this WriteScalarValue(node ctx wr))
                            (return true)
                        )
                    )
                    (if (== node.value_type RangerNodeType.VRef)
                        (
                            (call this WriteVRef(node ctx wr))
                            (return true)                            
                        )
                    )
                    (if (== node.value_type RangerNodeType.Comment)
                        (
                            (call this WriteComment(node ctx wr))
                            (return true)                            
                        )
                    )
                    (if (call node isFirstVref ("Extends")) ( (return true) ) )                    

                    (if (call node isFirstVref ("Import")) ((call this cmdImport (node ctx wr)) (return true) ) )                    
                    (if (call node isFirstVref ("def")) ((call this EnterVarDef (node ctx wr)) (return true) ) )                    
                    (if (call node isFirstVref ("CreateClass")) ( (call this EnterClass (node ctx wr)) (return true) ) )
                    (if (call node isFirstVref ("PublicMethod")) ( (call this EnterMethod (node ctx wr)) (return true) ) )
                    (if (call node isFirstVref ("Constructor")) ( (call this Constructor (node ctx wr)) (return true) ) )

                    ; check if this is a function call...
                    (if (> (array_length node.children) 0)
                        (
                            (def fc:CodeNode (itemAt node.children 0))
                            (if ( && (!null? fc) (== fc.value_type RangerNodeType.VRef) )
                                (
                                    (def was_called:boolean true)
                                    (switch fc.vref

                                        (case "Enum" (call this cmdEnum (node ctx wr)) )
                                   
                                        (case "if" (call this cmdIf (node ctx wr)) )
                                        (case "while" (call this cmdWhile (node ctx wr)) )
                                        (case "for" (call this cmdFor (node ctx wr)) )
                                        (case "break" (call this cmdBreak (node ctx wr)) )
                                        (case "continue" (call this cmdContinue (node ctx wr)) )
                 
                                        (case "switch" (call this cmdSwitch (node ctx wr)) )
                                        (case "case" (call this cmdCase (node ctx wr)) )
                                        (case "default" (call this cmdDefault (node ctx wr)) )
                                        
                                        (case "return" (call this cmdReturn (node ctx wr)) )
                                        (case "call" (call this cmdCall (node ctx wr)) )
                                        (case "new" (call this cmdNew (node ctx wr)) )

                                        (case "doc" (call this cmdDoc (node ctx wr)) )
                                        (case "print" (call this cmdPrint (node ctx wr)) )

                                        (case "has" (call this cmdHas (node ctx wr)) )
                                        (case "get" (call this cmdGet (node ctx wr)) )
                                        (case "set" (call this cmdSet (node ctx wr)) )

                                        (case "null?" (call this cmdIsNull (node ctx wr)) )
                                        (case "!null?" (call this cmdNotNull (node ctx wr)) )
                                        (case "trim" (call this cmdTrim (node ctx wr)))
                                        (case "join" (call this cmdJoin (node ctx wr)))
                                        (case "strsplit" (call this cmdSplit (node ctx wr)))
                                        (case "strlen" (call this cmdStrlen (node ctx wr)))

                                        (case "charAt" (call this cmdCharAt (node ctx wr)))
                                        (case "substring" (call this cmdSubstring (node ctx wr)))
                                        (case "charcode" (call this cmdCharcode (node ctx wr)))
                                        (case "strfromcode" (call this cmdStrfromcode (node ctx wr)))
                                        (case "double2str" (call this cmdDouble2Str (node ctx wr)))
                                        (case "str2int" (call this cmdStr2Int (node ctx wr)))
                                        (case "str2double" (call this cmdStr2Double (node ctx wr)))

                                        (case "array_length" (call this cmdArrayLength (node ctx wr)))
                                        (case "itemAt" (call this cmdItemAt (node ctx wr)) )
                                        (case "push" (call this cmdPush (node ctx wr)) )
                                        (case "removeLast" (call this cmdRemoveLast (node ctx wr)) )

                                        (case "shell_arg_cnt" (call this cmdArgvCnt (node ctx wr)))
                                        (case "shell_arg" (call this cmdArgv (node ctx wr)))

                                        (case "file_read" (call this cmdFileRead (node ctx wr)))
                                        (case "file_write" (call this cmdFileWrite (node ctx wr)))
                                        (case "file_exists" (call this cmdIsFile (node ctx wr)))
                                        (case "dir_exists" (call this cmdIsDir (node ctx wr)))
                                        (case "dir_create" (call this cmdCreateDir (node ctx wr)))


                                        (case "=" (call this cmdAssign (node ctx wr)) )
                                        (case ("sin" "cos" "tan" "atan" "log" "abs" "acos" "asin" "floor" "round" "sqrt")
                                              (call this cmdMathLibOp (node ctx wr))
                                        )
                                        (case ("==" "<" ">" "!=" ">=" "<=")
                                              (call this cmdComparisionOp (node ctx wr))
                                        )
                                        (case ("&&" "||")
                                              (call this cmdLogicOp (node ctx wr))
                                        )
                                        (case ("*" "+" "-" "/" "%")
                                              (call this cmdNumericOp (node ctx wr))
                                        )

                                        (default 
                                            (
                                                (= was_called false)
                                            )
                                        )
                                    )
                                    (if was_called
                                        (return true)
                                    )
                                    ; the variable type should be checked
                                    ; (print ( + "Possible call to " fc.vref))
                                    (if (call this cmdLocalCall (node ctx wr))
                                        (return true)
                                    )
                                )
                            )
                        )
                    )


                    (if node.expression
                        (
                            (for node.children item:CodeNode i
                                (
                                    (WalkNode item ctx wr)
                                )
                            )
                        )
                    )
                    ; (if (call node isFirstVref ("Extends"))                                      
                )
            )   


            (PublicMethod StartCodeWriting (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    ; at this point all the information for building the classes should be collected
                    ; using the CollectMethods function. 
                    (call this WalkNode (node ctx wr))

                    ; after writing write native code
                    ; @javascript
                    ; getStringProperty
                    (def lang:string (call this getWriterLang ()))
                    (if (call node hasStringProperty (lang))
                        (
                            (call wr newline ())
                            (call wr out ( (call node getStringProperty (lang))  true))
                        )
                    )
                    
                )
            )       

            (PublicMethod CollectMethods:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def find_more:boolean true)

                    (if (call node isFirstVref ("Extends"))
                        (
                            (def extList:CodeNode (itemAt node.children 1))
                            (def currC:RangerAppClassDesc ctx.currentClass)

                            (for extList.children ee:CodeNode ii
                                (
                                    ; (print (+ "Extending --> "  ee.vref))
                                    (call currC addParentClass (ee.vref))
                                    
                                )
                            )
                        )
                    )
                

                    (if (call node isFirstVref ("Constructor"))
                        (
                            (def currC:RangerAppClassDesc ctx.currentClass)
                            (= currC.has_constructor true)
                            (= currC.constructor_node node)
                            
                        )
                    )                    

                    (if (call node isFirstVref ("CreateClass"))
                        (
                            (def s:string (call node getVRefAt (1)))
                            ; (print (+ "Found class " s))

                            (def new_class:RangerAppClassDesc (new RangerAppClassDesc ()))
                            (= new_class.name s)
                            (= ctx.currentClass new_class)
                            (call ctx addClass (s new_class))
                        )
                    )
                    (if (call node isFirstVref ("def"))
                        (
                            (def s:string (call node getVRefAt (1)))
                            ; (print (+ "DEF " s ))
                            
                            ; --
                            (def vDef:CodeNode (itemAt node.children 1))

                            ; add new variable with name
                            (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                            (= p.name s)
                            (= p.value_type vDef.value_type)
                            (= p.node node)            
                            (= p.is_class_variable true)            

                            (= p.nameNode vDef)
                                

                            (if (> (array_length node.children) 2)
                                (
                                    (= p.set_cnt 1)
                                    (= p.def_value (itemAt node.children 2))
                                    (= p.is_optional false)
                                )
                                (
                                    (= p.is_optional true)
                                )
                            )

                            (def currC:RangerAppClassDesc ctx.currentClass)
                            (call currC addVariable (p))
                        )
                    )
                    (if (call node isFirstVref ("PublicMethod"))
                        (
                            (def s:string (call node getVRefAt (1)))
                            (def currC:RangerAppClassDesc ctx.currentClass)
                            ; (print (+ "--> " s "::" currC.name))
                            ; collecting the method data
                            (def m:RangerAppFunctionDesc (new RangerAppFunctionDesc ()))
                            (= m.name s)

                            ; parse arguments...
                            (def args:CodeNode (itemAt node.children 2))
                            ; (print (array_length args.children))
                            (for args.children arg:CodeNode ii 
                                (
                                    ; (print arg.vref)
                                    (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                                    (= p.name arg.vref)
                                    (= p.value_type arg.value_type)
                                    (= p.node arg)
                                    (= p.nameNode arg)

                                    (push m.params p)
                                )
                            )
                            (call currC addMethod (m))
                            (= find_more false)
                        )
                    )

                    (if find_more
                        (for node.children item:CodeNode i
                            (
                                (call this CollectMethods (item ctx wr))
                            )
                        )         
                    )           
                )
            )                  

            (PublicMethod DefineVar (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (print "ERROR: DefineVar not implemented!")
                )
            )


        )
    )
    
)