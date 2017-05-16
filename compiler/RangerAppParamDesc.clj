(
    ; NOTE: removing a child from array is slow operation
    ; if there is N children, deleting a child item from the Array may require searching the
    ; whole array and then removing one of the items from there.
    ;   1. (indexOf list child)
    ;   2. (removeIndex list idx)
    ; mass removal of child nodes and calling "delete" on those nodes requires that the process which
    ; is removing the nodes is not called again. Thus calling removal functions to object which is currently
    ; being removed should be prevented.
    ; ??? maybe there should be "removeBacklinksTo(object, force_no_backcall)
    ; ---> this would force removal of "parent" to this object but does not call the list removals etc. of the
    ; parent object.

    ( CreateClass RangerAppParamDesc
        (
            (def name:string "")
            (def compiledName:string "")
            (def debugString:string "")
            
            (def ref_cnt:int 0)
            (def set_cnt:int 0)
            (def prop_assign_cnt 0)
            
            (def value_type:RangerNodeType)
            (def has_default:boolean false)
            (def def_value:CodeNode)

            (def default_value:RangerNodeValue)
            
            (def isThis:boolean false)            
            (def classDesc:RangerAppClassDesc)
            (def fnDesc:RangerAppFunctionDesc)

            ; 
            (def varType:RangerContextVarType RangerContextVarType.NoType)
            (def refType:RangerNodeRefType RangerNodeRefType.NoType)
            (def initRefType:RangerNodeRefType RangerNodeRefType.NoType)

            (def isParam:boolean)
            (def paramIndex:int 0)

            (def is_optional:boolean false)
            (def is_mutating:boolean false)
            (def is_set:boolean false)
            (def is_class_variable:boolean false)

            ; note these should be weak...
            (def node:CodeNode @weak(true))
            (def nameNode:CodeNode @weak(true))

            (def description:string "")
            (def git_doc:string "")

            ; value_type
            (PublicMethod pointsToObject:boolean (ctx:RangerAppWriterContext)
                (
                    (if (!null? nameNode)
                        (
                            (def is_primitive:boolean false)
                            (switch nameNode.array_type
                                (case ("string" "int" "boolean" "double")
                                    (= is_primitive true)
                                )
                            )
                            (if is_primitive (return false))

                            (if ( || (== nameNode.value_type RangerNodeType.Array)
                                     (== nameNode.value_type RangerNodeType.Hash) )
                                (
                                    (def is_object:boolean true)
                                    (switch nameNode.array_type
                                        (case ("string" "int" "boolean" "double")
                                            (= is_object false)
                                        )
                                    )
                                    (return is_object)
                                )
                            )     
                            (if  (== nameNode.value_type RangerNodeType.VRef)
                                 (
                                    (def is_object:boolean true)
                                    (switch nameNode.type_name
                                        (case ("string" "int" "boolean" "double")
                                            (= is_object false)
                                        )
                                    )
                                    (if (call ctx isEnumDefined (nameNode.type_name))
                                        (return false)
                                    )
                                    (return is_object)                                     
                                 )
                            )
                                                           
                        )
                    )
                    ( return false )
                )
            )            

            (PublicMethod isObject:boolean ()
                (
                    (if (!null? nameNode)
                        (
                            (if (== nameNode.value_type RangerNodeType.VRef)
                                (if (== false (call nameNode isPrimitive ()))
                                    (return true)
                                )
                            )        
                        )
                    )
                    ( return false )
                )
            )

            (PublicMethod isArray:boolean ()
                (
                    (if (!null? nameNode)
                        (
                            (if (== nameNode.value_type RangerNodeType.Array)
                                (return true)
                            )        
                        )
                    )
                    ( return false )
                )
            )

            (PublicMethod isHash:boolean ()
                (
                    (if (!null? nameNode)
                        (
                            (if (== nameNode.value_type RangerNodeType.Hash)
                                ( return true)
                            )        
                        )
                    )
                    ( return false )
                )
            )

            (PublicMethod isPrimitive:boolean ()
                (
                    (if (!null? nameNode)
                        ( return (call nameNode isPrimitive ()))
                    )
                    ( return false )
                )
            )            
            

            (PublicMethod getRefTypeName:string ()
                (
                    (switch refType
                        (case RangerNodeRefType.NoType 
                            (return "NoType")
                        )
                        (case RangerNodeRefType.Weak 
                            (return "Weak")
                        )
                        (case RangerNodeRefType.Strong 
                            (return "Strong")
                        )
                        (case RangerNodeRefType.Shared 
                            (return "Shared")
                        )
                        (case RangerNodeRefType.StrongImmutable 
                            (return "StrongImmutable")
                        )
                    )
                )
            )

            (PublicMethod getVarTypeName:string ()
                (
                    (switch refType
                        (case RangerContextVarType.NoType 
                            (return "NoType")
                        )
                        (case RangerContextVarType.This 
                            (return "This")
                        )
                        (case RangerContextVarType.ThisProperty 
                            (return "ThisProperty")
                        )
                        (case RangerContextVarType.NewObject 
                            (return "NewObject")
                        )
                        (case RangerContextVarType.FunctionParameter 
                            (return "FunctionParameter")
                        )
                        (case RangerContextVarType.LocalVariable 
                            (return "LocalVariable")
                        )
                        (case RangerContextVarType.Array   ; <-- maybe unnecessary
                            (return "Array")
                        )
                        (case RangerContextVarType.Object 
                            (return "Object")
                        )
                        (case RangerContextVarType.Property 
                            (return "Property")
                        )
                        (case RangerContextVarType.Class 
                            (return "Class")
                        )
                    )
                )
            )


            (PublicMethod getTypeName:string ()
                (
                    @todo("Defining the type name requires also Array and Hash type conversions [ClassName] or [string:ClassName] etc.")
                    (def s:string nameNode.type_name)
                    (return s)
                )
            )
 
        )
    )
    
)