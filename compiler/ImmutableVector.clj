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
            res.elements = (make _:[T] (res.cardinality))
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
        newSlice.elements = (make _:[T] (newSlice.cardinality))
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
            res.elements = (make _:[T] (use_card))
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
        newSlice.elements = (make _:[T] (use_card))
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
            res.elements = (make _:[T] (res.cardinality))
            set res.elements 0 item
            return res
        }
        def res (new S)
        res.elements = (make _:[T] (cardinality))
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
    fn map:[K] (cb:(_:K (item:T)) to@(noeval):[K] ) {
        def len (self.count())
        def res:[K] (make _:[K] len)
        def cnt (self.count())
        def i 0
        while( i < cnt ) {
            def item (itemAt self i)
            set res i (cb(item))
            i = i + 1
        }
        return res
    }     
}