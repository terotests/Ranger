
operators {
    test1 _:void () {
        templates {
            es6 ( '' (plugin 'maven' (  (dep 'org.json' 'json' '20171018'  ) ) ) )
            java7 ( '' (plugin 'maven' (  (dep 'org.json' 'json' '20171018'  ) ) ) )
            cpp ( '' (plugin 'makefile' (  (dep 'picosha2.h' 'https://github.com/okdshin/PicoSHA2/blob/master/picosha2.h'  ) ) ) )
        }
    }
}

class someClass @serialize(true) {
    def name 'foobar'
    def lastName 'OK'
}

; testing plugin commands
class testpcmd {
    static fn main () {
        
        print "" || "second"
        print "first " || "second"
        print "" || "" || "Third"

        test1

;        def o (new someClass)
;        print (to_string (o.toDictionary()))


    }
}