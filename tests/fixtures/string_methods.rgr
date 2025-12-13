; Test: String operations - startsWith, endsWith, contains, replace

class StringMethodsTest {
    sfn m@(main):void () {
        def str "Hello World"
        
        ; Test startsWith
        if (startsWith str "Hello") {
            print "startsWith Hello: true"
        }
        if (startsWith str "World") {
            print "startsWith World: true"
        } {
            print "startsWith World: false"
        }
        
        ; Test endsWith
        if (endsWith str "World") {
            print "endsWith World: true"
        }
        if (endsWith str "Hello") {
            print "endsWith Hello: true"
        } {
            print "endsWith Hello: false"
        }
        
        ; Test contains
        if (contains str "lo Wo") {
            print "contains 'lo Wo': true"
        }
        if (contains str "xyz") {
            print "contains xyz: true"
        } {
            print "contains xyz: false"
        }
        
        ; Test replace
        def replaced (replace str "World" "Ranger")
        print replaced
        
        ; Test edge cases
        def empty ""
        if (startsWith empty "") {
            print "empty startsWith empty: true"
        }
        
        if (endsWith "test" "st") {
            print "test endsWith st: true"
        }
        
        print "Done"
    }
}
