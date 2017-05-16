(
    ( CreateClass RangerAppFunctionDesc
        (
            (def name:string "")
            
            (def node:CodeNode @weak(true))            
            (def nameNode:CodeNode @weak(true))

            (def params:[RangerAppParamDesc])
            (def return_value:RangerAppParamDesc)

            (def is_method:boolean false)
            (def is_static false)
            (def container_class:RangerAppClassDesc)

            (def refType:RangerNodeRefType RangerNodeRefType.NoType)            

            ; function body AST and string
            (def body_ast:CodeNode)
            (def body_str:string)

        )
    )
)