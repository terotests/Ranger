

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

    ; TODO: faster version ....
    fn map:S (cb:(_:T (item:T)) ) {
        def len (this.count())
        def res:S (new S)
        def cnt (this.count())
        def i 0
        while( i < cnt ) {
            def item (this.get(i))
            ; set res i (cb(item))
            def new_value (cb(item))
            res = (res.add(new_value))
            i = i + 1
        }
        return res
    }     

    fn mapper:S (cb:(_:T (item:T)) ) {
        def len (this.count())
        def res:S (new S)
        def cnt (this.count())
        def i 0
        while( i < cnt ) {
            def item (this.get(i))
            ; set res i (cb(item))
            def new_value (cb(item))
            res = (res.add(new_value))
            i = i + 1
        }
        return res
    }      

}


operator type:Vector all {

    ; couple of trait test functions for now...
    fn hello@(weak):S () {
        print "immutable says hi! my size is " + (self.count())
        return self
    }
    fn hello@(weak):S (msg:string) {
        print "immutable sends message " + msg + " AND my size is " + (self.count())
        return self
    }
    ; fn get:T (idx:int) {
    fn itemAt:T (idx:int) { 
        ; def val:T  (self.get(idx))
        def val (self.get(idx))
        return val
    } 
    fn imm_itemAt:T (idx:int) { 
        ; def val:T  (self.get(idx))
        def val (self.get(idx))
        return val
    } 
    ; fn push:S () {}
    fn push:S (item:T) {
        return (self.add(item))
    }
    fn +:S (item:T) {
        return (self.add(item))
    }
    fn last:T () {
        ; def len (self.count())
        ; def last_idx ((self.count()) - 1)
        ; return (self.get( last_idx ))
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

    fn map:S ( cb:(_:T (item:T)) ) {
        def len (self.count())
        def res (new S) 
        def cnt (self.count())
        def i 0
        while( i < cnt ) {
            def item (itemAt self i)
            ; set res i (cb(item)
            def value (cb(item))
            res = res.add(value)
            i = i + 1
        }
        return res
    }     

    ; TODO: faster version ....
    fn map:[K] (cb:(_:K (item:T)) to@(noeval):[K] ) {
        def len (self.count())
        def res:[K] 
        def cnt (self.count())
        def i 0
        while( i < cnt ) {
            def item (itemAt self i)
            ; set res i (cb(item))
            push res (cb(item))
            i = i + 1
        }
        return res
    }     


}

operator type:Map all {
    fn  imm_keys:[K] () {
        return (keys self.elements)
    }
    fn  keys:[K] () {
        return (keys self.elements)
    }
    fn  get@(optional):T (key:K) {
        return (get self.elements key)
    }
    fn  imm_get@(optional):T (key:K) {
        return (get self.elements key)
    }
    fn  remap:S () {
        def obj (new S)
        return obj
    }
    fn  imm_has:boolean (key:K) {
        return (has self.elements key)
    }
    fn  has:boolean (key:K) {
        return (has self.elements key)
    }
    fn  imm_set:S (key:K value:T) {
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
}

operator type:Map all {
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
    fn  forEach@(weak):S ( cb:(_:void (value:T key:K)) ) {
        def keys (keys self.elements)
        for keys key:K i {
            cb( (unwrap (get self.elements key)) key )
        }
        return self
    }

}


