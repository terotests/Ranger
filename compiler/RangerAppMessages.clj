(
    ( CreateClass RangerAppTodo
        (
            (def description:string "")
            (def node:CodeNode @weak(true))
        )    
    )
    
    ( CreateClass RangerCompilerMessage
        (
            (def error_level:int 0)
            (def code_line:int 0)
            (def fileName:string "")
            (def description:string "")
            (def node:CodeNode @weak(true))
        )
    )

)