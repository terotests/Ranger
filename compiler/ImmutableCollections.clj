
operator type:[K:T] es6 {
    fn immutable_set:[K:T] (n:K v:T) ( "((k,v) => { var o = {}; o[k]=v; return Object.assign({}, " (e 1) ", o); })(" (e 2) ", " (e 3) ")" )
}

operator type:[K:T] all {
    fn immutable_set:[K:T] (n:K v:T) {
        def res:[K:T]
        def ks (keys self)
        for ks key:K i {
            set res key (unwrap (get self key))
        }
        set res n v
        return res
    }
}

; https://github.com/mediocregopher/seq

operator type@(immutable):[K:T] es6 {
    fn immutable_set@(weak immutable):[K:T] (key:K item:T) ( (e 1) ".set(" (e 2) ", " (e 3) ") /* immutable set 1 */")
    fn set@(weak immutable):[K:T] (key:K item:T) ( (e 1) ".set(" (e 2) ", " (e 3) ") /* immutable set 1 */")
}

operator type@(immutable):[T] es6 {
    fn add@(weak immutable):[T] (item@(strong):T) ( (e 1) ".push(" (e 2) ") /* immutable push  1 */")
    fn array_length:int () ( (e 1) ".size /* immutable size 1 */")
    fn forEach:void (cb:(_:void (item:T))) (  (e 1) ".find(" (e 2) ") /* immutable.js forEach  1 */")
    fn itemAt:T (idx:int) (  (e 1) ".get(" (e 2) ") /* immutable.js itemAt 1 */")
    fn set@(immutable):[T] (idx:int value:T) ( (e 1) ".set(" (e 2) ", " (e 3) ")" )

    fn languageInfo () {
        print "Immutable.js for JavaScript"
    }
}

operator type@(immutable):[T] go {
    fn add@(weak immutable):[T] (item@(strong):T) ( (e 1) ".push(" (e 2) ") /* immutable push  1 */")
    fn array_length:int () ( (e 1) ".size /* immutable size 1 */")
    fn forEach:void (cb:(_:void (item:T))) (  (e 1) ".find(" (e 2) ") /* immutable.js forEach  1 */")
    fn itemAt:T (idx:int) (  (e 1) ".get(" (e 2) ") /* immutable.js itemAt 1 */")
    fn set@(immutable):[T] (idx:int value:T) ( (e 1) ".set(" (e 2) ", " (e 3) ")" )

    fn languageInfo () {
        print "Immutable Seq for GoLang"
    }
}

operator type@(immutable):[K:T] go {
    fn keys:[string] () ("(func() []string {" nl I
                        "keys := reflect.ValueOf(" (e 1) ").MapKeys()" nl
                        "strkeys := make([]string, len(keys))" nl
                        "for i := 0; i < len(keys); i++ {" nl I
                          "strkeys[i] = keys[i].String()" nl i "}" nl
                        "return strkeys" nl i "})()"
                    (imp "reflect")) 
    fn get@(optional):T (key:K) ( 

(macro (nl "func r_get_" (r_ktype 1)  "_" (r_atype 1) "( a " (typeof 1) ", key " (r_ktype 1) " ) *GoNullable  { " nl I 
    "res := new(GoNullable)" nl  
    "v, ok := a[key]" nl 
    "if ok { " nl
        I 
          "res.has_value = true" nl
          "res.value = v" nl
          "return res" nl
        i
    "}" nl
    "res.has_value = false" nl
    "return res" nl
i "}" nl ))                   
                    "r_get_" (r_ktype 1)  "_" (r_atype 1) "(" (e 1) ", " (e 2) ")"
                ) 
    fn immutable_set@(weak immutable):[K:T] (n:K v:T) {
        def res:[K:T]
        def ks (keys self)
        for ks key:K i {
            set res key (unwrap (get self key))   
        }
        set res n v
        return res
    }
    fn immutable_set@(weak immutable):[K:T] (n:K v:T) {
        def res:[K:T]
        def ks (keys self)
        for ks key:K i {
            set res key (unwrap (get self key))   
        }
        set res n v
        return res
    }
    fn set@(weak immutable):[K:T] (n:K v:T) {
        def res:[K:T]
        def ks (keys self)
        for ks key:K i {
            if( key == n) {
                set res key v
            } {
                set res key (unwrap (get self key))
            }   
        }
        return res
    }
}

operator type@(immutable):[T] go {
    fn add@(weak immutable):[T] (item@(strong):T) ( "append( " (e 1) ", " (e 2) ") /* immutable push  1 */")
    fn array_length:int () ( "int64(len( " (e 1) ")) /* immutable size 1 */")
    fn forEach:void (cb:(_:void (item:T))) {
        def list:[T] self
        for list item:T i {
            cb(item)
        }
    }
    fn itemAt:T (idx:int) (  (e 1) "[" (e 2) "] /* immutable.js itemAt 1 */")
}

operator type:[T] all {
    fn forEach:void (cb:(_:void (item:T))) {
        for self it:T i {
            cb(it)
        }
    } 
    fn add@(weak):[T] (item@(strong):T) {
        def len (array_length self)
        def res:[T] (make _:[T] (len + 1))
        for self it:T i {
            set res i it
        }
        set res (len) item
        return res
    } 
    fn map:[T] (cb:(_:T (item:T))) {
        def len (array_length self)
        def res:[T] (make _:[T] len)
        for self it:T i {
            set res i (cb(it))
        }
        return res
    }  
    fn map:[S] (cb:(_:S (item:T)) to@(noeval):[S] ) {
        def len (array_length self)
        def res:[S] (make _:[S] len)
        for self it:T i {
            set res i (cb(it))
        }
        return res
    }     
}

; NOTE: generic immutable collection is a bit dangerous
operator type@(immutable):[T] all {
    fn forEach:void (cb:(_:void (item:T))) {
        for self it:T i {
            cb(it)
        }
    } 
    fn set@(immutable):[T] (index:int value:T) {
        print "immutable set called! value = " + value + " index = " + index
        ; mutable 
        def len (array_length self)
        def res:[T] (make _:[T] len)
        def i 0
        while (i < len) {
            set res i (itemAt self i)
            i = i + 1
        }
        set res index value
        return res        
    }    
    fn add@(weak):[T] (item@(strong):T) {
        def len (array_length self)
        def res:[T] (make _:[T] (len + 1))
        for self it:T i {
            set res i it
        }
        set res (len) item
        return res
    } 
    fn map:[T] (cb:(_:T (item:T))) {
        def len (array_length self)
        def res:[T] (make _:[T] len)
        for self it:T i {
            set res i (cb(it))
        }
        return res
    }  
    fn map:[S] (cb:(_:S (item:T)) to@(noeval):[S] ) {
        def len (array_length self)
        def res:[S] (make _:[S] len)
        for self it:T i {
            set res i (cb(it))
        }
        return res
    }     
}

operator type@(immutable):[K:T] all {
    fn immutable_set@(immutable):[K:T] (n:K v:T) {
        def res:[K:T]
        def ks (keys self)
        for ks key:K i {
            set res key (unwrap (get self key))   
        }
        set res n v
        return res
    }
}