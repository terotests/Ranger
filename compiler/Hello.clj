(

   (CreateClass bar
        (
            (PublicMethod Hello:void ()
                (
                )
            )
        )
   )

   (CreateClass bar2
        (
            (PublicMethod myFn:string ( x:int y:double)
                (
                )
            )
        )
   )
    
    (CreateClass foo
        (
            @onError(
                (print "Error")
            )
            dd  ; creates undefined variable error
            (def ford:bar2 (new bar ())) ; can not define bar2 and then instantiate bar 

            (def items:[string])

            (def a_len:int (array_length items))    ; should work
            (def a_len:string (array_length items)) ; should fail

            (def s_len1:int (strlen "My String"))   ; OK strlen
            (def s_len2:int (strlen 33))            ; failing strlen

            (PublicMethod Hello:void ()
                (
                (def bb:bar)
                    (= bb (new bar ()))
                    (def fobba:bar2 (new bar2 ()))

                    (def ss:string (call fobba myFn ( 2 4.4)))

                    ; definitions which should fail...
                    (def int_v:int 0)
                    (= int_v "moro") ; this should generate compiler error                    
                    (= int_v ( + "morjens" 30))
                    
                    (if (== 2 true) ; invalid comparision
                        (
                            
                        )
                    )

                    (if (== (== 2 2) true) ; good comparision
                        (
                            
                        )
                    )

                    (def fRes:double (sin 2.3)) ; ok
                    (def fRes2:double (sin "2.3")) ; not valid math op should fail

                    @onError(
                        (print("Error occurred during compile"))
                    )

                    (def bb:boolean true)
                    (if (== true bb)
                        (                            
                            (Moi _)
                            (call this Moi ())                    
                            (print "Moi")
                            
                        )
                    )
                    (print "Hello World")
                )
            )
            (PublicMethod Moi:void ()
                (
                    (print "Hello World")
                )
            )

        )
    )
)