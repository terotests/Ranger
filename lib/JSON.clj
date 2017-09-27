
systemclass JSONDataObject {
    es6 JSONDataObject2
}

systemclass JSONArrayObject {
    es6 JSONArrayObject2
}

systemclass JSONKeyValue {
    es6 JSONKeyValue2
}

systemunion JSONValueUnion ( JSONDataObject JSONArrayObject string int double boolean)
systemunion JSONArrayUnion ( JSONDataObject  string int double boolean )
systemunion JSONObjectUnion ( JSONKeyValue )

operator type:JSONArrayObject all {
    fn forEach( cb:(_:void (item:JSONValueUnion))) {
        def cnt (array_length self)
        def i 0
        while( cnt > 0 ) {
            def value (getValue self i)
            cb(value)
            cnt = cnt - 1
            i = i + 1
        }
    }
    fn map:[S] (cb:(_:S (item:JSONValueUnion)) to@(noeval):[S] ) {
        def len (array_length self)
        def res:[S] 
        def i 0
        while ( i < len) {
            def it (getValue self i)
            push res (cb(it))
            i = i + 1
        }
        return res
    }  
}

operators {

    print _:void (e:JSONDataObject) {
         templates {
            es6 ( 
                "console.log(JSON.stringify(" (e 1) "));" nl
            )
        }        
    }

    getStr _@(optional):string (e:JSONDataObject key:string) {
         templates {
            es6 ( 
                "(typeof (" (e 1) " [" (e 2) "]) != \"string\" ) ? undefined : " (e 1) " [" (e 2) "] " nl
            )
            ranger ("(getStr " (e 1) " " (e 2) ")")
        }                
    } 

    getInt _@(optional):int (e:JSONDataObject key:string) {
         templates {
            es6 ( 
                "isNaN( parseInt(" (e 1) " [" (e 2) "]) ) ? undefined : parseInt(" (e 1) " [" (e 2) "]) " nl
            )
            ranger( "(getInt " (e 1 )" " (e 2)")")
        }                
    } 

    getDouble _@(optional):double (e:JSONDataObject key:string) {
         templates {
            es6 ( 
                "isNaN( parseFloat(" (e 1) " [" (e 2) "]) ) ? undefined : parseFloat(" (e 1) " [" (e 2) "]) " nl
            )
            ranger( "(getDouble " (e 1 )" " (e 2)")")
        }                
    } 

    getBoolean _@(optional):boolean (e:JSONDataObject key:string) {
         templates {
            es6 ( 
                "typeof(" (e 1) " [" (e 2) "]) === \"undefined\" ? undefined :(" (e 1) " [" (e 2) "]) " 
            )
            ranger( "(getBoolean " (e 1 )" " (e 2)")")
        }                
    } 

    keys _:[string] (e:JSONDataObject) {
        templates {
            es6 ( "Object.keys(" (e 1) ")")
            ranger( "(keys " (e 1 )")")
        }
    }


    isArray _:boolean (e:JSONValueUnion) {
        templates {
            es6 ( (e 1) " instanceof Array")
            ranger( "(isArray " (e 1 )")")
        }
    }

    asArray _@(optional):JSONArrayObject (e:JSONValueUnion) {
        templates {
            es6 ( (e 1) " instanceof Array ? " (e 1 ) " : undefined")
        }        
    }

    getValue _:JSONValueUnion (e:JSONArrayObject index:int) {
        templates {
            es6 ( (e 1) "[" (e 2) "]")
            ranger( "(getValue " (e 1) " " (e 2) " )")
        }
    }

    array_length _:int (e:JSONArrayObject) {
        templates {
            es6 ( (e 1) ".length")
        }
    }

    getObject _@(optional):JSONDataObject (e:JSONDataObject key:string) {
         templates {
            es6 ( 
                "(" (e 1) "[" (e 2) "] instanceof Object ) ? " (e 1) " [" (e 2) "] : undefined " 
            )
            ranger ("(getObject " (e 1) " " (e 2) ")")
        }                
    } 


    ; todo: proper array detection for optionals
    getArray _@(optional):JSONArrayObject (e:JSONDataObject key:string) {
         templates {
            es6 ( 
                "(" (e 1) "[" (e 2) "] instanceof Array ) ? " (e 1) " [" (e 2) "] : undefined " 
            )
            ranger ("(getArray " (e 1) " " (e 2) ")")
        }                
    } 


    set _:void (e:JSONDataObject key:string value:JSONValueUnion) {
        templates {
            es6 ( (e 1) "[" (e 2)"] = " (e 3) ";")
        }
    }

    from_string _:JSONDataObject (txt:string) {
         templates {
            es6 ( 
                "JSON.parse(" (e 1) ")"
            )
        }        
    }

    to_string _:string (e:JSONDataObject) {
         templates {
            es6 ( 
                "JSON.stringify(" (e 1) ")"
            )
        }        
    }

    to_string _:string (e:JSONArrayObject) {
         templates {
            es6 ( 
                "JSON.stringify(" (e 1) ")"
            )
        }        
    }

    push _:void ( e:JSONArrayObject el:JSONArrayUnion) {
        templates {
            es6 ( (e 1) ".push(" (e 2) ")")
        }           
    }
    json_array json@(expands):JSONArrayObject () {
        templates {
            es6 ("[]")
            ranger ("(json_array )")
        }        
    }

    json_test _:string ( str:string ) {
        templates {
            es6 ("\”foobar\"")
            ranger ("(json_test " (e 1) " )")
        }        
    }    
    json_object json:JSONDataObject () {
        templates {
            es6 ("{}")
            ranger ("(json_object )")
        }        
    }
    json_array json@(expands):JSONArrayObject ( e@(block):JSONArrayUnion ) {
        templates {
            es6 ("[" ( repeat_from 1 (  (block 1) ) ) "]")
            ranger ("(json_array " ( repeat 1 (  (block 1) ) ) ")")
        }        
    }
    json_obj json@(expands):JSONDataObject ( e@(block):JSONObjectUnion ) {
        templates {
            es6 ("{" nl I ( repeat_from 1 (  (block 1) ) ) i nl "}")
            ranger ("( json_obj " nl I ( repeat 1 (  (block 1) ) ) i nl ")")
        }
    }

    json_obj.attr _:JSONKeyValue (name:string value:string) {
        templates {
            es6 (
                "\"" (str 1) "\": " (e 2) ""
            )
            ranger ("(json.attr " (e 1) " " (e 2) ")")
        }
    }    

    json.attr _:JSONKeyValue (name:string value:string) {
        templates {
            es6 (
                "\"" (str 1) "\": " (e 2) ""
            )
            ranger ("(json.attr " (e 1) " " (e 2) ")")
        }
    }
    json.attr _:JSONKeyValue (name:string value:int) {
        templates {
            es6 (
                "\"" (str 1) "\": " (e 2) ""
            )
            ranger ("(json.attr " (e 1) " " (e 2) ")")
        }
    }    
    json.attr _:JSONKeyValue (name:string value:double) {
        templates {
            es6 (
                "\"" (str 1) "\": " (e 2) ""
            )
            ranger ("(json.attr " (e 1) " " (e 2) ")")
        }
    }                
    
    json_obj.attr _:JSONKeyValue (name:string value:JSONDataObject) {
        templates {
            es6 (
                "\"" (str 1) "\" : " (e 2) ""
            )
            ranger ("(json.attr " (e 1) " " (e 2) ")")
        }
    }    
    
    json.attr _:JSONKeyValue (name:string value:JSONDataObject) {
        templates {
            es6 (
                "\"" (str 1) "\" : " (e 2) ""
            )
            ranger ("(json.attr " (e 1) " " (e 2) ")")
        }
    }      
    json_obj.attr _:JSONKeyValue (name:string value:JSONArrayObject) {
        templates {
            es6 (
                "\"" (str 1) "\" : " (e 2) ""
            )
            ranger ("(json.attr " (e 1) " " (e 2) ")")
        }
    }      
    json.attr _:JSONKeyValue (name:string value:JSONArrayObject) {
        templates {
            es6 (
                "\"" (str 1) "\" : " (e 2) ""
            )
            ranger ("(json.attr " (e 1) " " (e 2) ")")
        }
    }  
}
