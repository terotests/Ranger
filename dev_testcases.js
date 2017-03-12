// place some test content into context
var ctx = new Jinx.CreateContext();

// for debugging
ctx.__def("__lisp_cmd");
ctx.__lisp_cmd = {

};



ctx.__def("_xx_");
ctx.__def("obj");
ctx.__def("obj2");
ctx.__def("simple_list");

ctx["_xx_"] = 1000;
ctx["obj"] = {
    name : "John smith"
}
ctx["obj2"] = {
    name : "Someone else"
}
ctx["simple_list"] = [
    {
        name : "John smith",
        age : 34
    },{
        name : "Someone else",
        age : 45
    },
    {
        name : "Third else",
        age : 67
    }
]
/*

  could there be a JSON object literal or simple obj literal

  // define object literal inside the code ??? 
  (def people [{matti:"Joku"}, {teppo:"Hello"}])

  // --> voiko olla eri tasolla toimiva JS literal tai
  // js expression container, tavallaan JSON dataa lispin sisällä?

  // voi olla että tämä ei olisi kovin hyvä idea...
  (def a ([] 1 2 3 4 5 6))

  ; so, you want to create someting like this:
  (def deep_object ({}
                        "level1" ({}
                                    "name" "deep property"
                                    "address" "address of level1"
                                )                        
                        ))  

  ; this would create exactly the same result...
  (def deep_object {
                      level1 : {
                         "name" : "deep property"
                         "address" : "address of level1"
                      } 
                   })

   ; really really, not so difficult...

   --- how about the process description then?

process {

    // simple view description comes over here...
    <View to="">

    </View>

}
                

*/
init_lisp_core();
var lisp_ast = JMLParser(`
( 
    ; helper function to add things in the html 
    (defn html ( & ) 
        (add_to_dom "main" "<div style='padding:3px;font-family:verdana;color:#444;background-color:#eee;margin:2px;'>" & "</div>") 
    )
    (defn test_ok ( & ) 
        (add_to_dom "main" "<div style='padding:3px;font-family:verdana;color:#444;background-color:#eee;margin:2px;'> 👌 " & "</div>") 
    ) 
    (defn test_fail ( & ) 
        (add_to_dom "main" "<div style='padding:3px;font-family:verdana;color:#444;background-color:#eee;margin:2px;'>😡 " & "</div>") 
    )     

    ; assert function for test cases
    (defn assert ( cond & ) 
        (   
            (if cond
                (test_ok & )
                (test_fail & )
            )
        )
    )      

    
    (console "--== ==--")

    (defn => (x) (console (join "ha! ha! " x)))

    (=> 1)

    (console ( 
                ( def foo "ok" )
                ( (=> (x) (+ x 10)) 33 )
             ))

    (console ( 
                ( def foo "ok" )
                ( (lambda (x) (+ x 10)) 33 )
             ))             

    ; the ideas of JSX in lisp world... 
    (console    <View as=(if (> x 10) "main" "not main")>
                    <Label color="white">
                        The name is (x) or something </Label>
                        (
                            (console    <View as=(if (> x 10) "main" "not main")>
                                            <Label/>
                                            <Label color="white">
                                                The name is (x) or something </Label>
                                                (
                                                    (def foo 200)
                                                    (def xx <div></div>)
                                                    (foo)
                                                )
                                        </View>)
                            (def foo 200)
                            (def xx <div></div>)
                            (foo)
                        )
                 </View>)
 


    (assert (== 1 2) "Error test")
    (assert false "Error test")    
    (assert true "Success test")
    (assert (== 10 10) "Success test")

    ; test deep object hirarchy def... it is not really very difficult
    (def deep_object ({}
                         "level1" ({}
                                    "name" "deep property"
                                    "address" "address of level1"
                                  )     
                        "Second Level" ({}
                                    "name" "deep property"
                                    "address" "address of level1"
                                    "items" ([] 1 2 3 4 5)
                                )                                                         
                      ))

    ; the last element is returned...
    (console
        (    
            (def x "foo")
            (def y "the last element value abba")
            y
            x
            ({} "name" "jarmo")
        )
    )

    (console x )
    (console y )

    ; if the variable starts with < + letter treat it as XML content
    (console <div color="white">Hello World!</div> )

    ; second thing: how to transform contents of the XML into lisp then...
    ; <div>This is (x + 1)</div>
    ; <div>("raw literal might come like this...")</div>
    ; <div color=(if (> x 10) "jep" "not" )></div>

    (console "-XML-")
    (def x 10)
    (console 
        (if (== x 10) 
            <div test="1"></div> 
            "or then not" ))

    ; test attributes...

    (console 
        (if (== x 10) 
            <div test=(x)></div> 
            "or then not" ))    


    (console
        (    
            (def x "foo")
            (def y "the last element value abba")
            (deep_object)
        )
    )                      

    (console " ----- ")

    (console deep_object)

    (if 0 
        (html " zero is false ")
        (html " zero is true ")
    )

    (if (== 0 0) 
        (html " 0 == 0 is true ")
    )    

    (defn 🐱 (&) 
        (join "meaow! " &))

    (html "Testing 🐱 function :" (🐱 "Koira " "Hamsteri ") )

    ; angry pirkka
    (defn 😡 (x) ( 
                    (def a ([]))
                    (loop x (push a "😡"))
                    (join a)
                )
    )
    
    (console (😡 20))

    (html "testing angry function " (😡 10) )

    ; works like this
    (html "add things to HTML like this")

    ; define types...
    (def txt:string "OK" txt2 " second var OK too")
    (html txt txt2)


    ; test events...
    (on "txt" ( html "😡 event was fired..." ))
    (set txt "new text value")
    
    ; create new array...
    (def newArray ([] 1 2 3 4 5 6) )
    
    (html "array length = " (length newArray))
    (set txt "new text value 2")

    (html "array values " (join_with newArray ", ") )

    ; filter even values
    (def filteredArray (filter (=> (item) (== 0 ( % item 2))) newArray) )
    (html "filtered % 2 == 0 array values " (join_with filteredArray ", ") )
    
    (assert (== (. filteredArray 0) 2) "item 0 == 2")
    (assert (== (. filteredArray 1) 4) "item 1 == 4")
    (assert (== (. filteredArray 2) 6) "item 2 == 6")

    ; filter odd values
    (def filteredArray2 (filter (=> (item) (== 1 ( % item 2))) newArray) )
    (html "filtered % 2 == 1 array values " (join_with filteredArray2 ", ") )

    (assert (== (. filteredArray2 0) 1) "item 0 == 1")
    (assert (== (. filteredArray2 1) 3) "item 1 == 3....")
    (assert (== (. filteredArray2 2) 5) "item 2 == 5")    

    ; create new object...
    (def myObj ({} 
                    "name" "foobar" 
                    "count" 10 
                    "name_uc" (uppercase "foobar")))

    (html (. myObj "name"))

    (if (== (. myObj "name") "foobar") (test_ok "Object create test, name ok"))
    (if (== (. myObj "count") 10) (test_ok "Object create test, count == 10") (test_fail "Count test failed"))
    (if (== (. myObj "name_uc") "FOOBAR") (test_ok "object functional init ok") (test_fail "object functional init failed"))

    ; test just object expression
    (if (== (. ({} "name" "name in expression")  "name") "name in expression") 
            (test_ok "Object create test, name in expression ok")
            (test_fail "Object create test, name in expression failed")
    )


    (def xx:int 123)
    (html "xx == " xx:int)
    (html "xx == " xx)

    (html "typeof xx == " (typeof xx))


    (html "typeof txt == " (typeof txt))

    (def bool_value_true true)
    (def bool_value_false false)

    (html " true is " bool_value_true " false is " bool_value_false)

    (if bool_value_true (test_ok "true test OK"))
    (if (! bool_value_true ) 
            (html "true negation test failed!")
            (test_ok "true negation test OK")
    )

    (if (! bool_value_false ) 
            (test_ok "false negation test OK!")
            (html "false negation test failed...")
    )    

    ( defn test_local_def()
       (    
           ; local variable is this easy
           (def x 123)
           (let ((x 100)))
           
           (html "testing local definition x = "  x)
       )
    )

    (test_local_def _)
    (html "testing local definition x = "  x)


    ; define the mapping as a function
    (defn list_to_ui (heading & )
        (
            (html 
                "<div style='padding:10px;background-color:#47a;color:white;'>" heading "</div>"    
                "<ul>" 
                    (join 
                        (map 
                            ( => 
                                (item) join "<li style=''>" item "</li>" ) 
                            (map 
                                ( => (x) uppercase (. x "name")  )                             
                                &
                            )
                        )
                    )
                "</ul>"
            )           
        )
    )
    (list_to_ui  (uppercase "TEST LIST 1") simple_list)


    ; define the mapping as a function
    (defn list_to_ui2 (heading & )
        (
            (html 
                "<div style='padding:10px;background-color:#47a;color:white;'>" heading "</div>"    
                "<ul>" 
                    (join 
                        (map ( => (item) join "<li style=''>" item "</li>" ) 
                        (map ( => (x) uppercase (. x "name")  )  & )
                        )
                    )
                "</ul>"
            )           
        )
    )
    (list_to_ui2  (uppercase "TEST LIST 2") simple_list)    


    ; try getting the object key
    (html (. obj "name"))

    ; try mapping native list
    (html "<b>Testing mapping jative JavaScript list simple_list to HTML</b>")
    (html "<ul>" 
            (join 
                (map 
                    (lambda 
                        (person) join "<li>" (. person "name") ", age " (. person "age")
                                           (if (> (. person "age") 60) " <sup>(this person is older than 60)</sup>") 
                                    "</li>" ) 
                    simple_list 
                )
            )
           "</ul>"
    )    

    ; test extracting object name from the actual object
    ( console (. obj "name") )

    ( console (== "John smith" (. obj "name") ) )
    ( console (== "John Sm" (. obj "name") ) )

    (defn test_person (testObj who)
        (if
            (==  who (. testObj "name") )
            (
                (html (join "the person " (. testObj "name") " seems to be " who))
            )
            (
                (html (join "the person " (. testObj "name") " does not seem to be " who))
            )        
        )
    )

    (defn is_bigger (a b)
        (if
            ( > a  b)
            (
                (html (join a " seems to be bigger than " b))
            )
            (
                (html (join a " does not seem to be bigger than " b))
            )        
        )
    )    

    (defn is_smaller (a b)
        (if
            ( < a  b)
            (
                (html (join a " seems to be smaller than " b))
            )
            (
                (html (join a " does not seem to be smaller than " b))
            )        
        )
    )     

    (defn comparision_with_fn (a b fn)
        ( apply fn a b )
    )   

    (html "<b>Testing conditionals</b>")

    (test_person obj "John smith")
    (test_person obj "John F. smith")
    (test_person obj2 "Someone else")

    (is_bigger 200 100)
    (is_bigger 66 1222)
    (is_bigger 0.333 -2)

    (is_smaller 200 100)
    (is_smaller 66 1222)
    (is_smaller 0.333 -2)

    ; test comparision function as parameter
    (defn smaller (a b) ( < a b ))
    (if ( comparision_with_fn 10 20 smaller )
        ( html " 10 < 20 ")
    )
    ( assert ( comparision_with_fn 10 20 smaller) "10 is smaller than 20")
    ( assert (!( comparision_with_fn 100 20 smaller)) "20 not bigger than 100")

    (if ( comparision_with_fn 100 20 smaller )
        ( html " 100 < 20 ")
        ( html " NOT 100 < 20 ")
    )

    ( console
        (map 
            (lambda (x) uppercase (. x "name")  )                             
            simple_list
        )
    )

    ; define the mapping as a function
    (defn list_to_ui (mylist heading)
        (
            (html 
                "<div style='padding:10px;background-color:#47a;color:white;'>" heading "</div>"    
                "<ul>" 
                    (join 
                        (map 
                            (lambda 
                                (item) join "<li style=''>" item "</li>" ) 
                            (map 
                                (lambda (x) uppercase (. x "name")  )                             
                                mylist
                            )
                        )
                    )
                "</ul>"
            )           
        )
    )
    (list_to_ui simple_list "Lista ja sen otsikko")

    (def ((test_list (list 99 -22 20 30 40 115 180 270 ))))

    (html "map items using rotation <br/>" 
          "<div style='padding:20px;'>"
             ( join ( smap 
                            (lambda (item) join "<div style='color:blue;transform:rotate(" item "deg);display:inline-block; padding:10px;'>" item "</div>" ) 
                                test_list ))
          "</div>"
    )      

    ; map items...
    (html "map items using rotation <br/>" 
          "<div style='padding:20px;'>"
             ( join ( smap 
                            (lambda (item) join "<div style='color:blue;transform:rotate(" item "deg);display:inline-block; padding:10px;'>" item "</div>" ) 
                                -22 20 30 40 115 180 270 ))
          "</div>"
    )   

      

    (html ((lambda (a b) join "<div style='color:blue;transform:rotate(" a "deg);display:inline-block;'>" a "," b "</div>" ) -22 20 ))

    ; define multiplication function
    (defn mul (&) (* &))
    (html "result of the multiplication is " (mul 3 5 10))


    ; create a simple mapping function which adds 10 to each item
    (defn add1 (item) (+ item 10))

    ; create a mapper function which adds 10 to each item in sequence given to it
    (defn test_mapper (&) 
        (join_with 
            ( smap add1 & )  
            ", <sup>join</sup>"
        )
    )
    
    ; and try the same using lambda
    (defn test_mapper2 (&) 
        (join_with 
            ( smap (lambda (item) + item 10 ) & )  
            ", <sup>join</sup>"
        )
    ) 

    ; and try the same using lambda and reduce
    ; the point is to join with commas and to wrap the output
    (defn test_mapper3 (&) 
            (
              reduce
              (lambda (a b) join "<b style='color:blue;'>" a "," b "</b>" )
              ( smap (lambda (item) + item 10 ) & )  
            )
    ) 

    ; test mapper...
    (html (test_mapper 10 20 30))

    ; test mapper with reduce...
    (html (test_mapper3 10 20 30))

    ; test apply function and negative numbers to the mapper
    (html ( apply test_mapper -1 -2 -3 -4 -5 -6))

    ; test apply function and float numbers to the mapper
    (html ( apply test_mapper -1.4 -2.7788 -3.12 ))

    ; function which accepts function parameter
    ;  fn = ...
    ;  and rest parameter &


    ; & operand can be used to join variable argument list to sequence
    (defn joiner (&) (join "<div style='transform:rotate(10deg);width:300px;'>..." & "...</div>"))
    (defn joiner2 (&) (join "<div style='transform:rotate(-10deg);width:300px;'>..." & "...</div>"))

    (defn apply_h3 (fn &) 
        ( join "<h3>" (apply fn & ) "</h3>"))
    
    ; pass the joiner as parameter to apply_h1
    (html (apply_h3 joiner "higher " "order " (+ 6 (* 6 6)) " fn" ))
    (html (apply_h3 joiner2 "higher " "order " (+ 6 (* 6 6)) " fn" ))

    ; try mapping for each number
    (defn transform_numbers (&) 
            (
              map
              (lambda (a) join "<div style='color:blue;transform:rotate(" a "deg);display:inline-block;'>" a "</div>" )
              ( smap (lambda (item) + item 10 ) & )  
            )
    ) 
    (html (transform_numbers -40 -22 33 44 55 66))

    
    ; test_mapper adds 10 to each sequence number
    (html (apply_h3 test_mapper 10 20 30))

    ; test_mapper2 adds 10 to each sequence number
    (html (apply_h3 test_mapper2 10 20 30 40 50 60 70))

    ; anonymous version adds 10 to each sequence number
    (html (apply_h3 
                (lambda (&)
                    (join 
                        ( smap 
                            (lambda (item) + item 10 ) 
                            & 
                        )  
                    ))
                    1 2 3 4 5))    

    (def ((txt "Global variable")))
    (let ((txt "Hello local parameter"))
         (html "Testing param <b>txt</b>in a local context here it is -> " txt)
         (defn get_local () (txt))         

         (html txt)
    )    
    (html "in global context <b>txt</b> is " txt)


    ; code can now have comments...
    (defn test2 (fn &) (apply fn &))
    (html "Higher order lambda function = " (test2 (lambda (&) + &) 90 80 13 50))   
    (html "Higher order lambda function multiply = " (test2 (lambda (&) * &) 90 80 13 50))  

    (html "Higher order lambda function  string join " (test2 (lambda (&) join " [ " & " ]") 90 80 " are joined with " 13 50))    

    (html "test map: " (map (lambda (item) join "item:" item "," ) (array 90 80 13 50)))  

    (html "test map 2: " (smap (lambda (item) join "item:" item "," ) 90 80 13 50))  

    ; test with simple map
    (defn map_fn (x) 
                (join "<b>item:</b>" x ))
                (html "test map 3: " (reduce join (smap map_fn 90 80 13 50))) 

    ; using smap and reduce (smap =  sequence map)
    (html "test map 3: " 
            ; smap produces a list and parts are joined using ,
            ( join_with
              (smap map_fn 90 80 13 50 "sample value") ", "))  

    (defn join_with_comma (a b) (join a ", " b) )

    ; test with defn ()
    (html "testing joining using named function: " 
            ; smap produces a list and parts are joined using ,
            (reduce join_with_comma  
            (smap map_fn 90 80 13 50 "sample value")))      


    (html (mul 10 10))

    (defn test (fn x) (apply fn x 20))

    (html (test mul 2))

    (html "works? " (apply (lambda (&) + &) 100 300 500 1))

    (defn test_simple (fn x y) (apply fn x y))
    (html "test_simple = " (test_simple (lambda (&) + &) 90 80))

    (defn i (color &) (join "<i style='color:" color "'>" & "</i>"))

    (defn h1 (&) (join "<h1>" & "</h1>"))
    (html (h1 "Hello " (i "red" "dude")) )

    (defn h1 (&) (join "<h1>" & "</h1>"))

    

    (defun sum (&) (+ &))
    (defun ! (x) (* x -1 ))
    (defun ++ (x) (+ x 1 ))
    (defun add (x y) ( + x y ))

    (html "<div> 4 + 4 + 4 + 4 = " (sum 4 4 4 4) "</div>")

    (apply html "<div>Testing apply -> this call was result of an apply" ( apply h1 "apply seems to work" )  " </div>")

    (defun mymap (item) ( join "<b>" item "</b>" ))

    ( html "<div> fine : " (! 7) " this is the HTML element function " " adds all together </div>"  )

    ( add_to_dom "main" "<div>" (! 7) "</div>" )
    ( add_to_dom "main" "<div>" (* 7 7) "</div>" )
    ( add_to_dom "main" "<div>" (++ 7) "</div>" )

    ( add_to_dom "main" ( join "<div> reduce add array = " (reduce add (array 1 2 3 4 5)) "</div>") )
    ( html "<div> reduce add array = " (reduce add (array 1 2 3 4 5)) "</div>" )
    
    (
        add_to_dom "main" "<div>" "moro = " (add 3 4) "</div>"
    )

    ( add_to_dom "main" 
            "<div>" 
                    ( reduce add (map (lambda (item) join "<div style='padding:10px;background-color:black;color:white;margin:2px;'>" item "</div>" ) 
                                (array 1 2 3 4 5)) ) 
            "</div>" )

    ( add_to_dom "main" ( join "<div>" (map mymap (array 1 2 3 4 5)) "</div>") )

    ( add_to_dom "main" "<div> reduce with lambda and & " (reduce (lambda (&) + &) (array 1 2 3 4 5)) "</div>")
    

    ( add_to_dom "main" (concatenate "... and Lambda says " ( (lambda (x) (add x 2) ) 1 )))
    
    ( log ((lambda (x)
        x)
        "Lisp") )

    ( log "Lambda says" ( (lambda (x) (+ x 13 33)) 10 ))
    
    (let ((y 200) (zz 500)) 
        (let ((x (- y 10)))
                    ( add_to_dom "main"  (concatenate "<p>" "zz = " zz "</p>" ) )
                    ( add_to_dom "main"  (concatenate "<p>" "y = " y "</p>" ) )
                    ( add_to_dom "main"  (concatenate "<p>" "x = " x "</p>" ) )
                    ( add_to_dom "main"  (concatenate "<p>" "The result of 23 + 80 is " (+ 23 80) "</p>" ) )
                    ( add_to_dom "main"  (concatenate "<p>" "The result of _xx_ + 80 is " (+ _xx_ 80) "</p>" ) )
                    ( add_to_dom "main"  (concatenate "<p>" "The result of x + 80 is " (+ x 80) "</p>" ) )
                    ( add_to_dom "main"  (concatenate "<p>" "The result of x + zz is " (+ x zz) "</p>" ) )
                    ( add_to_dom "main"  (concatenate "<p>" "The result of 23 * 80 is " (* 23 80) "</p>" ) )
        )
        (log (add 20 30))
        (add_to_dom "main" (concatenate 
                                "<h1>" "The result of 23 + 80 using function 'add' is " (add 23 80) "</h1>" 
                                \`<div>Example of string join using lisp</div>\`    
                            ))
    ))
)
`);

ctx.__on("__lisp_cmd", function() {
    var n = ctx.__lisp_cmd.node;
    if(!n) return;

    if(n.__sp) {
        // enable / disable lite-debugging to console...
        // console.log(lisp_ast._code.substring(n.__sp, n.__ep));   
    }
    // console.log(ctx.__lisp_cmd.node);
})

run_lisp( lisp_ast , ctx ); 

/*

on idea might be to embed XML inside LISP code...

    <View>
        <Label color="white"></Label>
    </View>

then there could be new AST which id defined for XML only...

; what does the lisp expression really create ?? 
(

    <XML></XML>
)

--> might also create XML using strings
--> easy and quite compact

 ( "<div>" x "</div>" )

--> another option is to directly build the object tree...
 ( <div> (x) </div>)

 


*/
var process_ast = JMLParser(`

process {

    process ( spawn : (if (> x 10 )) ) {

    }

    //  -- could lisp create XML or could XML include lisp...

    ( def things:string "foobar" )

    ( console <div></div> )

    <View as=(if (> x 10) "main" "not main")>
        <Label color="white">
            The name is (x) or something </Label>
    </View>


}

`);

console.log(process_ast);
