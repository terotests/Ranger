
Import "RangerCommonWriter.clj"

class RangerScalaWriter {
    
    Extends (RangerCommonWriter)

    fn getWriterLang:string () { return "Scala" }

    fn getCmdName:string (cmd:string) {
        switch cmd {
            case "push" { return "append" }
            default { return cmd }
        }
    }


    (PublicMethod EncodeString:string (orig_str:string)
        (
            (def encoded_str:string "")
            (def str_length:int (strlen orig_str))
            (def ii:int 0)

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

    fn getObjectTypeString:string (type_string:string) {

        switch type_string {
            case "int" {
                return "Int"
            }
            case "string" {
                return "String"
            }
            case "boolean" {
                return "Boolean"
            }
            case "double" {
                return "Double"
            }
            default {
                return type_string
            }
        }
    }
    fn getTypeString:string (type_string:string) {

        switch type_string {
            case "int" {
                return "Int"
            }
            case "string" {
                return "String"
            }
            case "boolean" {
                return "Boolean"
            }
            case "double" {
                return "Double"
            }
            default {
                return type_string
            }
        }
    }
    

    ; function to write type definition at the language...
    fn writeTypeDef:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        switch node.value_type {
            case RangerNodeType.Integer {
                wr.out("Int" false)
            }
            case RangerNodeType.Double {
                wr.out("Double" false)
            }
            case RangerNodeType.String {
                wr.out("String" false)
            }
            case RangerNodeType.Boolean {
                wr.out("Boolean" false)
            }
            case RangerNodeType.Hash {
			    wr.addImport("scala.collection.mutable")
                wr.out( "collection.mutable.Map[" + (getObjectTypeString node.key_type) + ", " + (getObjectTypeString node.array_type) + "]" , false)
            }
            case RangerNodeType.Array {
                ; ArrayList
                ; TODO: add generics support
			    wr.addImport("scala.collection.mutable")
                wr.out( "collection.mutable.ArrayBuffer[" + (getObjectTypeString node.array_type) + "]" , false)
            }
            default {

                if( node.type_name == "void") {
                    wr.out( "Unit" false )
                    return _
                }
                wr.out( ( getTypeString( node.type_name) ) false )
            }
        }
    }

    fn cmdItemAt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        
        def obj:CodeNode (call node getSecond ())
        def index:CodeNode (call node getThird ())
            
        ctx.setInExpr ()
        this.WalkNode(obj ctx wr)
        wr.out("(" false)
        this.WalkNode(index ctx wr)
        ctx.unsetInExpr()
        wr.out(")" false)

        this.shouldBeArray(obj ctx "itemAt expects an array as the first parameter.")
        this.shouldBeType("int" index ctx "itemAt expects an interger as the second parameter.")                        
    }
    

    fn cmdRemoveLast:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        
        def obj:CodeNode (call node getSecond ())
        ; def index:CodeNode (call node getThird ())

        ctx.setInExpr()
        this.WalkNode (obj ctx wr)
        wr.out (".dropRight(1)" false)
        ctx.unsetInExpr ()                    
        wr.out (")" false)

        this.shouldBeArray (obj ctx "itemAt expects an array as the first parameter.")                    
        ; this.shouldBeType ("int" index ctx "charAt expects an interger as the second parameter.")                       
    }
    
    fn mathLibCalled:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.addImport("scala.math")                           
    }

    fn cmdMathLibOp:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        
        wr.addImport ("scala.math")

        def op:CodeNode (call node getFirst ())
        def n1:CodeNode (call node getSecond ())

        wr.out(op.vref + "(" , false)
        ctx.setInExpr ()
        this.WalkNode (n1 ctx wr)
        ctx.unsetInExpr ()
        wr.out (")" false)

        this.shouldBeType ("double" n1 ctx "math operator expect a double as the first parameter.")                 
    }      


    fn cmdPrint:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        
        def n1:CodeNode (call node getSecond ())
        wr.newline()
        wr.out ("println(" false)
        ctx.setInExpr ()
        this.WalkNode (n1 ctx wr)
        ctx.unsetInExpr ()
        wr.out (")" true)

        this.shouldBeType ("string" n1 ctx "print expects a string as the first parameter.")                 
    }        
    


    fn cmdFor:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.newline()
        def listField:CodeNode (itemAt node.children (1))
        def nodeField:CodeNode (itemAt node.children (2))
        def indexField:CodeNode (itemAt node.children (3))
        def loopField:CodeNode (itemAt node.children (4))

        def subCtx:RangerAppWriterContext (call ctx fork ())
        
        def p:RangerAppParamDesc (new RangerAppParamDesc ())
        = p.name indexField.vref
        = p.value_type indexField.value_type
        = p.node indexField
        = p.nameNode indexField
        = p.is_optional false
        subCtx.defineVariable (p.name p)     

        def p2:RangerAppParamDesc (new RangerAppParamDesc ())
        = p2.name nodeField.vref
        = p2.value_type nodeField.value_type
        = p2.node nodeField
        = p2.nameNode nodeField
        = p2.is_optional false

        subCtx.defineVariable (p2.name p2)   

        wr.out ("for( " false)
        this.WalkNode (indexField subCtx wr)
        wr.out (" <- 0 until " false)
        this.WriteVRef(listField ctx wr)
        wr.out (".length ) {" true)

            wr.indent(1)

            wr.out(" val " false)
            this.WalkNode (nodeField subCtx wr)

            wr.out (" = " false)
            this.WriteVRef(listField ctx wr)
            wr.out ("(" false)
            this.WalkNode (indexField subCtx wr)
            wr.out (");" true)
            
            this.WalkNode (loopField subCtx wr)
                wr.newline()
            wr.indent(-1)
        wr.out ("}" true)

        this.shouldBeExpression (loopField ctx "For loop requires expression to evaluate.")  
    }

    fn cmdArrayLength:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        
        def n1:CodeNode (call node getSecond ())
        ctx.setInExpr ()
        this.WalkNode (n1 ctx wr)
        ctx.unsetInExpr ()
        wr.out (".length" false)

        node.eval_type = RangerNodeType.Integer
        node.eval_type_name = "int"

    } 
    fn cmdStrlen:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

        def n1:CodeNode (call node getSecond ())
        ctx.setInExpr ()
        this.WalkNode (n1 ctx wr)
        ctx.unsetInExpr ()
        wr.out (".length()" false)

        this.shouldBeType ("string" n1 ctx "strlen expects a string as the first parameter.")
        
    }


    fn cmdHas:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        
        def obj:CodeNode (call node getSecond ())
        def key:CodeNode (call node getThird ())

        if ( > (call ctx expressionLevel ()) 1 ) {
            wr.out ("(" false)
        }

        ctx.setInExpr ()
        this.WalkNode (obj ctx wr)
        wr.out (".contains(" false)
        this.WalkNode (key ctx wr)
        wr.out (")" false)
        ctx.unsetInExpr ()

        if ( (call ctx expressionLevel ()) > 1 ) {
            wr.out (")" false)
        }

        ; TODO: check hash type
        this.shouldBeType ("string" key ctx "has expects a string as the second parameter.")
    }

    fn cmdSet:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
        def obj:CodeNode (call node getSecond ())
        def key:CodeNode (call node getThird ())
        def value:CodeNode (itemAt node.children (3))

        wr.newline()
        
        ctx.setInExpr ()
        this.WalkNode (obj ctx wr)
        wr.out (".put(" false)
        this.WalkNode (key ctx wr)
        wr.out ("," false)
        this.WalkNode (value ctx wr)
        ctx.unsetInExpr ()
        wr.out (");" true)

        (call RangerAllocations moveOwnership (obj value ctx wr))
    }
     
    fn cmdGet:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        
        def obj:CodeNode (call node getSecond ())
        def key:CodeNode (call node getThird ())

        if ( > (call ctx expressionLevel ()) 1 ) {
            wr.out ("(" false)
        }
        ctx.setInExpr ()
        this.WalkNode (obj ctx wr)
        wr.out (".get(" false)
        this.WalkNode (key ctx wr)
        wr.out (").asInstanceOf[" false)
        ; wr.out(obj.)
        ; find variables type 

        def p:RangerAppParamDesc (call RangerAllocations findParamDesc (obj ctx wr))
        def nameNode p.nameNode

        wr.out( ( getTypeString( nameNode.array_type )) false)
        ; this.writeTypeDef( p.nameNode ctx wr )

        wr.out ("]" false)
        ctx.unsetInExpr ()
        if ( > (call ctx expressionLevel ()) 1 ) {
            wr.out (")" false)
        }

        @todo("get should return a weak reference")
    }

    fn cmdPush:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
        def obj:CodeNode (call node getSecond ())
        def value:CodeNode (call node getThird ())

        wr.newline()
        
        ctx.setInExpr ()
        this.WalkNode (obj ctx wr)
        wr.out (".append(" false)
        this.WalkNode (value ctx wr)
        ctx.unsetInExpr ()
        wr.out (");" true)

        this.shouldBeArray(obj ctx "push expects an array as the first parameter.")        
        ; (call RangerAllocations moveOwnership (obj value ctx wr))
    }

    fn cmdJoin:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
        def obj:CodeNode (call node getSecond ())
        def value:CodeNode (call node getThird ())

        ctx.setInExpr ()
        this.WalkNode (obj ctx wr)
        wr.out (".mkString(" false)
        this.WalkNode (value ctx wr)
        ctx.unsetInExpr ()
        wr.out (")" false)

        this.shouldBeArray(obj ctx "join expects an array as the first parameter.")        
        this.shouldBeType("string" value ctx "join expects a string as the second parameter.")                        
        ; (call RangerAllocations moveOwnership (obj value ctx wr))
    }

    fn cmdSplit:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

        ; TODO: miten konvertoida ArrayBufferiksi ???

        def n1:CodeNode (call node getSecond ())
        def n2:CodeNode (call node getThird ())

        ctx.setInExpr ()
        this.WalkNode (n1 ctx wr)
        wr.out (".split(" false)        
        this.WalkNode (n2 ctx wr)
        ctx.unsetInExpr ()
        wr.out (").to[collection.mutable.ArrayBuffer]" false)
        
        this.shouldBeType ("string" n1 ctx "strsplit expects a string as the first parameter.")
        this.shouldBeType ("string" n2 ctx "strsplit expects a string as the second parameter.")

    }     


    fn cmdCharcode:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

        def n1:CodeNode (call node getSecond ())

        ctx.setInExpr ()
        wr.out ("(" false)
        this.WalkNode (n1 ctx wr)
        wr.out (".charAt(0).toInt)" false)      

        this.shouldBeType ("string" n1 ctx "charcode expects a string as the first parameter.")

    }    
 
    fn cmdCharAt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
        
        def obj:CodeNode (call node getSecond ())
        def value:CodeNode (call node getThird ())

        ctx.setInExpr ()
        wr.out ("(" false)
        this.WalkNode (obj ctx wr)
        wr.out (".charAt(" false)
        this.WalkNode (value ctx wr)
        ctx.unsetInExpr ()
        wr.out (").toInt" false)
        wr.out (")" false)

        this.shouldBeType("int" value ctx "charAt expects an interger as the third parameter.")                        
        
        ; this.shouldBeArray(obj ctx "push expects an array as the first parameter.")        
        ; (call RangerAllocations moveOwnership (obj value ctx wr))
    }

    fn cmdSubstring:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
        def n1:CodeNode (call node getSecond ())
        def start:CodeNode (call node getThird ())
        def end:CodeNode (itemAt node.children (3))

        ctx.setInExpr ()
        this.WalkNode (n1 ctx wr)
        wr.out (".substring(" false)
        this.WalkNode (start ctx wr)
        wr.out(", " false)
        this.WalkNode (end ctx wr)
        ctx.unsetInExpr ()
        wr.out (")" false)

        (call this shouldBeType ("string" n1 ctx "substring expects a string as the first parameter."))
        (call this shouldBeType ("int" start ctx "substring expects an integer as the second parameter."))
        (call this shouldBeType ("int" end ctx "substring expects an integer as the third parameter."))

        ; this.shouldBeArray(obj ctx "push expects an array as the first parameter.")        
        ; (call RangerAllocations moveOwnership (obj value ctx wr))
    }

    (PublicMethod cmdStrfromcode:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter)
        (
            (def n1:CodeNode (call node getSecond ()))
            (call ctx setInExpr ())
            (call wr out ("(" false))
            (call this WalkNode (n1 ctx wr))
            (call wr out (".toChar)" false))
            (call ctx unsetInExpr ())

            (call this shouldBeType ("int" n1 ctx "strfromcode expects an integer as the first parameter."))
            
        )
    )      
    

    fn cmdArgv:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("/* RangerIO.readArg() */ \"\"" false)                 
    }

    fn cmdArgvCnt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("/* RangerIO.argCount() */ 0" false)
    }

    fn cmdFileRead:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("/* RangerIO.ReadFile() */ \"\" " false)
    }

    fn cmdFileWrite:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("/* RangerIO.FileWrite() */" false)
    }

    fn cmdIsFile:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("/* RangerIO.IsFile() */ false " false)
    }

    fn cmdIsDir:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("/* RangerIO.IsDir() */  false" false)
    }

    fn cmdCreateDir:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("/* RangerIO.CreateDir() */ " false)
    }

    fn PublicMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

        def nameDef:CodeNode (call node getSecond ())
        wr.newline()
        wr.out(" " true)
        wr.out("def " false)
                
        wr.out ( (+ " " nameDef.vref "(") false ) 

        def args:CodeNode (call node getThird ())

        for args.children arg:CodeNode i {
            if (> i 0) {
                wr.out (", " false)
            }

            wr.out (arg.vref false)
            wr.out( ":" false)
            this.writeTypeDef( arg ctx wr )            
        }
        wr.out ( ") : " false )
        
        this.writeTypeDef( nameDef ctx wr )
        
        wr.out(" = { " true ) 

        ctx.setInMethod ()
        wr.indent(1)

        def fnBody:CodeNode (itemAt node.children 3)
        def has_try_catch:boolean false
        def try_catch:CodeNode

        ; see if there is error processing 
        if (call fnBody hasExpressionProperty ("onError")) {
            try_catch = (call fnBody getExpressionProperty ("onError"))               
            wr.out("try {" true)
            wr.indent(1)    
        }  

        this.WalkNodeChildren (fnBody ctx wr)
        wr.newline()
        wr.indent(-1)
        if (call fnBody hasExpressionProperty ("onError")) {
            wr.out("} catch {" true)
            wr.indent(1)
                wr.out("case e: Exception => {" true)
                wr.indent(1)
                    this.WalkNodeChildren (try_catch ctx wr)
                wr.indent(-1)
                wr.out("}" true)
            wr.indent(-1)
            wr.out("}" true)
            wr.indent(-1)
        }
        wr.out ( (+ "}") true ) 
        ctx.unsetInMethod ()
    }

    fn Constructor (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
            
        (def subCtx:RangerAppWriterContext (call ctx fork ()))
            ; (call wr out ( node.vref false ))
        (def cw:CodeWriter wr)

        (def cParams:CodeNode (itemAt node.children 1))

        (for cParams.children cn:CodeNode i
        (
            (def p:RangerAppParamDesc (new RangerAppParamDesc ()))
            (= p.name cn.vref)
            (= p.value_type cn.value_type)
            (= p.node cn)
            (= p.nameNode cn)
            (= p.varType RangerContextVarType.FunctionParameter)
            (= p.is_optional false)
            (call subCtx defineVariable (p.name p))                        
        )
        )

        (def cBody:CodeNode (call node getThird ()))
        (call ctx setInMethod ())
        (call this WalkNode (cBody subCtx cw))
        (call ctx unsetInMethod ())
        
    }  

    fn CreateClass:void (node:CodeNode ctx:RangerAppWriterContext inputWriter:CodeWriter) {

        def nameDef:CodeNode (call node getSecond ())
        def classInfo:RangerAppClassDesc (call ctx findClass (nameDef.vref))
        def wr:CodeWriter (call ctx getFileWriter ("." (+ nameDef.vref ".scala")))

        def importFork:CodeWriter (call wr fork ())

        wr.newline()
        wr.out ( (+ "class " nameDef.vref "" ) false ) 

        ; write the constructor parameters over here...

        if classInfo.has_constructor {
            wr.out("(" false)
            def constr:CodeNode classInfo.constructor_node)
            def cParams:CodeNode (call constr getSecond ()))
            for cParams.children param:CodeNode i {
                if (> i 0) {
                    wr.out(", " false)
                }
                wr.out (param.vref false)
                wr.out( ":" false)
                this.writeTypeDef( param ctx wr )
            }
            wr.out(") " false)
        }        

        def b_extended:boolean false
        
        ; TODO: extends does not work properly, does not call the parent class initializer here yet...
        if (> (array_length classInfo.extends_classes) 0) {
            wr.out (" extends " false)                    
            b_extended = true        
            for classInfo.extends_classes pName:string i {
                if (> i 0) {
                    wr.out ("," false)
                }
            }
        }

        wr.out ( " {" true )
            wr.indent(1)
            wr.out ("" true)

            def paramWr:CodeWriter (call wr createTag ("properties"))            
            def cw:CodeWriter (call wr createTag ("constructor"))


            def fnBody:CodeNode (itemAt node.children 2)
            this.WalkNodeChildren (fnBody ctx wr)

            wr.indent(-1)
        wr.out ( (+ "}") true )

        def import_list:[string] (call wr getImports ())
        for import_list codeStr:string i {
            importFork.out ((+ "import " codeStr "") true)
        }
    }

    ; perhaps the params should be different to support for example constructor and
    ; desctuctor variables and others

    fn DefineVar:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

        @todo("entering the constructor possibly requires constructor context: check if this is true for init. 
=> Also check the immutable variables (var/val) for scala")

        def v:CodeNode (call node getSecond ())

        wr.newline()
        wr.out( "var " false )
        wr.out( v.vref  false )
        wr.out(": " false)
        this.writeTypeDef( v ctx wr )

        if (> (array_length node.children) 2) {                
            wr.out ( " = " false)
            ctx.setInExpr ()
            this.WalkNode ((call node getThird ()) ctx wr)
            ctx.unsetInExpr ()
        } {
            switch v.value_type {
                case RangerNodeType.Hash {
                    wr.addImport("scala.collection.mutable")
                    wr.out( " = collection.mutable.Map[" + (getObjectTypeString v.key_type) + ", " + (getObjectTypeString v.array_type) + "]()" , true)
                    return _
                }
                case RangerNodeType.Array {
                    wr.addImport("scala.collection.mutable")
                    wr.out( " = collection.mutable.ArrayBuffer["  + (getObjectTypeString v.array_type) + "]()" , true)
                    return _
                }
            }
            if (false == (call ctx isInMethod ()) ) {
                wr.out ( " = _ " false)
            }
        }
        wr.out ( "" true)
    }
}