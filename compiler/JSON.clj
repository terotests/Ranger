
; for scala maybe
; https://www.playframework.com/documentation/2.6.x/ScalaJson
; Scala testing of JSON parsing:
; https://scalafiddle.io/sf/S0EpdDK/1
; https://scalafiddle.io/sf/S0EpdDK/5
; https://msdn.microsoft.com/en-us/library/system.json.jsonobject(v=vs.95).aspx


systemclass JSONDataObject {
    es6 Object
    java7 JSONObject
    go "map[string]interface{}"

}

systemclass JSONArrayObject {
    es6 JSONArrayObject2
    java7 JSONArray
    go "[]interface{}"
}

systemclass JSONKeyValue {
    es6 JSONKeyValue2
}

systemclass JSONValueUnion {
    es6 Object
    java7 Object
    go "interface{}"
}

systemunion JSONValueUnion ( JSONDataObject JSONArrayObject string int double boolean )
systemunion JSONArrayUnion ( JSONDataObject  string int double boolean )
systemunion JSONObjectUnion ( JSONKeyValue )

operator type:JSONArrayObject all {
    fn forEach( cb:(_:void (item:JSONValueUnion))) {
        def cnt (array_length self)
        def i 0
        try {
            while( cnt > 0 ) {
                def value (getValue self i)
                cb(value)
                cnt = cnt - 1
                i = i + 1
            }
        } {}
    }
    fn map:[S] (cb:(_:S (item:JSONValueUnion)) to@(noeval):[S] ) {
        def len (array_length self)
        def res:[S] 
        def i 0
        try {
            while ( i < len) {
                def it (getValue self i)
                push res (cb(it))
                i = i + 1
            }
            return res
        } {

        }
    }  
}

operators {

    print _:void (e:JSONDataObject) {
         templates {
            ranger ( "(print " (e 1 ) ")")
            es6 ( 
                "console.log(JSON.stringify(" (e 1) "));" nl
            )
            java7 @macro(true) ("print (to_string " (e 1) " )" (imp "org.json.JSONObject"))
        }        
    }

    getStr _@(optional):string (e:JSONDataObject key:string) {
         templates {
            php ( "isset(" (e 1) "[" (e 2) "]) ? " (e 1) "[" (e 2) "] : null" )
            es6 ( 
                "(typeof (" (e 1) " [" (e 2) "]) != \"string\" ) ? undefined : " (e 1) " [" (e 2) "] " nl
            )
            ranger ("(getStr " (e 1) " " (e 2) ")")
            java7 ( (e 1) ".isNull( " (e 2) " ) ? null : " (e 1) ".optString(" (e 2) ") " )
            go ( "r_get_opt_json_string(" (e 1) ", " (e 2) ")"
(create_polyfill "
func r_get_opt_json_string( data map[string]interface{}, key string ) *GoNullable  {
    res := new(GoNullable)
    v, ok := data[key]
    if ok {
        if arr, ok := v.(string); ok {
            res.has_value = true
            res.value = arr
            return res
        }
    }
    res.has_value = false
    return res
}
")            

            )


        }                
    } 

    getInt _@(optional):int (e:JSONDataObject key:string) {
         templates {
            php ( "isset(" (e 1) "[" (e 2) "]) ? " (e 1) "[" (e 2) "] : null" )
            es6 ( 
                "isNaN( parseInt(" (e 1) " [" (e 2) "]) ) ? undefined : parseInt(" (e 1) " [" (e 2) "]) " nl
            )
            ranger( "(getInt " (e 1 )" " (e 2)")")
            java7 ( (e 1) ".isNull( " (e 2) " ) ? null : " (e 1) ".optInt(" (e 2) ") " )
            go ( "r_get_opt_json_int(" (e 1) ", " (e 2 ) ")"
(create_polyfill "
func r_get_opt_json_int( data map[string]interface{}, key string ) *GoNullable  {
    res := new(GoNullable)
    v, ok := data[key]
    if ok {
        if arr, ok := v.(int); ok {
            res.has_value = true
            res.value = int64(arr)
            return res
        }
    }
    res.has_value = false
    return res
}
")            

            )
            
        }                
    } 

    getDouble _@(optional):double (e:JSONDataObject key:string) {
         templates {
            php ( "isset(" (e 1) "[" (e 2) "]) ? " (e 1) "[" (e 2) "] : null" )
            es6 ( 
                "isNaN( parseFloat(" (e 1) " [" (e 2) "]) ) ? undefined : parseFloat(" (e 1) " [" (e 2) "]) " nl
            )
            ranger( "(getDouble " (e 1 )" " (e 2)")")
            java7 ( (e 1) ".isNull( " (e 2) " ) ? null : " (e 1) ".optDouble(" (e 2) ") " )
            go ( "r_get_opt_json_double(" (e 1) ", " (e 2) ")"
(create_polyfill "
func r_get_opt_json_obj( data map[string]interface{}, key string ) *GoNullable  {
    res := new(GoNullable)
    v, ok := data[key]
    if ok {
        if arr, ok := v.(float64); ok {
            res.has_value = true
            res.value = arr
            return res
        }
    }
    res.has_value = false
    return res
}
")            

            )
            
        }                
    } 

    getBoolean _@(optional):boolean (e:JSONDataObject key:string) {
         templates {
            php ( "isset(" (e 1) "[" (e 2) "]) ? " (e 1) "[" (e 2) "] : null" )
            es6 ( 
                "typeof(" (e 1) " [" (e 2) "]) === \"undefined\" ? undefined :(" (e 1) " [" (e 2) "]) " 
            )
            ranger( "(getBoolean " (e 1 )" " (e 2)")")
            java7 ( (e 1) ".isNull( " (e 2) " ) ? null : " (e 1) ".optBoolean(" (e 2) ") " )
            go ( "r_get_opt_json_bool(" (e 1) ", " (e 2) ")"
(create_polyfill "
func r_get_opt_json_obj( data map[string]interface{}, key string ) *GoNullable  {
    res := new(GoNullable)
    v, ok := data[key]
    if ok {
        if arr, ok := v.(bool); ok {
            res.has_value = true
            res.value = arr
            return res
        }
    }
    res.has_value = false
    return res
}
")            

            )
        }                
    } 

    getObject _@(optional):JSONDataObject (e:JSONDataObject key:string) {
         templates {
            php ( "isset(" (e 1) "[" (e 2) "]) ? " (e 1) "[" (e 2) "] : null" )
            es6 ( 
                "(" (e 1) "[" (e 2) "] instanceof Object ) ? " (e 1) " [" (e 2) "] : undefined " 
            )
            ranger ("(getObject " (e 1) " " (e 2) ")")
            java7 ( (e 1) ".isNull( " (e 2) " ) ? null : " (e 1) ".getJSONObject(" (e 2) ") " )
            go ( "r_get_opt_json_obj(" (e 1) ", " (e 2) ")"
(create_polyfill "
func r_get_opt_json_obj( data map[string]interface{}, key string ) *GoNullable  {
    res := new(GoNullable)
    v, ok := data[key]
    if ok {
        if arr, ok := v.(map[string]interface{}); ok {
            res.has_value = true
            res.value = arr
            return res
        }
    }
    res.has_value = false
    return res
}
")            

            )
        }                
    } 


    ; todo: proper array detection for optionals
    getArray _@(optional):JSONArrayObject (e:JSONDataObject key:string) {
         templates {
            php ( "isset(" (e 1) "[" (e 2) "]) ? " (e 1) "[" (e 2) "] : null" )
            es6 ( 
                "(" (e 1) "[" (e 2) "] instanceof Array ) ? " (e 1) " [" (e 2) "] : undefined " 
            )
            ranger ("(getArray " (e 1) " " (e 2) ")")
            java7 ( (e 1) ".isNull( " (e 2) " ) ? null : " (e 1) ".getJSONArray(" (e 2) ") " )
            go ( "r_get_opt_array(" (e 1) ", " (e 2) ")"
(create_polyfill '
func r_get_opt_array( data map[string]interface{}, key string ) *GoNullable  {
    res := new(GoNullable)
    v, ok := data[key]
    if ok {
        if arr, ok := v.([]interface{}); ok {
            res.has_value = true
            res.value = arr
            return res
        }
    }
    res.has_value = false
    return res
}
')            

            )
        }                
    } 

    keys _:[string] (e:JSONDataObject) {
        templates {
            es6 ( "Object.keys(" (e 1) ")")
            ranger( "(keys " (e 1 )")")
            java7 ( "__getJSONKeys(" (e 1) ")"
; create template            
(create_polyfill "
static ArrayList<String> __getJSONKeys(JSONObject obj) 
{
    ArrayList<String> list = new ArrayList<String>();     
    try {
        JSONArray jsonArray = obj.names();
        if (jsonArray != null) { 
            int len = jsonArray.length();
            for (int i=0;i<len;i++){ 
                list.add(jsonArray.get(i).toString());
            } 
        } 
    } catch( Exception e) {
    }
    return list;
}    
    ")                               
            (imp "org.json.JSONObject")    
            (imp "org.json.JSONArray")    
            
            )
            go @macro(true) ("(keys " (e 1) ")")
            php  ("array_keys(" (e 1) ")")
        }
    }


    isArray _:boolean (e:JSONValueUnion) {
        templates {
            php ( "is_array(" (e 1) ")")
            es6 ( (e 1) " instanceof Array")
            ranger( "(isArray " (e 1 )")")
            go ( "r_is_obj_array(" (e 1) ")"
(create_polyfill "
func r_is_obj_array( data inteface{} ) bool {
    if _, ok := data.([]interface{}) ; ok {
        return ok
    }
    return false
}
")            
            )
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
            java7(  (e 1) ".get(" (e 2) " )")
            go ( (e 1) "[" (e 2) "]")
            php ( (e 1) "[" (e 2) "]")
        }
    }

    array_length _:int (e:JSONArrayObject) {
        templates {
            ranger ("(array_length " (e 1) ")")
            es6 ( (e 1) ".length") 
            java7 ( (e 1) ".length()" )
            go( "int64(len(" (e 1) "))" )
            php ( "count(" (e 1) ")" )
        }
    }

    set _:void (e:JSONDataObject key:string value:JSONValueUnion) {
        templates {
            ranger ( "(set " (e 1) " " (e 2) " " (e 3) " )")
            es6 ( (e 1) "[" (e 2)"] = " (e 3) ";")
            java7 ( (e 1) ".put(" (e 2)" , " (e 3) ");")
            go ( (e 1) "[" (e 2) "] = " (e 3) )
            php ( (e 1) "[" (e 2) "] = " (e 3) ";" )
        }
    }

    from_string _@(throws):JSONDataObject (txt:string) {
         templates {
            ranger ( "(from_string " (e 1 ) ")")
            es6 ( 
                "JSON.parse(" (e 1) ")"
            )
            java7 ("new JSONObject(" (e 1) ")"  (imp "org.json.JSONObject"))
            go ( "__r_json_to_interface(" (e 1) ")" (imp "encoding/json")

(create_polyfill "
func __r_json_to_interface ( s string ) map[string]interface{} {
	b := []byte(s)
	var f interface{}
	_ = json.Unmarshal(b, &f)
	return f.(map[string]interface{})
}
")

            )
            php ( "r_json_to_array(" (e 1) ")"
(create_polyfill 
"
function r_json_to_array($str) {
    $obj = json_decode($str, true);
    if( $obj == NULL) {
        throw new Exception('Invalid JSON');
    }
    return $obj;
}
"

)            
            )
        }        
    }

    to_string _:string (e:JSONDataObject) {
         templates {
            ranger ( "(to_string " (e 1 ) ")")
            es6 ( 
                "JSON.stringify(" (e 1) ")"
            )
            java7 ( (e 1) ".toString()" )
            go( "__toJSONData(" (e 1) ")" (imp "encoding/json")
(create_polyfill "
func __toJSONData ( data interface{} ) string {
	b, _ := json.Marshal(data)
	return string(b)
}
")            
            )
            php ( "json_encode(" (e 1) ")")
        }        
    }

    to_string _:string (e:JSONArrayObject) {
         templates {
            ranger ( "(to_string " (e 1 ) ")")
            es6 ( 
                "JSON.stringify(" (e 1) ")"
            )
            java7 ( (e 1) ".toString()" )
            go( "__toJSONData(" (e 1) ")" (imp "encoding/json")
(create_polyfill "
func __toJSONData ( data interface{} ) string {
	b, _ := json.Marshal(data)
	return string(b)
}
")            
            )
            php ( "json_encode(" (e 1) ")")
        }        
    }

    push _:void ( e:JSONArrayObject el:JSONArrayUnion) {
        templates {
            ranger ( "(push " (e 1 ) " " (e 2) " )")
            es6 ( (e 1) ".push(" (e 2) ")")
            java7 ( (e 1) ".put(" (e 2) ");")
            go( (e 1) " = append(" (e 1) "," (e 2) ")")
            php ( "array_push(" (e 1) ", " (e 2) ");")
        }           
    }
    json_array json@(expands):JSONArrayObject () {
        templates {
            es6 ("[]")
            ranger ("(json_array )")
            java7 ("new JSONArray()" (imp "org.json.JSONArray"))
            go ( "make([]interface{},0)" )
            php ( "array()" )
        }        
    }
    json_object json:JSONDataObject () {
        templates {
            es6 ("{}")
            ranger ("(json_object )")
            java7 ("new JSONObject()" (imp "org.json.JSONObject"))
            go ( "make(map[string]interface{})" )
            php ( "array()")
        }        
    }
    json_array json@(expands):JSONArrayObject ( e@(block):JSONArrayUnion ) {
        templates {
            es6 ("[" ( repeat_from 1 (  (block 1) ) ) "]")
            ranger ("(json_array " ( repeat 1 (  (block 1) ) ) ")")
            java7 ("new JSONArray" (imp "org.json.JSONArray"))
            go ( "make([]interface{},0)" )
            php ( "array()" )
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