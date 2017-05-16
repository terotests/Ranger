(
    ; Commin memory management functions

    ( CreateClass RangerAllocations
        (
            (StaticMethod moveOwnership:void (n1:CodeNode n2:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    ; (return _)
                    (def node:CodeNode n1)
                    (if (&& n1.hasParamDesc n2.hasParamDesc)
                        (
                            ; (call ctx log ( node "memory4" "had ASSIGMENT operator with BOTH parameters having a descriptor" ) )                                        
                            ; (def p1:RangerAppParamDesc n1.paramDesc)
                            (def p2:RangerAppParamDesc n2.paramDesc)
                            (def p1:RangerAppParamDesc n1.paramDesc)

                            (def p:RangerAppParamDesc (call RangerAllocations findParamDesc (n1 ctx wr)))
                            ; (def p:RangerAppParamDesc p1)
                            (= p1 p)

                            (if (null? p)
                                (return _)
                            )
                            ; (return _)

                            ; StrongImmutable

                            (if (&& (== p1.refType RangerNodeRefType.Strong) (== p2.refType RangerNodeRefType.StrongImmutable) )
                                (
                                    (call ctx log ( node "memory4" "ERROR: can not assing strong immutable to strong") )
                                    (return _)
                                )
                            )

                            (if (&& (== p1.refType RangerNodeRefType.Weak) (== p2.refType RangerNodeRefType.StrongImmutable) )
                                (
                                    (call ctx log ( node "memory4" "OK: strong immutable can be referred") )
                                    (return _)
                                )
                            )
                            

                            (if (&& (== p1.refType RangerNodeRefType.Weak) (== p2.refType RangerNodeRefType.Weak) )
                                (
                                    (call ctx log ( node "memory4" "+++ weak -> weak assigment, nothing to do") )
                                    (return _)
                                )
                            )

                            (if (&& (== p1.refType RangerNodeRefType.Weak) (== p2.refType RangerNodeRefType.Strong) )
                                (
                                    (call ctx log ( node "memory4" "+++ strong -> weak assigment, nothing to do, OK") )
                                    (if (== p.varType RangerContextVarType.Property)
                                        (                                            
                                            (= p2.prop_assign_cnt (+ 1 p2.prop_assign_cnt ))
                                        )
                                    )
                                    (return _)
                                )
                            )

                            (if (&& (== p1.refType RangerNodeRefType.Strong) (== p2.refType RangerNodeRefType.Weak) )
                                (
                                    (if (call p1 pointsToObject (ctx))
                                        (
                                            (call ctx log ( node "memory4" "+++ ERROR weak -> strong") )         
                                            ; getVarTypeName                 
                                            (def ss:string (call p1 getVarTypeName ()))      
                                            (if (!null? p1.nameNode)
                                                (call ctx log ( node "memory4" (+ "type: " (call p1.nameNode getTypeInformationString ()) ) ) )
                                            )       
                                        )
                                        (
                                            (call ctx log ( node "memory4" "+++ NOTE: weak -> strong") )                                                     
                                            (if (!null? p1.nameNode)
                                                (call ctx log ( node "memory4" (+ "type: " (call p1.nameNode getTypeInformationString ()) ) ) )
                                            )       

                                        )
                                    )
                                    (return _)
                                )
                            )
                            
                            
                            (if (&& (== p1.refType RangerNodeRefType.NoType) (== p2.refType RangerNodeRefType.Strong) )
                                (
                                    (if (== p1.varType RangerContextVarType.LocalVariable)
                                        (
                                            (call ctx log ( node "memory4" "+++ strong ref assigned to a not typed local variable, OK") )
                                            
                                            (= p1.refType RangerNodeRefType.Strong)
                                            (= p2.refType RangerNodeRefType.Weak)

                                            (return _)                                            
                                        )
                                        (
                                            (call ctx log ( node "memory4" "+++ strong -> non local non typed maybe ERROR") )
                                        )
                                    )
                                )
                            )
                            
                            (if (&& (== p1.refType RangerNodeRefType.Strong) (== p2.refType RangerNodeRefType.Strong) )
                                (
                                    (if (== p1.varType RangerContextVarType.LocalVariable)
                                        (
                                            (call ctx log ( node "memory4" "+++ local variable assigned to a strong ref, OK") )
                                            (return _)                                            
                                        )
                                    )

                                    (if (== p2.varType RangerContextVarType.NewObject)
                                        (
                                            (call ctx log ( node "memory4" "+++ NEW OBJECT -> Strong, OK") )
                                            (= p1.refType RangerNodeRefType.Strong)

                                            (return _)                                            
                                        )
                                    )
                                    (def nn:CodeNode p.nameNode)
                                    (if (!null? nn)
                                        (if (call nn isPrimitiveType ())
                                            (
                                                (call ctx log ( node "memory4" "+++ NON DETECTED, primitive assigment, OK") )
                                            )
                                            (

                                                (if (== p.varType RangerContextVarType.Property)
                                                    (

                                                        (= p2.prop_assign_cnt (+ 1 p2.prop_assign_cnt ))

                                                        (if (== p.refType RangerNodeRefType.Weak)
                                                            (
                                                                (call ctx log ( node "memory4" (+ "WEAK PROPERTY ASSIGN to -> " n1.vref  ) ) )
                                                            )
                                                        )
                                                        (if (== p.refType RangerNodeRefType.Strong)
                                                            (
                                                                (call ctx log ( node "memory4" (+ "STRONG PROPERTY ASSIGN to -> " n1.vref  ) ) )
                                                            )
                                                        )                                                  
                                                                                                          
                                                    )
                                                )                                           
                                                (if (== p.varType RangerContextVarType.LocalVariable)
                                                    (
                                                        (call ctx log ( node "memory4" (+ "Local variable ASSIGN to -> " n1.vref " str: " (call nn getString ()) " " nn.type_name  ) ) )                                
                                                    )
                                                )                                           
                                                 
                                                (= p1.refType RangerNodeRefType.Strong)
                                                (= p2.refType RangerNodeRefType.Weak)                                           
                                                (call ctx log ( node "memory4" "+++ MOVING OWNERSHIP " nn.value_type) )
                                            )
                                        )                                    
                                    )
                                )
                            )

                            (if (== p2.varType RangerContextVarType.NewObject)
                                (
                                    ; (= p1.refType RangerNodeRefType.Strong)
                                    (call ctx log ( node "memory4" (+ "ASSIGN & STRONG variable assigment because of NewObject: " n1.vref) ) )

                                    (if (== p1.varType RangerContextVarType.Property)
                                        (
                                            (call ctx log ( node "memory4" (+ "also: PROPERTY ASSIGN to " n1.vref) ) )   
                                        )
                                    )                            
                                
                                    (return _)
                                )
                            )                                          

                            (if (== p1.varType RangerContextVarType.Property)
                                (
                                    (call ctx log ( node "memory4" (+ "PROPERTY ASSIGN to " n1.vref) ) )                                
                                    (return _)
                                )
                            )                                           

                            (if (== p1.varType RangerContextVarType.ThisProperty)
                                (
                                    (call ctx log ( node "memory4" (+ "THIS.PROPERTY ASSIGN to " n1.vref) ) )                                
                                    (return _)
                                )
                            )
                        )
                        (
                            ; (call ctx log ( node "memory4" (+ "<<<< not found " n1.vref) ) )                                
                        )
                    )  
                    
                )
            )
            (StaticMethod cmdNew:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                    (= p.varType RangerContextVarType.NewObject)
                    (= p.refType RangerNodeRefType.Strong)

                    (def obj:CodeNode (call node getSecond ()))
                    (= p.node node)
                    (= p.nameNode obj)

                    (= node.hasParamDesc true)
                    (= node.paramDesc p)

                    ; (call ctx log ( node "memory4" (+ "new memory allocation for " obj.vref) ) )
                    
                )
            )

            (StaticMethod cmdAssign:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    (def n2:CodeNode (call node getThird ()))
                    
                    ; (def p1:RangerAppParamDesc (call RangerAllocations findParamDesc (n1 ctx wr)))

                    (call RangerAllocations moveOwnership (n1 n2 ctx wr))
                    (return _)

                    (if (&& n1.hasParamDesc n2.hasParamDesc)
                        (
                            ; (call ctx log ( node "memory4" "had ASSIGMENT operator with BOTH parameters having a descriptor" ) )                                        
                            (def p1:RangerAppParamDesc n1.paramDesc)
                            (def p2:RangerAppParamDesc n2.paramDesc)
                            (call ctx log ( node "memory4" (+ "DEFINED assign to " n1.vref) ) )                                

                            (if (== p2.varType RangerContextVarType.NewObject)
                                (
                                    ; (= p1.refType RangerNodeRefType.Strong)
                                    (call ctx log ( node "memory4" (+ "ASSIGN & STRONG variable assigment because of NewObject: " n1.vref) ) )

                                    (if (== p1.varType RangerContextVarType.ThisProperty)
                                        (
                                            (call ctx log ( node "memory4" (+ "also: THIS.PROPERTY ASSIGN to " n1.vref) ) )   
                                        )
                                    )                            
                                
                                    (return _)
                                )
                            )                                          

                            (if (== p1.varType RangerContextVarType.Property)
                                (
                                    (call ctx log ( node "memory4" (+ "PROPERTY ASSIGN to " n1.vref) ) )                                
                                    (return _)
                                )
                            )                                           

                            (if (== p1.varType RangerContextVarType.ThisProperty)
                                (
                                    (call ctx log ( node "memory4" (+ "THIS.PROPERTY ASSIGN to " n1.vref) ) )                                
                                    (return _)
                                )
                            )                                           
                          
                        )
                        (
                            ; (call ctx log ( node "memory4" (+ "<<<< not found " n1.vref) ) )    
                        )
                    )

                )
            )

            ; call may return new variable and can transfer the called params to new function
            (StaticMethod cmdCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )

            ; cmdLocalCall
            (StaticMethod cmdLocalCall:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (

                )
            )

            (StaticMethod cmdPush:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )
            
            (StaticMethod cmdGet:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )

            (StaticMethod cmdSet:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )

            (StaticMethod cmdItemAt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )
            
            (StaticMethod cmdReturn:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                )
            )
            

            (StaticMethod EnterVarDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    (def n1:CodeNode (call node getSecond ()))
                    
                    (if (> (array_length node.children) 2)
                        (
                            (def n2:CodeNode (call node getThird ()))

                            (if (&& n1.hasParamDesc n2.hasParamDesc) 
                                (
                                    (call ctx log ( node "memory4" (+ "variable definition of defined var " n1.vref) ) )

                                    (def p1:RangerAppParamDesc n1.paramDesc)
                                    (def p2:RangerAppParamDesc n2.paramDesc)

                                    (if (== p2.varType RangerContextVarType.NewObject)
                                        (
                                            (= p1.refType RangerNodeRefType.Strong)
                                            (call ctx log ( node "memory4" (+ "STRONG variable definition because of NewObject: " n1.vref) ) )                                
                                            (return _)
                                        )
                                    )               
                                )
                            )
                        )
                    )
                )
            )

            (StaticMethod WriteVRef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (
                    ; 
                    (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
                    (def rootObjName:string (itemAt node.ns 0))

                    ; no need to handle enumerations...
                    (if (call ctx isEnumDefined (rootObjName)) (return _) )
                    

                    ; (= p.varType RangerContextVarType.NewObject)
                    ; (= p.refType RangerNodeRefType.Strong)

                    (if (== node.vref (call ctx getThisName ()))
                        (
                            ; (call ctx log ( node "memory4" (+ "found reference to self => " node.vref) ) )          
                            (= node.hasParamDesc true)
                            (= node.paramDesc p)
                            (= p.varType RangerContextVarType.This)
                            (= p.refType RangerNodeRefType.StrongImmutable)
                            (return _)     
                            ; (= node.ref_type RangerNodeRefType.StrongImmutable)                                    
                            ; ( return _ )                   
                        )
                    )

                    (def p:RangerAppParamDesc (call RangerAllocations findParamDesc (node ctx wr)))
                    
                    (if (!null? p)
                        (
                            ; (call ctx log ( node "memory4" (+ "pdesc found: " node.vref) ) )          
                            (= node.hasParamDesc true)
                            (= node.paramDesc p)
                        )
                    )
                    
                    
                )
            )

            (StaticMethod findParamDesc:RangerAppParamDesc (obj:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
                (

                    (if obj.hasParamDesc
                        (return obj.paramDesc)
                    )

                    (if (== 0 (strlen obj.vref))
                        (
                            @todo("creating new object and returning it will not work, if purpose is to return NULL value - returned value should be weak but here it is strong")
                            (def noT:RangerAppParamDesc (new RangerAppParamDesc ()))
                            (return noT)
                        )
                    )

                    (def varDesc:RangerAppParamDesc)   

                    (if (call ctx hasClass (obj.vref))
                        (
                            (= varDesc (new RangerAppParamDesc ()))
                            (= varDesc.varType RangerContextVarType.Class)
                            (= varDesc.refType RangerNodeRefType.StrongImmutable)
                            (return varDesc)
                        )
                    )

                    ; how to detect ThisProperty

                    (if (== obj.vref ( (call ctx getThisName ())))
                        (
                            (= varDesc (new RangerAppParamDesc ()))
                            (= varDesc.varType RangerContextVarType.This)
                            (= varDesc.refType RangerNodeRefType.StrongImmutable)
                            (return varDesc)
                        )
                        (
                            ; reference of type obj.foo
                            (if (> (array_length obj.ns) 1)
                                (                                    
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
                                            )
                                            (
                                                (if (< i (- cnt 1))
                                                    (
                                                        (= varDesc (call classDesc findVariable (strname)))
                                                        (if (null? varDesc)
                                                            (call ctx addError (obj ( + "Error, no description for refenced obj: " strname ) ))                                                    
                                                        )
                                                        (def subClass:string (call varDesc getTypeName ()))
                                                        (= classDesc (call ctx findClass (subClass)))
                                                        (continue _) 
                                                    )
                                                )
                                                
                                                ; TODO: consider if methods should be checed too
                                                (if (!null? classDesc) 
                                                    (
                                                        (= varDesc (call classDesc findVariable (strname)))
                                                        (= varDesc.varType RangerContextVarType.Property)

                                                        (if (null? varDesc)
                                                            (call ctx addError (obj ( + "variable not found " strname ) ))                                   
                                                        )
                                                    )
                                                )       
                                                ; (print (+ "ns variable type " varDesc.nameNode.type_name))                                                                                             
                                            )
                                        )                                        
                                    )
                                    (return varDesc)
                                    ; (= varDesc (call subCtx getVariableDef (obj.vref)))      
                                )
                            )

                            (= varDesc (call ctx getVariableDef (obj.vref)))
                            (if ( && (!null? varDesc) (!null? varDesc.nameNode) )
                                (
                                    ; OK, here is what to expect:
                                    ; (print (+ varDesc.nameNode.vref ":" varDesc.nameNode.type_name) )
                                )
                                (
                                    ;(print (+ "findParamDesc : description not found for " obj.vref ))
                                    ;(if (!null? varDesc)
                                    ;    (print (+ "Vardesc was found though..." varDesc.name))
                                    ;)
                                    ;(call ctx addError (obj ( + "Error, no description for called object: " obj.vref ) ))
                                )
                            )
                            (return varDesc)
                        )
                    )
                    (return varDesc)
                )
            )
            

        )
    )   
)