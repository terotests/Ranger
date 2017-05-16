(

    (Enum RangerAnnType:int
        (
            None
            Expression
            Type
            VRef
        )
    )

    (Enum RangerWrap:int
        (
            None
            Optional
            Unwrap
        )
    )

    (Enum RangerVForce:int
        (
            None
            Weak
            Strong
        )
    )

    (Enum RangerNodeType:int
        (
            NoType
            Double
            Integer
            String
            Boolean
            Array
            Hash
            Object
            VRef
            Comment
            ExpressionType
            XMLNode
            XMLText
            XMLAttr
            XMLCDATA
            Dictionary
            Any
            Class
            Method
            ClassVar
            Function
            Literal
            Quasiliteral
            Null
        )
    )
    
    (Enum RangerNodeRefType:int
        (
            NoType
            Weak
            Strong
            Shared
            StrongImmutable
        )
    )

    ( Enum RangerContextVarType
        (
            NoType
            This
            ThisProperty
            NewObject
            FunctionParameter
            LocalVariable
            Array 
            Object
            Property
            Class
            Function
        )    
    )
    
)