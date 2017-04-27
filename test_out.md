# class CodeNode 

NOTE: This is just a documentation test, not a real documentation entry!!!
The codenode represents AST node which can be used for parsers and intepreters of the system.
Testing the indent.

```
(def n:CodeNode (new CodeNode (src start end)))
(def str:string (node getCode ()))
```

##isVariableDef:boolean()
##isFunctionDef:boolean()
##isFunctionCall:boolean()
##isPrimitive:boolean()
##getFirst:CodeNode()
##getSecond:CodeNode()
##getThird:CodeNode()
##isSecondExpr:boolean()
##getOperator:string()
##getVRefAt:string(idx:int)
##getStringAt:string(idx:int)
##hasExpressionProperty:boolean(name:string)
##getExpressionProperty:CodeNode(name:string)
##hasIntProperty:boolean(name:string)
##getIntProperty:double(name:string)
##hasDoubleProperty:boolean(name:string)
##getDoubleProperty:double(name:string)
##hasStringProperty:boolean(name:string)
##getStringProperty:string(name:string)
##hasBooleanProperty:boolean(name:string)
##getBooleanProperty:boolean(name:string)
##isFirstTypeVref:boolean(vrefName:string)
##isFirstVref:boolean(vrefName:string)
##getString:string()
##writeCode:void(wr:CodeWriter)
##getCode:string()
##walk:void()

