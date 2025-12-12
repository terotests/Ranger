; Test: Hash map operations

class HashMapTest {
    sfn m@(main):void () {
        ; Create a hash map
        def scores:[string:int]
        
        ; Set values
        set scores "Alice" 100
        set scores "Bob" 85
        set scores "Charlie" 92
        
        ; Get values
        def aliceScore (get scores "Alice")
        if (!null? aliceScore) {
            def score (unwrap aliceScore)
            print ("Alice score: " + score)
        }
        
        ; Check if key exists
        if (has scores "Bob") {
            print "Bob exists"
        }
        
        ; Get all keys
        def allKeys (keys scores)
        def keyCount (array_length allKeys)
        print ("Keys: " + keyCount)
        
        print "Done"
    }
}
