; Test: Optional value handling

class Person {
    def name:string ""
    
    Constructor (n:string) {
        name = n
    }
}

class OptionalTest {
    sfn m@(main):void () {
        ; Optional with value
        def maybePerson:Person
        maybePerson = (new Person("Alice"))
        
        if (!null? maybePerson) {
            def p (unwrap maybePerson)
            print p.name
        }
        
        ; Use default string directly
        def value "default"
        print value
        
        print "Done"
    }
}
