
operators {
    r.op _:CodeNode ( n:string ) {
        templates {
            * @macro(true) ("CodeNode.op(" (e 1) ")")
        }
    }    
    r.op _:CodeNode ( n:string v:CodeNode ) {
        templates {
            * @macro(true) ("CodeNode.op2(" (e 1) " " (e 2) ")")
        }
    }    
    r.op _@(expands):CodeNode ( n:string v:CodeNode ) {
        templates {
            * @macro(true) ("(CodeNode.op3( " (e 1)  "([] _:CodeNode (" nl I
                ( repeat 2 ( nl (e 1) nl ) ) i nl
                "))))")
        }
    }    
    r.vref _:CodeNode ( n:string t:string ) {
        templates {
            * @macro(true) ("CodeNode.vref2(" (e 1) " " (e 2) ")")
        }
    }    
    r.vref _:CodeNode ( n:string ) {
        templates {
            * @macro(true) ("CodeNode.vref1(" (e 1) ")")
        }
    }    
    r.value _:CodeNode ( n:string ) {
        templates {
            * @macro(true) ("CodeNode.newStr(" (e 1) ")")
        }
    }    
    r.value _:CodeNode ( n:double ) {
        templates {
            * @macro(true) ("CodeNode.newDouble(" (e 1) ")")
        }
    }    
    r.value _:CodeNode ( n:int ) {
        templates {
            * @macro(true) ("CodeNode.newInt(" (e 1) ")")
        }
    }    
    r.value _:CodeNode ( n:boolean ) {
        templates {
            * @macro(true) ("CodeNode.newBool(" (e 1) ")")
        }
    }    
    r.expression _@(expands):CodeNode ( ) {
        templates {
            * @macro(true) ('(CodeNode.expressionNode())')
        }
    }   
    r.expression _:CodeNode ( v:[CodeNode] ) {
        templates {
            * @macro(true) ("(CodeNode.fromList( (" (e 1) ") )")
        }
    }   
    r.expression _@(expands):CodeNode ( v:CodeNode ) {
        templates {
            * @macro(true) ("(CodeNode.fromList( ([] _:CodeNode (" nl I
                ( repeat 1 ( nl (e 1) nl ) ) i nl
                "))))")
        }
    }   
    r.block _@(expands):CodeNode ( ) {
        templates {
            * @macro(true) ('(CodeNode.blockNode())')
        }
    }   
    r.block _:CodeNode ( v:[CodeNode]  ) {
        templates {
            * @macro(true) ("(CodeNode.blockFromList( (" (e 1) ") ))")
        }
    }   
    r.block _@(expands):CodeNode ( v:CodeNode  ) {
        templates {
            * @macro(true) ("(CodeNode.blockFromList( ([] _:CodeNode (" nl I
                ( repeat 1 ( nl (e 1) nl ) ) i nl
                "))))")
        }
    }   
}
