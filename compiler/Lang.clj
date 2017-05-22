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
        php         PHP             php
    }


    commands {

        -               cmdMinusOp:double            ( left:double right:double )  {
            templates {
                * ( (e 1) " - " (e 2) )
            }
        }      

        ; the + operator could be also defined for different semantics
        +               cmdPlusOp:T             ( left:expression right:expression ) {
            templates {
                * ( (e 1) " + " (e 2) )
            }
        }
        *               cmdMulOp:double         ( left:double right:double ) {
            templates {
                * ( (e 1) " * " (e 2) )
            }
        }        
        =               cmdAssign:void          ( target:vref expr:expression ) {
            templates {
                scala ( (e 1) " = " (e 2) )   ; <-- scala does not require ; here                
                * ( (e 1) " = " (e 2) ";" )
            }
        }


        return          cmdReturn:void          ( value:T ) {
            templates { 
                * ( "return " (ifa 1 ";") (e 1) (eif _) ";" )
            }
        }


; TODO: add the rest ....(case ("sin" "cos" "tan" "atan" "log" "abs" "acos" "asin" "floor" "round" "sqrt")
        ;"<cmath>"
        sin        cmdSin:void          (  value:double )  {
            templates {
                swift3 ( "sin(" (e 1) ")" (imp "Foundation"))               
                cpp ( "sin(" (e 1) ")" (imp "<cmath>"))
                csharp ( "Math.Sin(" (e 1) ")" (imp "System"))                                
                php ( "sin(" (e 1) ")" )                
                scala ( "sin(" (e 1) ")" (imp "scala.math"))                
                java7 ( "Math.sin(" (e 1) ")" (imp "java.lang.Math"))
                * ( "Math.sin(" (e 1) ")")
            }
        }
        
        if              cmdIf:void              ( condition:boolean then_block:block else_block@(optional):block )  {
            templates {
                * ( "if (" (e 1) ") {" I (e 2) i "}" (ifa 3) " else {" I (e 3) i "}" )
            }
        }
        switch          cmdSwitch:void          ( condition:boolean case_list:block )  {
            templates {
                * ( "switch (" (e 1) ") {" I (e 2) i "}" )
            }
        }       
        while           cmdWhile:void          ( condition:boolean whileLoop:block )  {
            templates {
                * ( "while (" (e 1) ") {" I (e 2) i "}" )
            }
        }
        break           cmdBreak:void          ( )  {
            templates {
                * ( nl "break;" nl )
            }
        }
        continue        cmdContinue:void          ( )  {
            templates {
                * ( nl "continue;" nl )
            }
        }

        continue        cmdDefault:void          (  default_block:block )  {
            templates {
                * ( nl "default: " nl I (e 1) nl "break;" i )
            }
        }

        ; TODO: the case definition is currenlty too complex - requires command pattern matching so that
        ; the first parameter can be either expression or VRef
        case        cmdCase:void          (  condition:T case_block:block )  {
            
        }

        ; TODO: new expression is language specific, so must be overridden per language
        new        cmdNew:T          (  className:class args:arguments  )  {

        }

        null?       cmdIsNull        ( arg:T ) {
            templates {
                php ( "(!isset(" (e 1) "))")                                
                cpp ((e 1) "== NULL")                                
                swift3 ((e 1) "== nil")                
                * ((e 1) "== null")
            }
        }

        !null?       cmdIsNotNull        ( arg:T ) {
            templates {
                php ( "(!sset(" (e 1) "))")                                
                cpp ((e 1) "!= NULL")                                
                swift3 ((e 1) "!= nil")                
                * ((e 1) "!= null")
            }
        }
        
        
        throw        cmdThrow:void          (  eInfo:T  )  {
            templates {
                * ( nl "throw"  (e 1) ";" nl )
            }
        }

        ; case e: Exception => {
        try        cmdTry:void          (  run_block:block catch_block:block  )  {
            templates {
                php ( nl "try {" nl I (e 1) i nl"} catch( Exception $e) {" nl I (e 2) i nl "}" nl )               
                scala ( nl "try {" nl I (e 1) i nl"} catch {" nl I nl "case e: Exception => {" nl I (e 2) i nl "}" i nl "}" nl )
                java7 ( nl "try {" nl I (e 1) i nl"} catch( Exception e) {" nl I (e 2) i nl "}" nl )
                * ( nl "try {" nl I (e 1) i nl"} catch(e) {" nl I (e 2) i nl "}" nl )
            }
        }
        
        
        
        ; typeof
        for             cmdFor:void          ( list:[T] item:keyword indexName:keyword repet_block:block)  {
            templates {
                swift3 ( (forkctx _ ) (def 2) (def 3) nl "var " (e 3) " = 0;" nl "for ( " (e 2) " in " (e 1) ") {" nl I (e 4) nl i "}" )
                kotlin ( (forkctx _ ) (def 2) (def 3) "for ( " (e 3) " in " (e 1) ".indices ) {" nl I (e 2) " = " (e 1) "[" (e 3) "]" nl (e 4) nl i "}" )
                php    ( (forkctx _ ) (def 2) (def 3) "for ( " (e 3) " = 0; " (e 3) " < count(" (e 1) "); " (e 3) "++) {" nl I (e 2) " = " (e 1) "[" (e 3) "];" nl (e 4) nl i "}" )
                java7 ( (forkctx _ ) (def 2) (def 3) "for ( int " (e 3) " = 0; " (e 3) " < " (e 1) ".size(); " (e 3) "++) {" nl I (typeof 2) " " (e 2) " = " (e 1) ".get(" (e 3) ");" nl (e 4) nl i "}" )
                scala ( (forkctx _ ) (def 2) (def 3) "for (  " (e 3) " <- 0 until " (e 1) ".length ) {" nl I "val " (e 2) " = " (e 1) "(" (e 3) ")" nl (e 4) nl i "}" )                
                * ( (forkctx _ ) (def 2) (def 3) "for ( var " (e 3) " = 0; " (e 3) " < " (e 1) ".length; " (e 3) "++) {" nl I (e 2) " = " (e 1) "[" (e 3) "];" nl (e 4) nl i "}" )
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

;         wr.out (").to[collection.mutable.ArrayBuffer]" false)
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

        ; TODO: charAt might require charbuffer as parameter
        charAt      cmdCharAt:int       ( text:string position:int ) { 
            templates {
                cpp ( (e 1) ".at( " (e 2) ")")    
                scala ( (e 1) ".charAt(" (e 2)").toInt")  
                csharp ( (e 1) "[" (e 2) "]")
                php ( "strlen(" (e 1) ")")               
                swift3 ( (e 1) "[" (e 1) ".index(" (e 1) ".startIndex, offsetBy: " (e 2 ) ")].unicodeScalaCodePoint()")               
                * ( (e 1) ".charAt(" (e 2) " )")
            }
        }

        substring   cmdSubstring:string       ( text:string start:int end:int ) { 
            templates {
                cpp ( "" (e 1) ".substr(" (e 2) ", " (e 3) " - " (e 2) ")")               
                csharp ( (e 1) ".Substring(" (e 2) ", " (e 3) " - " (e 2) " )")
                php ( "substr(" (e 1) ", " (e 2) ", " (e 3) " - " (e 2) ")")               
                * ( (e 1) ".substring(" (e 2) ", " (e 3) " )")
            }
        }

        ;(charcode "A")
        charcode   cmdCharcode:string       ( text:string ) { 
            templates {
                cpp ( "((unsigned int)" (e 1) ".at( " (e 2) "))") ; NOTE: <- not at all sure if this is correct    
                csharp ( "((int)" (e 1) "[0])") 
                php ( "ord(" (e 1) "[0])") 
                scala ( "(" (e 1) ".charAt(0).toInt)")
                swift3 ( (e 1) ".unicodeScalars[0].value" )              
                * ( (e 1) ".charCodeAt(0)")
            }
        }

        strfromcode   cmdStrFromCode:string       ( code:int ) { 
            templates {
                csharp ( "((char)" (e 1) ").toString()") 
                java7 ( "(new String( new char[] {" (e 1) " })))") 
                swift3 ( "(String( UnicodeScalar(" (e 1) " )))") 
                php ( "chr(" (e 1) ")") 
                scala ( "(" (e 1) ".toChar)")              
                * ( (e 1) ".charCodeAt(0)")
            }
        }
        

        ; std::to_string(myDoubleVar);
        double2str   cmdDoubleToString:string       ( value:double ) { 
            templates {
                cpp ("std::to_string(" (e 1) ")" imp("<string>"))
                java7 ( "String.valueOf(" (e 1) " )") 
                php ( "strval(" (e 1) ")") 
                scala ( "(" (e 1) ".toString)")
                swfit3 ("String(" (e 1) ")")              
                * ( "(" (e 1) ".toString())")
            }
        }

        str2int   cmdStringToInt:int      ( test:string ) { 
            templates {
                cpp ("std::stoi(" (e 1) ")" imp("<string>"))
                java7 ( "Integer.parseInt(" (e 1) " )") 
                php ( "intval(" (e 1) ")")
                scala ( (e 1) ".toInt")
                kotlin (  (e 1) ".toInt()")
                swfit3 ("Int(" (e 1) ")")              
                * ( "parseInt(" (e 1) ")")
            }
        }

        str2double   cmdStringToDouble:int      ( test:string ) { 
            templates {
                cpp ("std::stod(" (e 1) ")" imp("<string>"))
                java7 ( "Double.parseDouble(" (e 1) " )") 
                php ( "doubleval(" (e 1) ")")
                scala ( (e 1) ".toDouble")
                kotlin (  (e 1) ".toDouble()")
                swfit3 ("Double(" (e 1) ")")              
                * ( "parseInt(" (e 1) ")")
            }
        }
        

        ; scala: .mkString(
        join             cmdJoin:string          ( map:array delimiter:string ) { 
            templates {                
                java7 ( "StringUtils.join(" (e 1 ) ", " (e 2) ")" (imp "org.apache.commons.lang.StringUtils"))
                scala ( (e 1) ".mkString(" (e 2) ")" )
                * ( (e 1) ".join(" (e 2) ")" )
            }            
        }                 
        

        has             cmdHas:boolean          ( map:map key:string ) { 
            templates {                
                es5  ( "typeof(" (e 1) "[" (e 2) "] ) != \\\"undefined\\\"" )
                es6  ( "typeof(" (e 1) "[" (e 2) "] ) != \\\"undefined\\\"" )
                ts   ( "typeof(" (e 1) "[" (e 2) "] ) != \\\"undefined\\\"" )
                flow ( "typeof(" (e 1) "[" (e 2) "] ) != \\\"undefined\\\"" )
                cpp ( (e 1) ".count(" (e 2) ")" )
                php ( "array_key_exists(" (e 1) " , " (e 2) " )" )
                java7 ( (e 1) ".containsKey(" (e 2) ")" )
                kotlin ( (e 1) ".containsKey(" (e 2) ")" )
                csharp ( (e 1) ".ContainsKey(" (e 2) ")" )
                scala ( (e 1) ".contains(" (e 2) ")" )
                swift3 ( (e 1) "[" (e 2) "] != nil" )
                * ( (e 1) "[" (e 2) "] != null" )
            }            
        }  

        get             cmdGet:boolean          ( map:map key:string ) { 
            templates {                
                java7 ( (e 1) ".get(" (e 2) ")" )
                scala ( (e 1) ".get(" (e 2) ").asInstanceOf[" (atype 1) "]" )
                * ( (e 1) "[" (e 2) "]" )
            }            
        }                 

        set             cmdSet:boolean          ( map:map key:string value:T ) { 
            templates {                
                java7 ( (e 1) ".put(" (e 2) ")" )
                scala ( (e 1) ".put(" (e 2) ")" )
                * ( (e 1) "[" (e 2) "]" )
            }            
        }                 


        itemAt    cmdItemAt:int      ( array:[T] index:int ) { 
            templates {
                 cpp ( (e 1) ".at( " (e 2) ")" (imp "<vector>"))   
                 java7 ( (e 1) ".get(" (e 2) ")" )                                                              
                 scala ( (e 1) "(" (e 2) ")" )
                 * ( (e 1) "[" (e 2) "]" )                                              
            }
        }


        indexOf    cmdIndexOf:int      ( array:[T] element:T ) { 
            templates {

                 cpp ( (e 1) "std::distance( std::find( " (e 1) ".begin(), " (e 1) ".end(), " (e 2) ") )" (imp "<vector>"))   
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

        push    cmdPush:void  ( array:[T] item:T ) { 
            templates {

                 cpp ( (e 1) ".push_back( "(e 1)"  )")
                 swift3 ( (e 1) ".append(" (e 2)")")
                 php ( "array_push(" (e 1) ", " (e 2 )")")
                 java7 ( (e 1) ".add(" (e 2) ")" )
                 csharp ( (e 1) ".Add(" (e 2) ")" ) 
                 scala ( (e 1) ".append(" (e 2) ")" )
                 * ( (e 1) ".push(" (e 2) ");" )                                              
            }
        }


        removeLast  cmdRemoveLast:void  ( array:[T] ) { 
            templates {
                 cpp ( (e 1) ".pop_back();")
                 swift3 ( (e 1) ".removeLast();")
                 php ( "array_pop(" (e 1) " );")
                 java7 ( (e 1) ".remove(" (e 2) ".size() - 1);" )
                 csharp ( "Array.Resize(ref "(e 1) ", " (e 1 )".Length - 1);" ) 
                 scala ( (e 1) ".dropRight(1)" )
                 * ( (e 1) ".pop();" )                                              
            }
        }
        

        array_length    cmdArrayLength:int      ( array:[T] ) { 
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

        array_extract    cmdArrayExtract:int      ( array:[T] position:int ) { 
            templates {
                 ; TODO: C++ version does not seem to have a clear functino to extrace element from std::vector
                 swift3 ( (e 1) ".remove(at:" (e 2)")")
                 php ( "array_splice(" (e 1) ", " (e 2 )", 1)[0]")
                 kotlin ( (e 1) ".removeAt(" (e 2) ")" ) 
                 java7 ( (e 1) ".remove(" (e 2) ")" )
                 scala ( (e 1) ".remove(" (e 2) ")" )
                 * ( (e 1) ".splice(" (e 2) ", 1).pop()" )                                              
            }
        }


        
        print           cmdPrint:void           ( text:string) { 
            templates {
                 cpp (ln "std::cout << " (e 1) " << std::endl " nl (imp "<iostream>"))
                 kotlin ( nl "println( " (e 1) " )" nl )                                              
                 scala ( nl "println( " (e 1) " )" nl )                              
                 java7 ( nl "System.out.println(String.valueOf( " (e 1) " ) );" nl (imp "java.io.*"))                              
                 php ( nl "echo( " (e 1) " );" nl )               
                 csharp ( nl "Console.Writeline(" (e 1) ")" nl (imp "System"))
                 * ( nl "console.log(" (e 1) ")" nl)                                                                
            }
        }

        charcode        cmdCharcode:int         ( ch:string) {
            templates {
                * ( "((int)" (e 1) ".charAt(0))")
            }
        }

        ==              cmdEqual:boolean ( left:T right:T ) { templates { * ( (e 1) " == " (e 2) ) } }
        >               cmdGt:boolean ( left:number right:number ) { templates { * ( (e 1) " > " (e 2) ) } }
        <               cmdLt:boolean ( left:number right:number ) { templates { * ( (e 1) " < " (e 2) ) } }
        <=              cmdLte:boolean ( left:number right:number ) { templates { * ( (e 1) " <= " (e 2) ) } }
        >=              cmdGte:boolean ( left:number right:number ) { templates { * ( (e 1) " >= " (e 2) ) } }

        &&              cmdLogicAnd:boolean ( left:boolean right:boolean ) { templates { * ( (e 1) " && " (e 2) ) } }
        ||              cmdLogicOr:boolean ( left:boolean right:boolean ) { templates { * ( (e 1) " || " (e 2) ) } }


    }



}
