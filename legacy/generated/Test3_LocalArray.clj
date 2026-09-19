; Test 3: Array in main function only

class Test3 {
    sfn m@(main):void () {
        def names:[string]
        push names "hello"
        push names "world"
        print (itemAt names 0)
        print (itemAt names 1)
        print "Done"
    }
}
