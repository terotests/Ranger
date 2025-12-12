; Test: String operations

class StringOpsTest {
    sfn m@(main):void () {
        def str "Hello World"
        
        ; String length
        def len (strlen str)
        print ("Length: " + len)
        
        ; Substring
        def sub (substring str 0 5)
        print sub
        
        ; String concatenation
        def combined (str + "!")
        print combined
        
        ; Index of
        def idx (indexOf str "World")
        print ("Index: " + idx)
        
        print "Done"
    }
}
