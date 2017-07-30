
operator type:[K:T] es6 {
    fn immutable_set:[K:T] (n:K v:T) ( "((k,v) => { var o = {}; o[k]=v; return Object.assign({}, " (e 1) ", o); })(" (e 2) ", " (e 3) ")" )
}

operator type:[K:T] all {
    fn immutable_set:[K:T] (n:K v:T) {
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
