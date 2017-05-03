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
            (PublicMethod Hello:void ()
                (
                )
            )
        )
   )
    
    (CreateClass foo
        (
            (PublicMethod Hello:void ()
                (
                    (def bb:bar)
                    (= bb (new bar ()))
                    (def fobba:bar2 (new bar2 ()))
                    
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