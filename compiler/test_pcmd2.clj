
operators {
    test1 _:void () {
        templates {
            es6 ( '' (plugin 'maven' (  (dep 'org.json' 'json' '20171018'  ) ) ) )
            java7 ( '' (plugin 'maven' (  (dep 'org.json' 'json' '20171018'  ) ) ) )
            cpp ( '' (plugin 'makefile' (  (dep 'picosha2.h' 'https://github.com/okdshin/PicoSHA2/blob/master/picosha2.h'  ) ) ) )
        }
    }
}

class testpcmd2 {
    static fn main () {
        
        print "---- new version of the test ---"
        print "" || "second"
        print "first " || "second"
        print "" || "" || "Third"

        print "OK"

        test1

;        def o (new someClass)
;        print (to_string (o.toDictionary()))


    }
}