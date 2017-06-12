language {

    name "Ranger"

    ; compilation targets might be defined here like this
    targets {
        ; short     common name     file extension
        es5         ES5             js 
        es6         JavaScript      js
        java7       Java7           java
        kotlin      Kotlin          kt
        scala       Scala           scala
        cpp         Cpp             cpp
        csharp      CSharp          cs
        swift3      Swift3          swift
        ts          TypeScript      ts
        flow        Flow            flow
        go          Golang          go
        php         PHP             php
    }

    commands {

        ; Profiling

        timer           cmdTimerBlock:void (name:string code:block) {
            templates {
                ; start := time.Now()
                go ( "for {" nl I nl "_start := time.Now()" nl (block 2) nl "fmt.Println(" (e 1) ", time.Since(_start) )" nl "break;" i nl "}" (imp "time") (imp "fmt") )
                swift3 ( "do {" nl I nl "let _start = CFAbsoluteTimeGetCurrent()" nl (block 2) nl "print(" (e 1) ", CFAbsoluteTimeGetCurrent() - _start )" i nl "}" (imp "CoreFoundation") )
                es6 ( "console.time(" (e 1) ");" nl (block 2) nl "console.timeEnd(" (e 1) ");" )
                php ( nl "$time_start = microtime(true);" nl (block 2) nl "$time_end = microtime(true);" nl "echo(" (e 1) ".($time_end - $time_start).\"\\n\");" nl)
                * ( (block 2) )
            }
        }

        ; I/O 

        readfile        cmdReadFile@(optional):string (path:string filename:string) {
            templates {
                php ("file_get_contents(" (e 1) " . \"/\" . " (e 2) ") " )
                swift3 ("try String(contentsOfFile: " (e 1) " + \"/\" + " (e 2) ") " )
                java7 ( "new String(readAllBytes(get(" (e 1) " + \"/\" + " (e 2) " )))"  (imp "java.nio.file.Paths.get") (imp "java.nio.file.Files.readAllBytes") )
                scala ( "Try(Source.fromFile(" (e 1) " + \"/\" + " (e 2) ").getLines.mkString).toOption" (imp "scala.io.Source") (imp "scala.util.Try"))
                go (  "r_io_read_file(" (e 1) ", " (e 2) ")" (imp "io/ioutil")
(create_polyfill "

// polyfill for reading files
func r_io_read_file( path string , fileName string ) *GoNullable {
   res := new(GoNullable);
   if v, err := ioutil.ReadFile(path + \"/\" + fileName); err == nil {
     res.has_value = true
     res.value = string(v)
   } else {
     res.has_value = false
   }
   return res 
}
"))
                es6 ( "(require('fs').readFileSync( process.cwd() + '/' + " (e 1) " + '/' + " (e 2) " , 'utf8'))" )
            }
        }

        ; 
        =               cmdAssign@(moves@( 2 1 ) ):void            ( left:T right:T )  { 
            templates { 
                scala ( nl (e 1) " = " (e 2) nl )                 
                * ( nl (e 1) " = " (e 2) ";" nl ) 
            } 
        }   


        =               cmdAssign@(moves@( 2 1 ) ):void            ( left@(optional):T right:T )  { 
            templates { 
                scala ( nl (e 1) " = Some(" (e 2) ")" nl )  
                swift ( nl (e 1) " = Optional(" (e 2) ");" nl )   
                java7 ( nl (e 1) " = Optional.of(" (e 2) ");" nl )   
                go ( nl (e 1) ".value = " (e 2) ";" nl nl (e 1) ".has_value = true;" nl )  
                cpp ( nl (e 1) "->value = " (e 2) ";" nl nl (e 1) "->has_value = true;" nl )                 
                * ( nl (e 1) " = " (e 2) ";" nl ) 
            } 
        }           

        =               cmdAssign@(moves@( 2 1 ) ):void            ( left@(optional):T right@(optional):T )  { 
            templates { 
                scala ( nl (e 1) " = " (e 2) nl )      
                go ( nl (e 1) ".value = " (e 2) ".value;" nl nl (e 1) ".has_value = " (e 2) ".has_value;" nl )  
                cpp ( nl (e 1) "->value = " (e 2) "->value;" nl nl (e 1) "->has_value = " (e 2) "->has_value;" nl )             
                * ( nl (e 1) " = " (e 2) ";" nl ) 
            } 
        }  

        empty       cmdEmpty@(optional):T        ( node@(ignore):T ) {
            templates {
                scala ( "Option.empty[(" (e 1) ")" )
                swift3 (  "nil" )
                csharp ( "(" (typeof 1) "?)" (e 1)  )
                cpp ( (e 1) )
                java7 ( "Optional.of(" (e 1 ) ")")
                go ( (e 1 ) )
                * ( "undefined")
            }
        }

        wrap       cmdWrap@(optional):T        ( arg:T ) {
            templates {
                scala ( "Some(" (e 1) ")" )
                swift3 (  "Optional(" (e 1) ")" )
                csharp ( "(" (typeof 1) "?)" (e 1)  )
                cpp ( (e 1) )
                java7 ( "Optional.of(" (e 1 ) ")")
                go ( (e 1 ) )
                php ( (e 1 ) )
                * ( (e 1) )
            }
        }


        !!       cmdUnwrap:T        ( arg@(optional):T ) {
            templates {
                scala ( (e 1) ".get" )
                csharp ( (e 1) ".Value" )
                java7 ( (e 1) ".get()" )
                rust ( (e 1) ".unwrap()" )
                php ( (e 1 ) )
                kotlin ( (e 1) "!!" )
                swift3 ( (e 1) "!" )
                go ( (e 1) ".value.(" (typeof 1) ")" )
                cpp ( "static_cast<" (typeof 1) ">(" (e 1) "->value)" )

                * ( (e 1) )
            }
        }        


        unwrap       cmdUnwrap:T        ( arg@(optional):T ) {
            templates {
                scala ( (e 1) ".get" )
                csharp ( (e 1) ".Value" )
                java7 ( (e 1) ".get()" )
                rust ( (e 1) ".unwrap()" )
                php ( (e 1 ) )
                kotlin ( (e 1) "!!" )
                swift3 ( (e 1) "!" )
                go ( (e 1) ".value.(" (typeof 1) ")" )
                cpp ( "static_cast<" (typeof 1) ">(" (e 1) "->value)" )

                * ( (e 1) )
            }
        }



        ; TODO: could be varname@(mutable), but the compiler may not be able to determine the
        ; mutability before the code has been processed through... 

        def             cmdDef:void            ( varname:[T] )  { 
            templates { 
                * ( nl "var " (nameof 1) " = [];" nl )
            } 
        }     

        def             cmdDef:void            ( varname:[K:T] )  { 
            templates { 
                * ( nl "var " (nameof 1) " = {};" nl )
            } 
        }     


        def             cmdDef:void            ( varname:T )  { 
            templates { 
                scala@(mutable) ( nl "var " (e 1) ":" (typeof 1 ) " /* mutable uninitialized value */" nl ) 
                scala ( nl "val " (e 1) ":" (typeof 1 ) " /* immutable uninitialized value */" nl )    
                java7 (nl (typeof 1) " " (e 1) ";" nl)             
                es6@(mutable) ( nl "let " (e 1) ";" nl ) 
                es5@(mutable) ( nl "var " (e 1) ";" nl ) 
                * ( nl "const " (e 1) ";" nl ) 
            } 
        }      

        def             cmdDef:void            ( varname:T value:T )  { 
            templates { 
                scala@(mutable) ( nl "var " (e 1) ":" (typeof 1 )" = " (e 2) " /* mutable value */" nl ) 
                scala ( nl "val " (e 1) ":" (typeof 1 )" = " (e 2) " /* immutable value */" nl ) 
                java7 (nl (typeof 1) " " (e 1) " = " (e 2) ";" nl)
                es6@(mutable) ( nl "let " (e 1) " = " (e 2) ";" nl )
                es6 ( nl "const " (e 1) " = " (e 2) ";" nl )
                * ( nl "var " (e 1) " = " (e 2) ";" nl )
            } 
        }     

        

        def             cmdDef:void            ( varname@(mutable):T value:T )  { 
            templates { 
                scala( nl "var " (e 1) ":" (typeof 1 )" = " (e 2) " /* mutable def value */" nl ) 
                java7 (nl (typeof 1) " " (e 1) " = " (e 2) ";" nl)
                es6 ( nl "let " (e 1) " = " (e 2) ";" nl )
                * ( nl "var " (e 1) " = " (e 2) ";" nl )
            } 
        }      
                
        return  cmdReturn@(returns@(1)):T          ( value:T ) {
            templates { 
                * ( "return " (ifa 1 ";") (e 1) (eif _) ";" )
            }
        }        

        =               cmdAssign:void            ( left@(optional):T right:T )  { 
            templates { 
                scala ( nl (e 1) " = " (e 2) ".get /* scala optional assigment of values * / " nl )                 
                * ( nl (e 1) " = " (e 2) ";" nl ) 
            } 
        }      

        =               cmdAssign:void            ( left:T right@(optional):T )  { 
            templates { 
                swift3 (  nl (e 1) " = Optional(" (e 2) ")" )
                
                scala ( nl (e 1) " = " (e 2) ".get /* scala optional assigment of values * / " nl )                 
                * ( nl (e 1) " = " (e 2) ";" nl ) 
            } 
        }      

        =               cmdAssign:void            ( left@(optional):T right@(optional):T )  { 
            templates { 
                scala ( nl (e 1) " = " (e 2) " /* scala optional assigment of values * / " nl )                 
                * ( nl (e 1) " = " (e 2) ";" nl ) 
            } 
        }      
        

        ; numeric - operations
        -               cmdMinusOp:double            ( left:double right:double )  { templates { * ( (e 1) " - " (e 2) ) } }      
        -               cmdMinusOp:int            ( left:int right:int )  { templates { * ( (e 1) " - " (e 2) ) } }      

        ; numeric + operations
        +               cmdPlusOp:double             ( left:double right:double ) { templates { * ( (e 1) " + " (e 2) ) } }

        ; random tests, remove these later:
        +               cmdUnwrappingPlusOp:int                ( left:int right@(optional):int ) {
                        
            code {
                return left + (unwrap right)
            }

        }

        +               cmdPlusOp:int                ( left:int right@(optional):int ) { 
            templates { * ( (e 1) " + " (e 2) "? /* optional add*/" ) } 
        }
        
        +               cmdPlusOp:int                ( left@(mutable):int right@(optional):int ) { 
            templates { * ( (e 1) " + " (e 2) "? /* optional add*/" ) } 
        }
        +               cmdPlusOp:int                ( left@(mutable):int right:int ) { templates { * ( (e 1) " + " (e 2) " /* mutable add*/" ) } }
        +               cmdPlusOp:int                ( left@(mutable):int right:int ) { templates { * ( (e 1) " + " (e 2) " /* mutable add*/" ) } }

        ; random tests end
        +               cmdPlusOp:int                ( left:int right:int ) { templates { * ( (e 1) " + " (e 2) " /* add */" ) } }

        ; string + operations
        +               cmdPlusOp:string             ( left:string right:string ) { 
            templates { 
                go ( "strings.Join([]string{ " (e 1) "," (e 2) " }, \"\")" (imp "strings"))
                php ( (e 1) " . " (e 2) )
                * ( (e 1) " + " (e 2) ) 
            } 
        }
        
        +               cmdPlusOp:string             ( left:string right:double ) { 
                templates { 
                    go ( "strings.Join([]string{ " (e 1) ",strconv.FormatFloat(" (e 2) ",'f', 6, 64) }, \"\")" (imp "strings") (imp "strconv"))
                    rust ( "[" (e 1) " , (" (e 2)".to_string()) ].join(\"\")" )
                    swift3 ( (e 1) " + String(" (e 2)")" )
                    php ( (e 1) " . " (e 2) ) 
                    * ( (e 1) " + " (e 2) ) 
                } 
        }
        ; Go;
        ; strconv.Itoa
        +               cmdPlusOp:string             ( left:string right:int ) { 
                templates { 
                    go ( "strings.Join([]string{ " (e 1) ",strconv.FormatInt(" (e 2) ", 10) }, \"\")" (imp "strings") (imp "strconv"))
                    swift3 ( (e 1) " + String(" (e 2)")" )
                    rust ( "[" (e 1) " , (" (e 2)".to_string()) ].join(\"\")" )
                    php ( (e 1) " . " (e 2) ) 
                    * ( (e 1) " + " (e 2) ) 
                } 
        }
                
        +               cmdPlusOp:string             ( left:double right:string ) { 
            templates { 
                    * ( (e 1) " + " (e 2) ) 
                    php ( (e 1) " . " (e 2) ) 
                    rust ( "[" (e 1) " , " (e 2) " ].join()" )
                } 
            }

        +               cmdPlusOp:string             ( left:int right:string    ) { 
                    templates { * ( (e 1) " + " (e 2) ) 
                    php ( (e 1) " . " (e 2) ) 
                    } }


        *               cmdMulOp:double         ( left:double right:double ) { templates { * ( (e 1) " * " (e 2) ) } }
        *               cmdMulOp:int            ( left:int right:int ) { templates { * ( (e 1) " * " (e 2) ) } }

        /               cmdDivOp:double         ( left:double right:double ) { templates { * ( (e 1) " / " (e 2) ) } }
        /               cmdDivOp:double         ( left:int right:int ) { templates { * ( (e 1) " / " (e 2) ) } }

        ?               cmdTernary:T         ( condition:boolean  left:T right:T ) { 
            templates { * ( (e 1) " ? " (e 2) " : " (e 3) ) } 
        }

        =               cmdAssign:void          ( target:vref expr:expression ) {
            templates {
                scala ( (e 1) " = " (e 2) )   ; <-- scala does not require ; here                
                * ( (e 1) " = " (e 2) ";" )
            }
        }

        int2double      cmdIntToDouble:double            ( value:int ) { 
                templates { 
                    * ( "parseFloat(" (e 1) ")" ) 
                } 
        }

        gitdoc      cmdGitDoc:void            ( value:string ) { 
                templates { 
                    * ( "/* git doc */" ) 
                } 
        }




; TODO: add the rest ....(case ("sin" "cos" "tan" "atan" "log" "abs" "acos" "asin" "floor" "round" "sqrt")
        ;"<cmath>"
        sin        cmdSin:double          (  value:double )  {
            templates {
                swift3 ( "sin(" (e 1) ")" (imp "Foundation"))               
                cpp ( "sin(" (e 1) ")" (imp "<cmath>"))
                csharp ( "Math.Sin(" (e 1) ")" (imp "System"))    
                go ( "math.Sin(" (e 1) ")" (imp "math"))                                
                php ( "sin(" (e 1) ")" )    
                rust ( "" (e 1) ".sin()" )                
                scala ( "math.sin(" (e 1) ")" (imp "scala.math"))                
                java7 ( "Math.sin(" (e 1) ")" (imp "java.lang.Math"))
                * ( "Math.sin(" (e 1) ")")
            }
        }

        sqrt        cmdSqrt:double          (  value:double )  {
            templates {
                swift3 ( "sqrt(" (e 1) ")" (imp "Foundation"))               
                cpp ( "sqrt(" (e 1) ")" (imp "<cmath>"))
                csharp ( "Math.Sqrt(" (e 1) ")" (imp "System"))                                
                php ( "sqrt(" (e 1) ")" )                
                go ( "math.Sqrt(" (e 1) ")" (imp "math"))  
                rust ( "" (e 1) ".sqrt()" )  
                scala ( "math.sqrt(" (e 1) ")" (imp "scala.math"))                
                java7 ( "Math.sqrt(" (e 1) ")" (imp "java.lang.Math"))
                rust ( (e 1) ".sqrt()" )
                * ( "Math.sqrt(" (e 1) ")")
            }
        }        

        if              cmdIf:void              ( condition:boolean then_block:block else_block:block )  {
            templates {
                rust ( "if  " (e 1) " {" I nl (block 2) i nl "}" (ifa 3) " else {" I (block 3) i "}" nl)
                go ( "if  " (e 1) " {" I nl (block 2) i nl "}" (ifa 3) " else {" I (block 3) i "}" nl)
                * ( "if ( " (e 1) " ) {" I nl (block 2) i nl "}" (ifa 3) " else {" I (block 3) i "}" nl)
            }
        }        
        
        if              cmdIf:void              ( condition:boolean then_block:block )  {
            templates {
                rust ( "if  " (e 1) " {" I nl (block 2) nl i "}" nl )
                go ( "if  " (e 1) " {" I nl (block 2) nl i "}" nl )
                * ( "if ( " (e 1) " ) {" I nl (block 2) nl i "}" nl )
            }
        }

        if              cmdIf:void              ( condition@(optional):T then_block:block )  {
            templates {
                scala ( "if ( " (e 1) ".isDefined ) {" nl I (block 2) i nl "}" nl )
                swift3 ( "if ( " (e 1) " != nil ) {" nl I (block 2) i nl "}" nl )
                kotlin ( "if ( " (e 1) " != null ) {" nl I (block 2) i nl "}" nl )
                java7 ( "if ( " (e 1) ".isPresent()) {" nl I (block 2) i nl "}" nl )
                csharp ( "if ( " (e 1) ".HasValue) {" nl I (block 2) i nl "}" nl )
                ; go ( "" (e 1 ) " == nil " ) 
                ; is_some
                php ( "if ( isset( " (e 1) " ) ) {" nl I (block 2) i nl "}" nl )
                go ( "if ( " (e 1) ".has_value) {" nl I (block 2) i nl "}" nl )
                cpp ( "if ( " (e 1) ".has_value) {" nl I (block 2) i nl "}" nl )
                rust ( "if " (e 1) ".is_some() {" nl I (block 2) i nl "}" nl )
                * ( "if ( typeof(" ( e 1 ) ") == \"undefined\" ) {" nl I (block 2) i nl "}" nl )

            }
        }

        if              cmdIf:void              ( condition@(optional):T then_block:block else_block )  {
            templates {
                php ( "if ( isset(" (e 1) ") ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                scala ( "if ( " (e 1) ".isDefined ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                java7 ( "if ( " (e 1) ".isPresent() ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                csharp ( "if ( " (e 1) ".HasValue ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                kotlin ( "if ( " (e 1) " != null ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                rust ( "if " (e 1) ".is_some() {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                swift3 ( "if ( " (e 1) " != nil ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                go ( "if ( " (e 1) ".has_value ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                go ( "if ( " (e 1) "->has_value ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
                * ( "if ( typeof(" ( e 1 ) ") == \"undefined\" ) {" I nl (block 2) i nl "} else {" nl I (block 3) i "}" nl)
            }
        }

        switch          cmdSwitch:void          ( condition:T case_list:block )  {
            templates {
                scala ( (e 1) " match { " I (block 2) i "}" )
                * ( "switch (" (e 1) " ) { " I (block 2) i "}" )
            }
        }       


        break           cmdBreak:void          ( )  {
            templates {
                scala ( nl "__b__.break;" nl )
                * ( nl "break;" nl )
            }
        }

        break           cmdBreak:void          ( _:T )  {
            templates {
                scala ( nl "__b__.break;" nl )
                * ( nl "break;" nl )
            }
        }

        continue        cmdContinue:void          ( )  {
            templates {
                scala ( nl "__c__.break;" nl )
                * ( nl "continue;" nl )
            }
        }
        
        continue        cmdContinue:void          ( _:T)  {
            templates {
                scala ( nl "__c__.break;" nl )
                * ( nl "continue;" nl )
            }
        }


        while           cmdWhile:void          ( condition:boolean whileLoop:block )  {
            templates {
                go ( "for " (e 1) " {" I (block 2) i "}" )
                scala ( 
                    (forkctx _ ) (def 2) (def 3) 
                    "try {" nl I
                    "val __b__ = new Breaks;" nl
                    "__b__.breakable { " 
                        nl I 
                            "while (" (e 1) ") {" nl
                                I
                                "val __c__ = new Breaks;" nl
                                "__c__.breakable {" nl
                                    I nl (block 2) nl i 
                                "}" nl i
                            "}"
                        i nl
                    "}" nl
                    i nl "} " nl
                    (imp "scala.util.control._")
                )                 
                * ( "while (" (e 1) ") {" I (block 2) i "}" )
            }
        }

        default        cmdDefault:void          (  default_block:block )  {
            templates {

                scala ( nl "case _ => " nl I (block 1) nl i )
                go ( nl "default: " nl I (block 1) nl i )
                * ( nl "default: " nl I (block 1) nl "break;" i )
            }
        }

        case        cmdCase:void          (  condition:T case_block:block )  {
            templates {

                scala ( nl "case " (e 1)" => " nl I (block 2) nl i )
                swift3 ( nl "case " (e 1)" : " nl I (block 2) nl i )
                java7 ( nl "case " (e 1)" : " nl I (java_case 2) nl i )
                go ( nl "case " (e 1)" : " nl I (block 2) nl i )
                * ( nl "case " (e 1)" : " nl I (block 2) nl "break;" i )
            }
        }

        []         cmdArrayLiteral:[T] ( typeDef@(ignore):T listOf:expression ) {
            templates {
                go ( "[]" (typeof 1) "{" (comma 2) "}")
                * ( "[" (comma 2) "]")
            }
        }

        
        null?       cmdIsNull:boolean        ( arg:T ) {
            templates {
                php ( "(!isset(" (e 1) "))")                                
                cpp ((e 1) "== NULL")                                
                swift3 ((e 1) " == nil") 
                kotlin ((e 1) "== null")                
                * ((e 1) "== null")
            }
        }

        null?       cmdIsNull:boolean        ( arg@(optional):T ) {
            templates {
                php ( "(!isset(" (e 1) "))")                                
                cpp ((e 1) "== NULL")                                
                swift3 ((e 1) " == nil")  
                java7 ("!" (e 1) ".isPresent()")  
                csharp ((e 1) ".HasValue")  
                rust ((e 1) ".is_null()")  
                cpp ((e 1) "== true ")
                go ( "!" (e 1 ) ".has_value " )             
                kotlin ((e 1) "== null")     
                es6 (  "typeof(" ( e 1 ) ") === \"undefined\"")
                * ((e 1) "== null")
            }
        }        

        !null?       cmdIsNotNull:boolean        ( arg@(optional):T ) {
            templates {
                php ( "(isset(" (e 1) "))")
                scala ((e 1) ".isDefined")  
                swift3 ((e 1) " != nil ")     
                cpp ((e 1) "== false ")     
                java7 ((e 1) ".isPresent()")   
                csharp ("!" (e 1) ".HasValue")
                rust ((e 1) ".is_some()")     
                kotlin ((e 1) " != null")     
                go (  (e 1 ) ".has_value" )
                * ("typeof(" ( e 1 ) ") !== \"undefined\"")
            }
        }
        

        !null?       cmdIsNotNull:boolean        ( arg:T ) {
            templates {
                php ( "(!sset(" (e 1) "))")                                
                cpp ((e 1) "!= NULL")                                
                swift3 ((e 1) "!= nil")      
                kotlin ((e 1) " != null")            
                * ((e 1) "!= null")
            }
        }
        
        
        throw        cmdThrow:void          (  eInfo:T  )  {
            templates {
                * ( nl "throw "  (e 1) ";" nl )
            }
        }        

        try          cmdTry:void          (  run_block:block catch_block:block  )  {
            templates {
                php ( nl "try {" nl I (block 1) i nl "} catch( Exception $e) {" nl I (block 2) i nl "}" nl )               
                scala ( nl "try {" nl I (block 1) i nl "} catch {" nl I nl "case e: Exception => {" nl I (block 2) i nl "}" i nl "}" nl )
                java7 ( nl "try {" nl I (block 1) i nl "} catch( Exception e) {" nl I (block 2) i nl "}" nl )
                * ( nl "try {" nl I (block 1) i nl "} catch(e) {" nl I (block 2) i nl "}" nl )
            }
        }

        ; T.name is a bit of a problem ??        
        for             cmdFor@(newcontext):void          ( list:[T] item@(define):T indexName@(define ignore):int repeat_block:block)  {
            templates {
                swift3 ( (forkctx _ ) (def 2) (def 3) nl "for ( " (swift_rc 3) " , " (e 2) " ) in " (e 1) ".enumerated() {" nl I (block 4) nl i "}" )
                kotlin ( (forkctx _ ) (def 2) (def 3) "for ( " (e 3) " in " (e 1) ".indices ) {" nl I "val " (e 2) " = " (e 1) "[" (e 3) "]" nl (block 4) nl i "}" )

                rust ( (forkctx _ ) (def 2) (def 3) "for (" (e 3) ", " (e 2) " ) in " (e 1) ".enumerate() {" nl I (block 4) nl i "}" )

                go    (  (def 2) (def 3) "var " (e 3) " int64 = 0;  " nl "for ; " (e 3) " < int64(len(" (e 1) ")) ; " (e 3) "++ {" nl I nl (e 2) " := " (e 1) "[" (e 3) "];" nl (block 4) nl i "}" )

                php    ( (forkctx _ ) (def 2) (def 3) "for ( " (e 3) " = 0; " (e 3) " < count(" (e 1) "); " (e 3) "++) {" nl I (e 2) " = " (e 1) "[" (e 3) "];" nl (block 4) nl i "}" )
                java7 ( (forkctx _ ) (def 2) (def 3) "for ( int " (e 3) " = 0; " (e 3) " < " (e 1) ".size(); " (e 3) "++) {" nl I (typeof 2) " " (e 2) " = " (e 1) ".get(" (e 3) ");" nl (block 4) nl i "}" )
                scala ( 
                    (forkctx _ ) (def 2) (def 3) 
                    "try {" nl I
                    "val __break__ = new Breaks;"
                    "__break__.breakable { " 
                        nl I 
                            "for (  " (e 3) " <- 0 until " (e 1) ".length ) {" nl I "val " (e 2) " = " (e 1) "(" (e 3) ")" nl (block 4) nl i "}" 
                        i nl
                    "}"
                    i nl "} " nl
                    (imp "scala.util.control._")
                )      
                cpp ( (forkctx _ ) (def 2) (def 3) "for ( std::vector< " (typeof 2) ">::size_type " (e 3) " = 0; " (e 3) " != " (e 1) ".size(); " (e 3) "++) {" nl I (e 2) " = " (e 1) "[" (e 3) "];" nl (block 4) nl i "}" )          
                * ( (forkctx _ ) (def 2) (def 3) "for ( var " (e 3) " = 0; " (e 3) " < " (e 1) ".length; " (e 3) "++) {" nl I "var " (e 2) " = " (e 1) "[" (e 3) "];" nl (block 4) nl i "}" )
            }
        }

        trim             cmdTrim:string          ( value:string ) { 
            templates {                
                swift3 ( (e 1 ) ".trimmingCharacters(in: CharacterSet.whitespacesAndNewlines)" (imp "Foundation"))                
                php ( "trim(" (e 1 ) ")")
                cpp ( "boost::trim_right(" (e 1) ")" (imp "<boost/algorithm/string.hpp>"))
                scala ( (e 1) ".trim" )
                csharp ( (e 1) ".Trim()" (imp "System"))
                * ( (e 1) ".trim()" )
            }            
        }                 

;         wr.out (").to[collection.mutable.ArrayBuffer]" false
; kotlin could use also something like: .split(Regex("(?<=[!?])|(?=[!?])"))
; swift : .components(separatedBy:
        strsplit       cmdSplit:[string]       ( strToSplit:string delimiter:string ) { 
            templates {
                ; TODO: C++ version, requires perhaps external lib to do it directly to vector<std::string>
                scala ( (e 1) ".split(" (e 2) ").to[collection.mutable.ArrayBuffer]")  
                csharp ( (e 1) ".Split(" (e 2) ")")
                swift3 ( (e 1) ".components( separatedBy : " (e 2) ")")
                php ( "explode(" (e 2) ", " (e 1) ")")               
                * ( (e 1) ".split(" (e 2) ")")
            }
        }

        strlen       cmdStrlen:int       ( text:string ) { 
            templates {
                cpp ( (e 1) ".length()") 
                java7 ( (e 1) ".length()") 
                scala ( (e 1) ".length()")  
                swift3 ( (e 1) ".characters.count")  
                csharp ( (e 1) ".Length")
                php ( "strlen(" (e 1) ")")               
                * ( (e 1) ".length")
            }
        }

        ; String s = new String(a, 2, 4)
        
        ; C#
        ; Encoding.ASCII.GetString(bytes)
        ; System.Buffer.BlockCopy(str.ToCharArray(), 0, bytes, 0, bytes.Length);
        ; new List<string>(Source).GetRange(2, 2).ToArray();

        ; scala:
        ; new String(array.map(_.toChar)))
        ; array.slice()

        ; swift:
        ; String(data: Data(bytes: s[sp ..< i]) , encoding: .utf8)!

        substring   cmdSubstring:string       ( text:charbuffer start:int end:int ) { 
            templates {
                csharp ( "Encoding.UTF.GetString(new List<byte>(" (e 1) ").GetRange(" (e 2) ", " (e 3) ").toArray())")
                scala ( "new String(" (e 1) ".slice(" (e 2) ", " (e 3) ").map(_.toChar) )")
                java7 ( "new String(" (e 1) "," (e 2) ", " (e 3) " - " (e 2) " )")
                swift3 ( "String(data: Data(bytes:" (e 1) "[" (e 2) " ..< " (e 3) "]), encoding: .utf8)!"  (imp "Foundation"))
                kotlin ( "String(" (e 1) "," (e 2) ", " (e 3) " - " (e 2) " )")           
                go ( "fmt.Sprintf(\"%s\", " (e 1) "[" (e 2) ":" (e 3) "])" )
                php ( "substr(" (e 1) ", " (e 2) ", " (e 3) " - " (e 2) ")") 
                * ( (e 1) ".substring(" (e 2) ", " (e 3) " )")
            }
        }

        toString   bufferToString:string       ( text:charbuffer ) { 
            templates {      
                go ( "string(" (e 1) ")" )
                * ( (e 1) )
            }
        }        

        to_charbuffer      cmdToCharBuffer:charbuffer       ( text:string ) { 
            templates {
                swift3 ( "Array(" (e 1) ".utf8)" )
                scala ( (e 1) ".toCharArray.map(_.toByte)")
                java7 ( (e 1) ".toCharArray()" )
                csharp ( "Encoding.ASCII.GetBytes(" (e 1) ")")
                kotlin ( (e 1 ) ".toCharArray()" )
                rust ( (e 1) ".into_bytes()")
                php ( (e 1) )
                go("[]byte(" (e 1) ")")
                * ( (e 1) )
            }
        }

        to_int      cmdToInt:int       ( ch:char ) { 
            templates {
                csharp ( "(int)" (e 1 ) "" )
                swift3 ( "Int(" (e 1 ) ")" )
                kotlin ( (e 1 ) ".toInt()" )
                scala ( (e 1 ) ".toInt" )
                rust ( (e 1 ) " as i64 " )
                go ( "int64(" (e 1) ")")
                php ( "ord(" (e 1) ")")
                * ( (e 1) )
            }
        }        

        ; Length
        length      cmdLength:int       ( buffer:charbuffer ) { 
            templates {
                csharp ( (e 1 ) ".Length" )
                kotlin ( (e 1 ) ".size" )
                scala ( (e 1 ) ".length" )
                swift3 ( (e 1 ) ".count" )
                rust ( (e 1 ) ".len()" )
                java7 ( (e 1 ) ".length" )
                go ( "int64(len(" (e 1 ) "))")
                php ( "strlen(" (e 1 ) ")")
                * ( (e 1) ".length" )
            }
        }          

        ; TODO: charAt might require charbuffer as parameter
        charAt      cmdCharAt:char       ( text:charbuffer position:int ) { 
            templates {
                cpp ( (e 1) ".at( " (e 2) ")")    
                csharp ( (e 1) "[" (e 2) "]")
                php ( "ord(" (e 1) "[" (e 2) "])")               
                java7 ( (e 1) "[" (e 2) "]")  
                kotlin ( (e 1) "[" (e 2) "]")    
                scala ( (e 1) "(" (e 2) ")")    
                go ( (e 1) "[" (e 2) "]")  
                swift3 ( (e 1) "[" (e 2) "]")    
                * ( (e 1) ".charCodeAt(" (e 2) " )")
            }
        }

        substring   cmdSubstring:string       ( text:string start:int end:int ) { 
            templates {
                cpp ( "" (e 1) ".substr(" (e 2) ", " (e 3) " - " (e 2) ")")               
                csharp ( (e 1) ".Substring(" (e 2) ", " (e 3) " - " (e 2) " )")
                php ( "substr(" (e 1) ", " (e 2) ", " (e 3) " - " (e 2) ")")    
                go (  (e 1) "[" (e 2) ":" (e 3) "]")               
                swift3 ( (e 1) "[" (e 1) ".index(" (e 1) ".startIndex, offsetBy:" (e 2) ")..<" (e 1) ".index(" (e 1) ".startIndex, offsetBy:" (e 3) ")]" )
                * ( (e 1) ".substring(" (e 2) ", " (e 3) " )")
            }
        }

        ;(charcode "A")
        charcode   cmdCharcode:int       ( text:string ) { 
            templates {
                * ( (cc 1) )
            }
        }

        strfromcode   cmdStrFromCode:string       ( code:int ) { 
            templates {
                csharp ( "((char)" (e 1) ").toString()") 
                java7 ( "(new String( new char[] {" (e 1) " }))") 
                swift3 ( "(String( Character( UnicodeScalar(" (e 1) " ))))") 
                php ( "chr(" (e 1) ")") 
                scala ( "(" (e 1) ".toChar)")      
                go ("string([] byte{" (e 1) "})")        
                * ( "String.fromCharCode(" (e 1) ")")
            }
        }
        
        ; std::to_string(myDoubleVar);
        double2str   cmdDoubleToString:string       ( value:double ) { 
            templates {
                cpp ("std::to_string(" (e 1) ")" imp("<string>"))
                java7 ( "String.valueOf(" (e 1) " )") 
                php ( "strval(" (e 1) ")") 
                scala ( "(" (e 1) ".toString)")
                go ("strconv.FormatFloat(" (e 1) ",'f', 6, 64)")
                swfit3 ("String(" (e 1) ")")              
                * ( "(" (e 1) ".toString())")
            }
        }

        ; note: this has now different value, it is optional int...
        ; the optionality of the return value should be preserved 
        ; can not do just
        ;   def x:int (10 + (str2int "hello"))
        ; --> optional return value here...

        str2int   cmdStringToInt@(optional):int      ( value:string ) { 
            templates {
                cpp ("std::stoi(" (e 1) ")" imp("<string>"))
                java7 ( "Optional.of(Integer.parseInt(" (e 1) " ))") 
                go ("r_str_2_i64(" (e 1) ")")
                php ( "intval(" (e 1) ")")
                scala ( "Try(" (e 1) ".toInt).toOption" (imp "scala.util.Try"))
                kotlin (  (e 1) ".toInt()")
                swift3 ("Int(" (e 1) ")")              
                * ( "isNaN( parseInt(" (e 1) ") ) ? undefined : parseInt(" (e 1) ")")
            }
        }

        str2double   cmdStringToDouble@(optional):double      ( value:string ) { 
            templates {
                cpp ("std::stod(" (e 1) ")" imp("<string>"))
                java7 ( "Optional.of(Double.parseDouble(" (e 1) " ))") 
                go ("r_str_2_d64(" (e 1) ")")
                php ( "floatval(" (e 1) ")")
                scala ( "Try(" (e 1) ".toDouble).toOption" (imp "scala.util.Try"))
                kotlin (  (e 1) ".toDouble()")
                swift3 ("Double(" (e 1) ")")              
                * ( "isNaN( parseFloat(" (e 1) ") ) ? undefined : parseFloat(" (e 1) ")")
            }
        }
        
        ; scala: .mkString(
        join             cmdJoin:string          ( array:[string] delimiter:string ) { 
            templates {                
                java7 ( "StringUtils.join(" (e 1 ) ", " (e 2) ")" (imp "org.apache.commons.lang.StringUtils"))
                scala ( (e 1) ".mkString(" (e 2) ")" )
                * ( (e 1) ".join(" (e 2) ")" )
            }            
        }                 
        
        has             cmdHas:boolean          ( map:[K:T] key:K ) { 
            templates {                
                es5  ( "typeof(" (e 1) "[" (e 2) "] ) != \"undefined\"" )
                es6  ( "typeof(" (e 1) "[" (e 2) "] ) != \"undefined\"" )
                ts   ( "typeof(" (e 1) "[" (e 2) "] ) != \"undefined\"" )
                flow ( "typeof(" (e 1) "[" (e 2) "] ) != \"undefined\"" )
                cpp ( (e 1) ".count(" (e 2) ")" )
                php ( "array_key_exists(" (e 1) " , " (e 2) " )" )
                java7 ( (e 1) ".containsKey(" (e 2) ")" )
                kotlin ( (e 1) ".containsKey(" (e 2) ")" )
                go ( "_, ok:= " (e 1) "[" (e 2) "]; ok")
                rust ( (e 1 ) ".contains_key(&" (e 2) ")")
                csharp ( (e 1) ".ContainsKey(" (e 2) ")" )
                scala ( (e 1) ".contains(" (e 2) ")" )
                swift3 ( (e 1) "[" (e 2) "] != nil" )
                * ( (e 1) "[" (e 2) "] != null" )
            }            
        }  

        get             cmdGet@(optional weak):T          ( map:[K:T] key:K ) { 
            templates {                
                java7 ( (e 1) ".get(" (e 2) ")" )
                rust ( (e 1) ".get(" (e 2) ")" )
                scala ( (e 1) ".get(" (e 2) ").asInstanceOf[" (atype 1) "]" )
                * ( (e 1) "[" (e 2) "]" )
            }            
        }                 

        set             cmdSet:void          ( map@(mutates):[K:T] key:K value@( refto@(1) ):T ) { 
            templates {                
                java7 ( (e 1) ".put(" (e 2) ", " (e 3) ");" )
                rust ( (e 1) ".insert(" (e 2) ", " (e 3) ");" )
                scala ( (e 1) ".put(" (e 2) ", " (e 3) ")" )
                kotlin ( (e 1) ".set(" (e 2) ", " (e 3) ")" )
                php ( (e 1) "[" (e 2) "] = " (e 3) ";" )
                * ( (e 1) "[" (e 2) "] = " (e 3) )
            }            
        }                 

        lift    cmdLift@(optional):T      ( array:[T] index:int ) { 
            templates {
                 cpp ( (e 1) ".at( " (e 2) ")" (imp "<vector>"))   
                 java7 ( (e 1) ".get(" (e 2) ")" )                                 
                 ; lift return optional type => safer                             
                 scala ( (e 1) ".lift(" (e 2) ")" )  
                 swift3 ( (e 1) "[" (e 2) "]" )    
                 * (  (e 1) "[" (e 2) "]" )                                              
            }
        }

        itemAt    cmdItemAt@(weak):T      ( array:[T] index:int ) { 
            templates {
                 cpp ( (e 1) ".at( " (e 2) ")" (imp "<vector>"))   
                 java7 ( (e 1) ".get(" (e 2) ")" )                                 
                 ; lift return optional type => safer                             
                 scala ( (e 1) "(" (e 2) ")" )  
                 * ( (e 1) "[" (e 2) "]" )                                              
            }
        }

        indexOf    cmdIndexOf:int      ( array:[T] element:T ) { 
            templates {

                 cpp ( (e 1) "std::distance( std::find( " (e 1) ".begin(), " (e 1) ".end(), " (e 2) ") )" (imp "<vector>"))   
                 rust ( (e 1) ".iter().position( |&r| r == " (e 2) " ).unwrap()" )   
                 * ( (e 1) ".indexOf(" (e 2) ")" )                                              
            }
        }

        remove_index    cmdRemoveIndex:void  ( array:[T] index:int ) { 
            templates {
                 cpp ( (e 1) ".erase( "(e 1)".begin() + " (e 2) " )")
                 swift3 ( (e 1) ".remove(at:" (e 2)")")
                 php ( "array_splice(" (e 1) ", " (e 2 )", 1)[0]")
                 kotlin ( (e 1) ".removeAt(" (e 2) ")" ) 
                 java7 ( (e 1) ".remove(" (e 2) ")" )
                 scala ( (e 1) ".remove(" (e 2) ")" )
                 * ( (e 1) ".splice(" (e 2) ", 1).pop();" )                                              
            }
        }

        push    cmdPush@(moves@( 2 1 ) ):void  ( array@(mutates):[T] item:T ) { 
            templates {
                 cpp ( (e 1) ".push_back( "(e 1)"  );")
                 swift3 ( (e 1) ".append(" (e 2)")")
                 php ( "array_push(" (e 1) ", " (e 2 )");")
                 java7 ( (e 1) ".add(" (e 2) ");" )
                 go ( (e 1) " = append("  (e 1) ","  (e 2) ");" )
                 kotlin ( (e 1) ".add(" (e 2) ");" )
                 csharp ( (e 1) ".Add(" (e 2) ")" ) 
                 scala ( (e 1) ".append(" (e 2) ")" )
                 * ( (e 1) ".push(" (e 2) ");" )                                              
            }
        }

        ; think: how to release the strong array
        removeLast  cmdRemoveLast:void  ( array@(mutates):[T] ) { 
            templates {
                 cpp ( (e 1) ".pop_back();")
                 swift3 ( (e 1) ".removeLast();")
                 php ( "array_pop(" (e 1) " );")
                 java7 ( (e 1) ".remove(" (e 1) ".size() - 1);" )
                 csharp ( "Array.Resize(ref "(e 1) ", " (e 1 )".Length - 1);" ) 
                 scala ( (e 1) ".remove(" (e 1) ".length - 1)" )
                 go ( (e 1) "= " (e 1)"[:len(" (e 1)") - 1]")
                 * ( (e 1) ".pop();" )                                              
            }
        }

        length    cmdArrayLength:int      ( array:[T] ) { 
            templates {
                 cpp ( (e 1) ".size()" )                                                              
                 swift3 ( (e 1) ".count")
                 php ( "count(" (e 1) ")")
                 java7 ( (e 1) ".size()" )                                                              
                 scala ( (e 1) ".length" )
                 kotlin ( (e 1) ".size" )                                                              
                 * ( (e 1) ".length" )                                              
            }
        }

        length       cmdStrlen:int       ( text:string ) { 
            templates {
                cpp ( (e 1) ".length()") 
                java7 ( (e 1) ".length()") 
                scala ( (e 1) ".length()")  
                swift3 ( (e 1) ".characters.count")  
                csharp ( (e 1) ".Length")
                rust ( (e 1 ) ".len()" )
                go( "len([]rune(" (e 1) "))")
                php ( "strlen(" (e 1) ")")               
                * ( (e 1) ".length")
            }
        }
        

        array_length    cmdArrayLength:int      ( array:[T] ) { 
            templates {
                 cpp ( (e 1) ".size()" )                                                              
                 swift3 ( (e 1) ".count")
                 php ( "count(" (e 1) ")")
                 java7 ( (e 1) ".size()" )                                                              
                 scala ( (e 1) ".length" )
                 rust ( (e 1 ) ".len()" )
                 go ( "int64(len(" (e 1 ) "))" )
                 kotlin ( (e 1) ".size" )                                                              
                 * ( (e 1) ".length" )                                              
            }
        }

        array_extract    cmdArrayExtract@(strong):T      ( array@(mutates):[T] position:int ) { 
            templates {
                 ; TODO: C++ version does not seem to have a clear functino to extrace element from std::vector
                 swift3 ( (e 1) ".remove(at:" (e 2)")")
                 php ( "array_splice(" (e 1) ", " (e 2 )", 1)[0]")
                 go ( "r_arr_" (rawtype 1) "_extract(" (e 1) ", " (e 2 )")")
                 kotlin ( (e 1) ".removeAt(" (e 2) ")" ) 
                 java7 ( (e 1) ".remove(" (e 2) ")" )
                 scala ( (e 1) ".remove(" (e 2) ")" )
                 * ( (e 1) ".splice(" (e 2) ", 1).pop()" )                                              
            }
        }


        
        print           cmdPrint:void           ( text:string) { 
            templates {
                 cpp (ln "std::cout << " (e 1) " << std::endl;" nl (imp "<iostream>"))
                 kotlin ( nl "println( " (e 1) " )" nl )                                              
                 scala ( nl "println( " (e 1) " )" nl ) 
                 go ( nl "fmt.Println( " (e 1) " )" nl (imp "fmt")) 
                 rust ( nl "println!( \"{}\", " (e 1) " );" nl )                              
                 java7 ( nl "System.out.println(String.valueOf( " (e 1) " ) );" nl (imp "java.io.*"))                              
                 php ( nl "echo( " (e 1) " . \"\\n\");" nl )               
                 csharp ( nl "Console.Writeline(" (e 1) ")" nl (imp "System"))
                 swift3 ( nl "print(" (e 1) ")" nl)
                 * ( nl "console.log(" (e 1) ")" nl)                                                                
            }
        }

        ; ----------------------------------------------------------------------------------------------------------
        ; conversions

        to_double       toDouble:double ( input:int ) {
            templates {
                go ("float64( " (e 1) " )")
            }
        }

        ; ----------------------------------------------------------------------------------------------------------


        ==              cmdEqual:boolean ( left:T right:T ) { templates { * ( (e 1) " == " (e 2) ) } }

        ==              cmdEqual:boolean ( left:int right:char ) { templates { * ( (e 1) " == " (e 2) ) } }
        ==              cmdEqual:boolean ( left:char right:int ) { templates { * ( (e 1) " == " (e 2) ) } }

        ==              cmdEqual:boolean ( left:int right:int ) { templates { * ( (e 1) " == " (e 2) ) } }
        ==              cmdEqual:boolean ( left:double right:double ) { templates { * ( (e 1) " == " (e 2) ) } }
        ==              cmdEqual:boolean ( left:boolean right:boolean ) { templates { * ( (e 1) " == " (e 2) ) } }
        ==              cmdEqual:boolean ( left:string right:string ) { templates { * ( (e 1) " == " (e 2) ) } }
        
        >               cmdGt:boolean ( left:double right:double ) { templates { * ( (e 1) " > " (e 2) ) } }
        >               cmdGt:boolean ( left:int right:int ) { templates { * ( (e 1) " > " (e 2) ) } }

        ; ----------------------------------------------------------------------------------------------------------
        ; TODO: expression to cast the types comparing to character

        <=               cmdLte:boolean ( left:char right:int ) { 
            templates { * ( (e 1) " <= " (e 2) ) } 
        }
        <=               cmdLte:boolean ( left:int right:char ) { 
            templates { * ( (e 1) " <= " (e 2) ) } 
        }
        <=               cmdLte:boolean ( left:char right:char ) { 
            templates { * ( (e 1) " <= " (e 2) ) } 
        }

        <               cmdLt:boolean ( left:int right:char ) { 
            templates { * ( (e 1) " < " (e 2) ) } 
        }

        <               cmdLt:boolean ( left:char right:int ) { 
            templates { * ( (e 1) " < " (e 2) ) } 
        }

        <               cmdLt:boolean ( left:char right:char ) { 
            templates { * ( (e 1) " < " (e 2) ) } 
        }

        ==               cmdEq:boolean ( left:int right:char ) { 
            templates { * ( (e 1) " == " (e 2) ) } 
        }

        ==               cmdEq:boolean ( left:char right:int ) { 
            templates { * ( (e 1) " == " (e 2) ) } 
        }

        ==               cmdEq:boolean ( left:char right:char ) { 
            templates { * ( (e 1) " == " (e 2) ) } 
        }

        !=               cmdNeq:boolean ( left:int right:char ) { 
            templates { * ( (e 1) " != " (e 2) ) } 
        }

        !=               cmdNeq:boolean ( left:char right:int ) { 
            templates { * ( (e 1) " != " (e 2) ) } 
        }

        !=               cmdNeq:boolean ( left:char right:char ) { 
            templates { * ( (e 1) " != " (e 2) ) } 
        }

        >=               cmdGte:boolean ( left:int right:char ) { 
            templates { * ( (e 1) " >= " (e 2) ) } 
        }
        >=               cmdGte:boolean ( left:char right:int ) { 
            templates { * ( (e 1) " >= " (e 2) ) } 
        }
        >=               cmdGte:boolean ( left:char right:char ) { 
            templates { * ( (e 1) " >= " (e 2) ) } 
        }
        
        >               cmdGt:boolean ( left:int right:char ) { 
            templates { * ( (e 1) " > " (e 2) ) } 
        }
        >               cmdGt:boolean ( left:char right:int ) { 
            templates { * ( (e 1) " > " (e 2) ) } 
        }
        >               cmdGt:boolean ( left:char right:char ) { 
            templates { * ( (e 1) " > " (e 2) ) } 
        }

        ;------------------------------------------------------------------------------------------------------------

        <               cmdLt:boolean ( left:int right:int ) { templates { * ( (e 1) " < " (e 2) ) } }
        <               cmdLt:boolean ( left:double right:double ) { templates { * ( (e 1) " < " (e 2) ) } }

        <=              cmdLte:boolean ( left:int right:int ) { templates { * ( (e 1) " <= " (e 2) ) } }
        <=              cmdLte:boolean ( left:double right:double ) { templates { * ( (e 1) " <= " (e 2) ) } }

        >=              cmdGte:boolean ( left:int right:int ) { templates { * ( (e 1) " >= " (e 2) ) } }
        >=              cmdGte:boolean ( left:double right:double ) { templates { * ( (e 1) " >= " (e 2) ) } }

        ; optional testing
        &&              cmdLogicAnd:boolean ( left@(optional):T right@(optional):S ) { 
            templates { 
                scala ( (e 1) ".isDefined  && " (e 2) ".isDefined") 
                csharp ( (e 1) ".HasValue  && " (e 2) ".HasValue") 

                php ( "isset("(e 1) ") && isset(" (e 2) ")") 
                java7 ( (e 1) ".isPresent()  && " (e 2) ".isPresent()") 
                rust ( (e 1) ".is_some()  && " (e 2) ".is_some()") 
                swift3 ( (e 1) " != nil  && " (e 2) " != nil") 
                go ( "" (e 1) ".has_value  && " "" (e 2) ".has_value")
                cpp ( "" (e 1) "->has_value  && " "" (e 2) "->has_value") 
                kotlin ( (e 1) " != null  && " (e 2) " != null") 

                * ( "typeof(" ( e 1 ) ") != \"undefined\" && typeof(" ( e 2 ) ") != \"undefined\"" ) 
            } 
        }
        &&              cmdLogicAnd:boolean ( left:boolean right@(optional):S ) { 
            templates {
                php ( (e 1) " && isset(" (e 2) ")") 
                scala ( (e 1) " && " (e 2) ".isDefined") 
                java7 ( (e 1) " && " (e 2) ".isPresent()") 
                csharp ( (e 1) " && " (e 2) "HasValue") 

                rust ( (e 1) " && " (e 2) ".is_some()") 
                swift3 ( (e 1) " && " (e 2) " != nil") 
                go ( (e 1) " && " "" (e 2) ".has_value") 
                cpp ( (e 1) " && " "" (e 2) "->has_value") 
                kotlin ( (e 1) " && " (e 2) " != null") 
                cpp (e 1) " && " (e 2) 
                * ( (e 1) " && " "typeof(" ( e 2 ) ") != \"undefined\"") 
            } 
        }
        &&              cmdLogicAnd:boolean ( left@(optional):T right:boolean ) { 
            templates { 
                php ( "isset("(e 1) ") && " (e 2) ) 
                scala ( ""(e 1) ".isDefined && " (e 2) ) 
                java7 ( ""(e 1) ".isPresent() && " (e 2) ) 
                csharp ( ""(e 1) ".HasValue && " (e 2) ) 

                rust ( ""(e 1) ".is_some() && " (e 2) ) 
                swift3 ( ""(e 1) " != nil && " (e 2) ) 
                go ( "" (e 1) ".has_value && " (e 2) ) 
                cpp ( "" (e 1) "->has_value && " (e 2) ) 
                kotlin ( ""(e 1) " != null && " (e 2) ) 
                cpp (e 1) " && " (e 2) 
                * ( "typeof(" ( e 1 ) ") != \"undefined\"" " && " (e 2) ) 
            } 
        }



        &&              cmdLogicAnd:boolean ( left:boolean right:boolean ) { templates { * ( (e 1) " && " (e 2) ) } }
        &&              cmdLogicAnd:boolean ( p1:boolean p2:boolean p3:boolean) { templates { * ( (e 1) " && " (e 2) " && " (e 3) )  } }
        &&              cmdLogicAnd:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean ) { templates { * ( (e 1) " && " (e 2) " && " (e 3) " && " (e 4) )  } }
        &&              cmdLogicAnd:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean p5:boolean ) { templates { * ( (e 1) " && " (e 2) " && " (e 3) " && " (e 4) " && " (e 5) ) } }
        &&              cmdLogicAnd:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean p5:boolean p6:boolean ) { templates { * ( (e 1) " && " (e 2) " && " (e 3) " && " (e 4) " && " (e 5) " && " (e 6) ) } }
        &&              cmdLogicAnd:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean p5:boolean p6:boolean p7:boolean ) { templates { * ( (e 1) " && " (e 2) " && " (e 3) " && " (e 4) " && " (e 5) " && " (e 6) " && " (e 7) ) } }

        ||              cmdLogicOr:boolean ( left:boolean right:boolean ) { templates { * ( (e 1) " || " (e 2) ) } }
        ||              cmdLogicOr:boolean ( p1:boolean p2:boolean p3:boolean  ) { templates { * ( (e 1) " || " (e 2) " || " (e 3) ) } }
        ||              cmdLogicOr:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean     ) { templates { * ( (e 1) " || " (e 2) " || " (e 3) " || " (e 4) )  } }
        ||              cmdLogicOr:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean p5:boolean    ) { templates { * ( (e 1) " || " (e 2) " || " (e 3) " || " (e 4) " || " (e 5) ) } }        
        ||              cmdLogicOr:boolean ( p1:boolean p2:boolean p3:boolean p4:boolean p5:boolean p6:boolean    ) { templates { * ( (e 1) " || " (e 2) " || " (e 3) " || " (e 4) " || " (e 5) " || " (e 6) ) } }


    }



}
