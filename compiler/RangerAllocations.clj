(
    ; Commin memory management functions

    ( CreateClass RangerAllocations
        (
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

                    (call ctx log ( node "memory4" "new memory allocation") )
                    
                )
            )
        )
    )   
)