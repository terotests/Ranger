
; union type operators

Import "JSON.clj"

operators {

    cast _:Any  (arg:T target@(noeval):Any) {
        templates {
            go ( (e 1) )
        }
    }
    cast _:S  (arg:T target@(noeval):S) {
        templates {
            ranger ("(cast " (e 1) " " (e 2) ":" (typeof 2) " )")
            es6 ( (e 1) )
            java7 ( "((" (typeof 2) ")" (e 1) ")" )
            swift3 ( (e 1) " as " (typeof 2) "" )
            cpp ( "mpark::get<" (typeof 2) ">(" (e 1) ")" )
            go ( (e 1) ".(" (typeof 2) ")" )
        }
    }

    case             _@(newcontext):void           ( arg@(union):T item2@(define):boolean code:block )  {
        templates {
            es6 (
                (forkctx _ ) (def 2) "if( typeof(" (e 1) ") === 'boolean' ) /* union case for boolean */ {" nl I
                        "var " (e 2) " = " (e 1) ";" nl
                        (block 3)                        
                        nl i "}"
            )  
        }
    }
    case             _@(newcontext):void           ( arg@(union):T item2@(define):int code:block )  {
        templates {
            es6 (
                (forkctx _ ) (def 2) "if( " "Number.isInteger ? Number.isInteger(" (e 1) ") : (function(v) { return typeof v === 'number' &&  isFinite(v) && Math.floor(v) === v; })(" (e 1) ")" " ) /* union case for int */ {" nl I
                        "var " (e 2) " = " (e 1) ";" nl
                        (block 3)                        
                        nl i "}"
            )  
            php (
                (forkctx _ ) (def 2) "if( is_int(" (e 1) ") ) {" nl I
                        (e 2) " = " (e 1) ";" nl
                        (block 3)                        
                        nl i "}"
            )  
        }
    }
    case             _@(newcontext):void           ( arg@(union):T item2@(define):double code:block )  {
        templates {
            es6 (
                (forkctx _ ) (def 2) "if ( (function(v) { return typeof v === 'number' &&  isFinite(v); })(" (e 1) "))" " /* union case for double */ {" nl I
                        "var " (e 2) " = " (e 1) ";" nl
                        (block 3)                        
                        nl i "}"
            )  
            php (
                (forkctx _ ) (def 2) "if( is_double(" (e 1) ") ) {" nl I
                        (e 2) " = " (e 1) ";" nl
                        (block 3)                        
                        nl i "}"
            )  
        }
    }

    case             _@(newcontext):void           ( arg@(union):T item2@(define):string code:block )  {
        templates {
            es6 (
                (forkctx _ ) (def 2) "if( typeof(" (e 1) ") === 'string' ) /* union case for string */ {" nl I
                        "var " (e 2) " = " (e 1) ";" nl
                        (block 3)                        
                        nl i "}"
            )  
            php (
                (forkctx _ ) (def 2) "if( is_string(" (e 1) ") ) {" nl I
                        (e 2) " = " (e 1) ";" nl
                        (block 3)                        
                        nl i "}"
            )
            ranger ( 'case ' (e 1) " " (e 2) ":" (typeof 2) " {" nl
                        I (block 3) i nl "}" nl
            )
        }
    }
    case             _@(newcontext):void           ( arg@(union):T item@(define):T code:block )  {
        templates {
            ranger ( "case " (e 1) " " (e 2) ":" (typeof 2) " {" nl
                        I (block 3) i nl "}" nl
            )
            php (
                (forkctx _ ) (def 2) "if( is_object(" (e 1) ") && get_class(" (e 1) ") == \"" (typeof 2) "\" ) /* union case */ {" nl I
                        (e 2) " = " (e 1) ";" nl
                        (block 3)                        
                        nl i "}"
            )  
            es6 (
                (forkctx _ ) (def 2) "if( " (e 1) " instanceof " (typeof 2) " ) /* union case */ {" nl I
                        "var " (e 2) " = " (e 1) ";" nl
                        (block 3)
                        
                        nl i "}"
            )  
            go (
                (forkctx _ ) (def 2) "switch " (e 1) ".(type) {" nl I
                        "case " (typeof 2) ":" nl
                            I nl
                            "var " (e 2) " " (typeof 2) " = " (e 1) ".(" (typeof 2) ");" nl
                            (block 3)
                            i nl
                        nl i "}"
            ) 
            csharp (
                (forkctx _ ) (def 2) "if( " (e 1) " is " (typeof 2) " ) {" nl I
                        (typeof 2) " " (e 2) " = (" (typeof 2) ")" (e 1) ";" nl
                        (block 3)
                        nl i "}"
            ) 
            swift3 (
                (forkctx _ ) (def 2) "if type(of: " (e 1) ") == " (typeof 2) ".self  /*swift version*/ {" nl I
                        "let " (e 2) " = " (e 1) " as! " (typeof 2)";" nl
                        (block 3)
                        
                        nl i "}"
            ) 
            java7 (
                (forkctx _ ) (def 2) "if( " (e 1) " instanceof " (typeof 2) ") {" nl I
                        (typeof 2) " " (e 2) " = (" (typeof 2) ") " (e 1) ";" nl
                        (block 3)
                        
                        nl i "}"
            ) 
            cpp (
                (forkctx _ ) (def 2) "if( mpark::holds_alternative<" (typeof 2) ">(" (e 1) ") ) {" nl I
                        (typeof 2) " " (e 2) " = mpark::get<" (typeof 2) ">(" (e 1) ");" nl
                        (block 3)
                        
                        nl i "}"
            ) 
            scala (
                (forkctx _ ) (def 2) (e 1) " match {" nl
                I "case " (e 2) " : " (typeof 2) " => {" nl I
                            (block 3)
                        nl i "}" nl
                  "case _ => {} " nl i 
                  "}" nl
            ) 
            
        }
    }    
    to   _:T ( to@(union noeval):T item:T) {
        templates {
            cpp.disabled ( "(r_create_union<" (typeof 1) ", " (typeof 2)">(" (e 2) "))" 
(create_polyfill 
'
template<typename T, typename S>
T r_create_union (S value) {
    T rv;
    rv = value;
    return rv;
};
'
)            
            )
            * ( (e 2) )
        }
    } 
}


operator type:[string:T] all {
    fn forEach:void (cb:(_:void (item:T index:string )) ) {
        def list (keys self)
        for list kk:string i {
            def value (unwrap (get self kk))
            cb( value kk )
        }
    } 
    fn forKeys:void (cb:(_:void (index:string))) {
        def list (keys self)
        for list it:string i {
            cb(it)
        }
    }      
}

operator type:[T] es6 {
    fn map:[T] (cb:(_:T (item:T index:int))) (
        (e 1) ".map(" (e 2) ")"
    )
;    fn map:[S] (cb:(_:S (item:T index:int)) to@(noeval):[S] ) (
;        (e 1) ".map(" (e 2) ")"
;    )
    fn forEach:void (cb:(_:void (item:T index:int)) ) (
        (e 1) ".forEach(" (e 2) ")"
    )
    fn filter:[T] (cb:(_:boolean (item:T index:int)) ) (
        (e 1) ".filter(" (e 2) ")"
    )
}
operator type:[T] all {

    ; pure function or operator could be simply inlined...
    fn forEach@(pure):void (cb:(_:void (item:T index:int))) @doc('Call `fb` for each item in array') {
        for self it:T i {
            cb(it i)
        }
    }  

    fn has:boolen ( el:T) {
        def idx (indexOf el)
        return (idx >= 0)
    }

    fn map:[T] (cb:(_:T (item:T index:int))) {
        def len (array_length self)
        def res:[T] 
        for self it:T i {
            push res (cb(it i))
        }
        return res
    }  

    fn map:[S] (cb:(_:S (item:T index:int)) to@(noeval):[S] ) {
        def len (array_length self)
        def res:[S] 
        for self it:T i {
            push res (cb(it i))
        }
        return res
    }  

    fn filter:[T] (cb:(_:boolean (item:T index:int))) {
        def res:[T]
        for self it:T i {
            if( cb(it i) )  {
                push res it
            }
        }
        return res
    } 
    fn reduce@(weak):T (cb:(_:T (left:T right:T)) initialValue:T) {
        def len (array_length self)
        def res:T initialValue
        if( len >= 1 ) {
            for self it:T i {
                res = ( cb ( res it ))
            }
        }        
        return res
    }     
    fn reduce@(weak):K (cb:(_:K (left:K right:T)) initialValue:K) {
        def len (array_length self)
        def res initialValue
        if( len >= 1 ) {
            for self it:T i {
                res = ( cb ( res it ))
            }
        }        
        return res
    }  

    fn groupBy:[T] ( cb:(_:string (item:T)) ) {
        def res:[T]
        def mapper:[string:boolean]
        for self it:T i {
            def key (cb(it))
            if( false == ( has mapper key ) ) {
                push res it
                set mapper key true
            } 
        }
        return res
    }

    fn clone:[T] () {
        def res:[T]
        for self it:T i {
            push res it
        }
        return res
    }


    ; some useful functions from scala
    fn find@(optional):T (cb:(_:boolean (item:T))) {
        def res@(optional):T
        for self it@(lives):T i {
            if( cb(it) )  {
                def res2@(optional):T 
                res2 = it
                return res2
            }
        }
        return res
    } 

    fn count:int (cb:(_:boolean (item:T))) {
        def res 0 
        for self it@(lives):T i {
            if( cb(it) )  {
                res = res + 1
            }
        }
        return res
    } 

    fn contains:boolean (cb:(_:boolean (item:T))) { 
        for self it@(lives):T i {
            if( cb(it) )  {
                return true
            }
        }
        return false
    } 


}

; immutable map type
trait Map @params( K T S ) {
    def elements@(weak):[K:T]    
}

trait Vector @params( T S ) {

    def start:int 0
    def cardinality 3
    def end:int 0
    def elements@(weak):[T]
    def parent@(weak):S

    ; inserting a new element inside the array
    ; you can re-use the arrays but the index ranges will change

    fn localCopy:S () {
        def obj (new S)
        obj.start = start
        obj.end = end
        obj.parent = this.parent
        obj.cardinality = cardinality
        obj.elements = elements
        return obj
    }

    fn set:S (idx:int item:T) {

        if( idx >= start ) {
            def res (this.localCopy())
            res.elements = (make _:[T] (res.cardinality) item)
            for elements e@(lives):T i {
                if ( (res.start + i) != idx ) {
                    set res.elements i e
                } {
                    set res.elements i item
                }
            }
            return res
        }
        def root (this.localCopy())
        def res root

        def p@(weak):S parent
        while( (!null? p) && (idx < p.start) ) {
            def newSlice@(lives) (p.localCopy())
            res.parent = newSlice
            res = newSlice
            if(!null? p.parent) {
                p = p.parent
            }
        }
        def newSlice@(lives) (p.localCopy())
        newSlice.elements = (make _:[T] (newSlice.cardinality) item)
        for p.elements e@(lives):T i {
            set newSlice.elements i e           
        }
        set newSlice.elements (idx - newSlice.start) item 
        res.parent = newSlice
        return root
    }    

    fn insert:S (idx:int item:T) {
        if( idx >= start ) {
            def res (this.localCopy())
            def use_card cardinality
            if( ( array_length res.elements) >= (use_card - 1) ) {
                use_card = ( array_length res.elements) + 1
            }
            res.elements = (make _:[T] (use_card) item)
            for elements e@(lives):T i {
                if ( res.start + i < idx ) {
                    set res.elements i e
                } {
                    if( idx == ( res.start + i )) {
                        set res.elements i item
                        set res.elements (i + 1) e
                    } {
                        set res.elements (i + 1) e
                    }                
                }
            }
            if( (idx - start) >= (array_length elements)) {
                set res.elements (idx - start) item
            }
            res.start = start
            res.end = end + 1
            res.cardinality = use_card
            return res
        }
        def root (this.localCopy())
        def res root
        res.start = start + 1
        res.end = end + 1        
        def p@(weak):S parent
        while( (!null? p) && (idx < p.start) ) {
            def newSlice@(lives) (p.localCopy())
            newSlice.start = newSlice.start + 1
            newSlice.end = newSlice.end + 1
            res.parent = newSlice
            res = newSlice
            if(!null? p.parent) {
                p = p.parent
            }
        }

        def newSlice@(lives) (p.localCopy())
        def use_card newSlice.cardinality
        if( ( array_length p.elements) >= (use_card - 1) ) {
            use_card = ( array_length p.elements) + 1
        }
        newSlice.elements = (make _:[T] (use_card) item)
        for p.elements e@(lives):T i {
            if ( newSlice.start + i < idx ) {
                set newSlice.elements i e
            } {
                if( idx == ( newSlice.start + i )) {
                    set newSlice.elements i item
                    set newSlice.elements (i + 1) e
                } {
                    set newSlice.elements (i + 1) e
                }                
            }            
        }
        
        newSlice.end = newSlice.end + 1
        newSlice.cardinality = use_card
        if ( (idx - newSlice.start) >= p.cardinality ) {
            newSlice.end = idx + 1
        }
        newSlice.parent = p.parent
        res.parent = newSlice
        return root
    }

    fn get:T (idx:int) {
        if( idx < 0 ) {
            ; should be runtime error here...
            return (itemAt elements 0)
        } 
        if( idx >= start && idx < end ) {
            return (itemAt elements (idx - start))
        }
        def p@(weak):S parent
        while( (!null? p) && (idx < p.start) ) {
            p = p.parent
        }
        if(!null? p ) {
            return (itemAt p.elements (idx - p.start))
        }
        return (itemAt elements 0)
    }    
    fn add:S (item:T) {
        if((end - start) >= cardinality) {
            def res (new S)
            res.start = this.end
            res.end = (this.end + 1)
            res.parent = this
            res.cardinality = (cardinality + 1)
            res.elements = (make _:[T] (res.cardinality) item)
            set res.elements 0 item
            return res
        }
        def res (new S)
        res.elements = (make _:[T] (cardinality) item)
        for elements e@(lives):T i {
            set res.elements i e
        }
        set res.elements (end - start) item
        res.parent = parent
        res.start = start
        res.end = end + 1
        res.cardinality = cardinality
        return res
    }

    fn count:int () {
        return end
    }

    ; TODO: create faster version which uses (make ) operator
    fn map:S (cb:(_:T (item:T)) ) {
        def res:S (new S)
        def cnt (this.count())
        def i 0
        while( i < cnt ) {
            def item (this.get(i))
            def new_value (cb(item))
            res = (res.add(new_value))
            i = i + 1
        }
        return res
    }     
}


operator type:Vector all {

;    TODO: strict type checking for this
;    fn for (iIndex@(ignore):T iteIndex@(ignore):int code:block ) (        
;        "def " (e 3) ":int 0" nl
;        "def loop_cnt (" (e 1) ".count())" nl
;        "while( " (e 3) "  < loop_cnt ) {" nl
;            I 
;            "def " (e 2) " (" (e 1) ".get(" (e 3) "))" nl
;            (block 4)
;            (e 3) " = " (e 3) " + 1" nl
;            i
;        "}" nl
;    )

    fn indexOf:int ( elem:T ) {
        def cnt (self.count())
        def i 0
        while( i < cnt ) {
            def item (itemAt self i)
            if(item == elem) {
                return i
            }
            i = i + 1
        }        
        return -1
    }
    fn clear:T (idx:int) { 
        ; def val (self.get(idx))
        return (new T)
    }     

    fn itemAt:T (idx:int) { 
        def val (self.get(idx))
        return val
    } 
    fn push:S (item:T) {
        return (self.add(item))
    }
    fn last:T () {
        return (itemAt self ((self.count()) - 1) )
    }
    fn array_length:int () {
        return (self.count())
    }    
    fn length:int () {
        return (self.count())
    }    
    fn forEach:void (cb:(_:void (item:T))) {
        def cnt (self.count())
        def i 0
        while( i < cnt ) {
            def item (itemAt self i)
            cb(item)
            i = i + 1
        }
    }

    fn forUntil:void (cb:(_:boolean (item:T))) {
        def cnt (self.count())
        def i 0
        while( i < cnt ) {
            def item (itemAt self i)
            if( (cb(item)) == false ) {
                return
            }
            i = i + 1
        }
    }

    fn map:S ( cb:(_:T (item:T)) ) {
        def res (new S) 
        def cnt (self.count())
        def i 0
        while( i < cnt ) {
            def item (itemAt self i)
            def value (cb(item))
            res = res.add(value)
            i = i + 1
        }
        return res
    }     

    ; TODO: faster version ....
    fn map:[K] (cb:(_:K (item:T)) to@(noeval):[K] ) {
        def res:[K] 
        def cnt (self.count())
        def i 0
        while( i < cnt ) {
            def item (itemAt self i)
            push res (cb(item))
            i = i + 1
        }
        return res
    }     


}

operator type:Map all {
    fn  keys:[K] () {
        return (keys self.elements)
    }
    fn  get@(optional):T (key:K) {
        return (get self.elements key)
    }
    fn  has:boolean (key:K) {
        return (has self.elements key)
    }
    fn  set:S (key:K value:T) {
        def c (new S)        
        def keys ( keys self.elements)
        for keys k:string i {
            if(k==key) {

            } {
                set c.elements k (unwrap (get self.elements k))
            }
        }
        set c.elements key value
        return c
    }
    fn  forEach@(weak):S ( cb:(_:void (item:T index:K)) ) {
        def keys (keys self.elements)
        for keys key:K i {
            cb( (unwrap (get self.elements key)) key )
        }
        return self
    }

}


