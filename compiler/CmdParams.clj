

; -i file2.pdf -o file3.pdf
class CmdParams {

    def flags:[string:boolean]
    def params:[string:string]
    def values:[string]

    fn hasParam:boolean (name:string) {
        return (has params name)
    }

    fn getParam@(optional):string ( name:string) {
        return (get params name)
    }

    ; -p=100
    ; -o=""
    fn collect() {
        def cnt (shell_arg_cnt)
        def i 0 
        while( cnt > 0 ) {
            def argStr (shell_arg i)
            def firstC (charAt argStr 0)
            if( firstC == (ccode "-") ) {
                def pS (substring argStr 1 (strlen argStr))
                def parts (strsplit pS "=")
                if( (array_length parts) == 1 ) {
                    def flag (itemAt parts 0)
                    set flags flag true
                } {
                    def name (itemAt parts 0)
                    remove_index parts 0
                    def value (join parts "=")
                    set params name value
                }
            } {
                push values argStr
            }
            cnt = cnt - 1
            i = i + 1
        }
    }
}

class test_cmdparams {

    fn run () {
        def prms (new CmdParams)
        prms.collect()
        print "--- params ----"
        def pNames (keys prms.params)
        for pNames v:string i {
            print v + " = " + (unwrap (get prms.params v))
        }
        print "--- flags ----"
        def flagNames (keys prms.flags)
        for flagNames v:string i {
            print v
        }
        print "--- values ----"
        for prms.values v:string i {
            print v
        }
    }

    sfn m@(main) () {
        def o (new test_cmdparams)
        o.run()
    }
}