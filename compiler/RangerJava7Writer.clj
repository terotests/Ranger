
Import "RangerCommonWriter.clj"

class RangerJava7Writer {
    
    Extends (RangerCommonWriter)

    fn getWriterLang:string () { return "Java7" }

    fn getCmdName:string (cmd:string) {
        switch cmd {
            case "push" { return "add" }
            default { return cmd }
        }
    }

    fn getObjectTypeString:string (type_string:string) {

        switch type_string {
            case "int" {
                return "Integer"
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
                return "int"
            }
            case "string" {
                return "String"
            }
            case "boolean" {
                return "boolean"
            }
            case "double" {
                return "double"
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
                wr.out("int" false)
            }
            case RangerNodeType.Double {
                wr.out("double" false)
            }
            case RangerNodeType.String {
                wr.out("String" false)
            }
            case RangerNodeType.Boolean {
                wr.out("boolean" false)
            }
            case RangerNodeType.Hash {
			    wr.addImport("java.util.*")
                wr.out( "Map<" + (getObjectTypeString node.key_type) + ", " + (getObjectTypeString node.array_type) + ">" , false)
            }
            case RangerNodeType.Array {
                ; ArrayList
                ; TODO: add generics support
			    wr.addImport("java.util.*")
                wr.out( "ArrayList<" + (getObjectTypeString node.array_type) + ">" , false)
            }
            default {
                wr.out( node.type_name false )
            }
        }
    }

    fn cmdItemAt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        
        def obj:CodeNode (call node getSecond ())
        def index:CodeNode (call node getThird ())
            
        ctx.setInExpr ()
        this.WalkNode(obj ctx wr)
        wr.out(".get(" false)
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
        wr.out (".remove(" false)
        this.WalkNode (obj ctx wr)

        wr.out(".size() - 1" false)

        ctx.unsetInExpr ()                    
        wr.out (")" false)

        this.shouldBeArray (obj ctx "itemAt expects an array as the first parameter.")                    
        ; this.shouldBeType ("int" index ctx "charAt expects an interger as the second parameter.")                       
    }
    
    fn mathLibCalled:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.addImport("java.lang.Math")                           
    }

    fn cmdPrint:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        
        wr.addImport ("java.io.*")

        def n1:CodeNode (call node getSecond ())
        wr.newline()
        wr.out ("System.out.println(String.valueOf(" false)
        ctx.setInExpr ()
        this.WalkNode (n1 ctx wr)
        ctx.unsetInExpr ()
        wr.out ("));" true)
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

        wr.out ("for( int " false)
        this.WalkNode (indexField subCtx wr)
        wr.out ("= 0; " false)
        this.WalkNode (indexField subCtx wr)
        wr.out ("< " false)
            this.WriteVRef(listField ctx wr)
            wr.out (".size(); " false)
            this.WalkNode (indexField subCtx wr)
            wr.out ("++) { " true)
            wr.indent(1)

            @todo("JAVA: erillinen data-tyypin kirjoittamisfunktio tarvitaan esim. genericsejä varten")

            wr.out ("// FIX the TYPE names here" true)
            wr.out (nodeField.type_name false)

            wr.out (" " false)
            this.WalkNode (nodeField subCtx wr)
            wr.out (" = " false)
            this.WriteVRef(listField ctx wr)

            wr.out (".get(" false)
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
        wr.out (".size()" false)

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
        wr.out (".containsKey(" false)
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
        wr.out (")" false)
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
        wr.out (".add(" false)
        this.WalkNode (value ctx wr)
        ctx.unsetInExpr ()
        wr.out (");" true)

        this.shouldBeArray(obj ctx "push expects an array as the first parameter.")        
        ; (call RangerAllocations moveOwnership (obj value ctx wr))
    }

    fn cmdJoin:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
        def obj:CodeNode (call node getSecond ())
        def value:CodeNode (call node getThird ())

        wr.addImport ("org.apache.commons.lang.StringUtils")

        ctx.setInExpr ()
        wr.out ("StringUtils.join(" false)
        this.WalkNode (value ctx wr)
        wr.out (", " false)        
        this.WalkNode (obj ctx wr)
        ctx.unsetInExpr ()
        wr.out (")" false)

        this.shouldBeArray(obj ctx "join expects an array as the first parameter.")        
        this.shouldBeType("string" value ctx "join expects a string as the second parameter.")                        
        ; (call RangerAllocations moveOwnership (obj value ctx wr))
    }

    fn cmdJoin:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

		wr.addImport("java.util.*")

        def n1:CodeNode (call node getSecond ())
        def n2:CodeNode (call node getThird ())

        ctx.setInExpr ()
        wr.out ("new ArrayList<String>(Arrays.asList(" false)
        this.WalkNode (n1 ctx wr)
        wr.out (".split(" false)        
        this.WalkNode (n2 ctx wr)
        ctx.unsetInExpr ()
        wr.out ("))" false)
        
        this.shouldBeType ("string" n1 ctx "strsplit expects a string as the first parameter.")
        this.shouldBeType ("string" n2 ctx "strsplit expects a string as the second parameter.")

    }   

    fn cmdCharcode:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

        def n1:CodeNode (call node getSecond ())

        ctx.setInExpr ()
        wr.out ("((int)" false)
        this.WalkNode (n1 ctx wr)
        wr.out (".charAt(0))" false)      

        this.shouldBeType ("string" n1 ctx "charcode expects a string as the first parameter.")

    }    
 
    fn cmdCharAt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
    
        def obj:CodeNode (call node getSecond ())
        def value:CodeNode (call node getThird ())

        ctx.setInExpr ()
        this.WalkNode (obj ctx wr)
        wr.out (".charAt(" false)
        this.WalkNode (value ctx wr)
        ctx.unsetInExpr ()
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
    

    fn cmdArgv:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("RangerIO.readArg()" false)                 
    }

    fn cmdArgvCnt:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("RangerIO.argCount()" false)
    }

    fn cmdFileRead:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("RangerIO.ReadFile()" false)
    }

    fn cmdFileWrite:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("RangerIO.FileWrite()" false)
    }

    fn cmdIsFile:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("RangerIO.IsFile()" false)
    }

    fn cmdIsDir:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("RangerIO.IsDir()" false)
    }

    fn cmdCreateDir:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
        wr.out ("RangerIO.CreateDir()" false)
    }

    ; note: so similar to PublicMethod merge these...
    fn StaticMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

        def nameDef:CodeNode (call node getSecond ())
        wr.newline()
        wr.out(" " true)
        wr.out("static " false)
        
        this.writeTypeDef( nameDef ctx wr )
        
        wr.out ( (+ " " nameDef.vref "(") false ) 

        def args:CodeNode (call node getThird ())

        for args.children arg:CodeNode i {
            if (> i 0) {
                wr.out (", " false)
            }
            this.writeTypeDef( arg ctx wr )
            wr.out ( " " + arg.vref , false)
        }
        wr.out ( ") { " true ) 

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
            wr.out("} catch( Exception e ) {" true)
            wr.indent(1)
            this.WalkNodeChildren (try_catch ctx wr)
            wr.indent(-1)
            wr.out("}" true)
            wr.indent(-1)
        }
        wr.out ( (+ "}") true ) 
        ctx.unsetInMethod ()
    }


    fn PublicMethod:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

        def nameDef:CodeNode (call node getSecond ())
        wr.newline()
        wr.out(" " true)
        wr.out("public " false)
        
        this.writeTypeDef( nameDef ctx wr )
        
        wr.out ( (+ " " nameDef.vref "(") false ) 

        def args:CodeNode (call node getThird ())

        for args.children arg:CodeNode i {
            if (> i 0) {
                wr.out (", " false)
            }
            this.writeTypeDef( arg ctx wr )
            wr.out ( " " + arg.vref , false)
        }
        wr.out ( ") { " true ) 

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
            wr.out("} catch( Exception e ) {" true)
            wr.indent(1)
            this.WalkNodeChildren (try_catch ctx wr)
            wr.indent(-1)
            wr.out("}" true)
            wr.indent(-1)
        }
        wr.out ( (+ "}") true ) 
        ctx.unsetInMethod ()
    }

    fn CreateClass:void (node:CodeNode ctx:RangerAppWriterContext inputWriter:CodeWriter) {

        def nameDef:CodeNode (call node getSecond ())
        def classInfo:RangerAppClassDesc (call ctx findClass (nameDef.vref))
        def wr:CodeWriter (call ctx getFileWriter ("." (+ nameDef.vref ".java")))

        def importFork:CodeWriter (call wr fork ())

        wr.newline()
        wr.out ( (+ "class " nameDef.vref " " ) false ) 

        def b_extended:boolean false
        
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
            cw.out("" true)
            cw.out((+ "public " nameDef.vref "(") false)

            if classInfo.has_constructor {
                def constr:CodeNode classInfo.constructor_node)
                def cParams:CodeNode (call constr getSecond ()))
                for cParams.children param:CodeNode i {
                    if (> i 0) {
                        cw.out(", " false)
                    }
                    cw.out (param.vref false)
                }
            }

            cw.out (") {" true)
            cw.indent (1)

            if b_extended {
                cw.out ("super()" true)
            }
            def fnBody:CodeNode (itemAt node.children 2)
            this.WalkNodeChildren (fnBody ctx wr)
            cw.indent (-1)
            cw.out ("}" true)
            wr.indent(-1)
        wr.out ( (+ "}") true )

        def import_list:[string] (call wr getImports ())
        for import_list codeStr:string i {
            importFork.out ((+ "import " codeStr ";") true)
        }
    }

    ; perhaps the params should be different to support for example constructor and
    ; desctuctor variables and others

    fn DefineVar:void (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {

        if (call ctx isInMethod ()) {

            def v:CodeNode (call node getSecond ())

            wr.newline()
            this.writeTypeDef( v ctx wr )
            wr.out( " " + v.vref , false )

            ; case RangerNodeType.Hash {

            if (> (array_length node.children) 2) {                
                wr.out ( " = " false)
                ctx.setInExpr ()
                this.WalkNode ((call node getThird ()) ctx wr)
                ctx.unsetInExpr ()
            } {
                switch v.value_type {
                    case RangerNodeType.Hash {
    		    	    wr.addImport("java.util.*")
                        wr.out( "HashMap<" + (getObjectTypeString v.key_type) + ", " + (getObjectTypeString v.array_type) + ">();" , true)
                        return _
                    }
                    case RangerNodeType.Array {
    		    	    wr.addImport("java.util.*")
                        wr.out( "ArrayList<"  + (getObjectTypeString v.array_type) + ">();" , true)
                        return _
                    }
                    default {
                        wr.out ( "" false)
                    }
                }
            }
            wr.out ( ";" true)
        } {


            def propWr:CodeWriter (call wr getTag ("properties"))            
            def v:CodeNode (call node getSecond ())

            propWr.newline()
            propWr.out("public " false)
            this.writeTypeDef( v ctx propWr )
            propWr.out( " " + v.vref + "; ", true )

            def cw:CodeWriter (call wr getTag ("constructor"))
            
            @todo("entering the constructor possibly requires constructor context: check if this is true for init")

            if (> (array_length node.children) 2) {                

                cw.newline()
                cw.out ( v.vref + " = " , false )
                ctx.setInExpr ()
                this.WalkNode ((call node getThird ()) ctx cw)
                ctx.unsetInExpr ()
                cw.out( ";" true)

            } {
                switch v.value_type {
                    case RangerNodeType.Hash {
    		    	    cw.addImport("java.util.*")
                        cw.newline()
                        cw.out ( v.vref + " = " , false )        
                        cw.out( "HashMap<" + (getObjectTypeString v.key_type) + ", " + (getObjectTypeString v.array_type) + ">();" , true)
                    }
                    case RangerNodeType.Array {
    		    	    cw.addImport("java.util.*")
                        cw.newline()
                        cw.out ( v.vref + " = " , false )        
                        cw.out( "ArrayList<"  + (getObjectTypeString v.array_type) + ">();" , true)
                    }
                    default {
                        
                    }
                }
            }
        }
    }
}