Import "JinxProcess.clj"
Import "DOMLib.clj"

class appmain {

    ; creating a process and so on..
    ; it all should be really easy...

    static fn createElement:JinxProcess ( into:HTMLElement what:HTMLElement ) {
        def newElem (clone what)
        return (process 'element'
                    (process.attr 'background' '1')
                    (process.attr 'persistent' '1')
                    (process (process.attr 'exit' 'true')
                        (task.call {
                            remove_dom newElem
                        })
                    )          
                    (task.call {
                        add into newElem
                    })
                    )
    }  

    static fn elementProcess:JinxProcess ( into:HTMLElement what:HTMLElement ) {
        def newElem (clone what)
        return (process 'element'
                    (task.wait 1.33)
                    (task.call {
                        add into newElem
                    })
                    (task.wait 1.33)        

                    ; TODO: how could exit process be "slow"
                    (process (process.attr 'exit' 'true')
                        (task.call {
                            print "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
                            print "Exit handler was called --> calling process done"
                            remove_dom newElem
                            ; process.done(ctx)
                        })          
                    )  
                    (task.wait 1.33)     
                    (task.call {
                        print "before exit..."
                        process.done(ctx)
                    })   
                    (task.wait 0.5)     
                    ; something to be called when process exits...
               )
    }

    static fn main() {
        print "Loaded..."
        ; def nn (create_element 'div')
        def elem (find_element_by_attr 'data-comp-id' 'otsikko.yleinen')
        def card1 (unwrap (find_element_by_attr 'data-comp-id' 'samplecard'))
        def playg (unwrap (find_element_by_attr 'data-comp-id' 'playground'))
        def cnt 0
        ; with react
        ; --> there is a state
        ; --> you render that state into screen
        ; --> you see the results.
        if(!null? elem) {
            def e (unwrap elem)
            def p (process 'test'
                    (process.attr 'persistent' '1')
                    (process "test" (process.attr 'background' 'true') (process.attr 'loop' 'true')
                        (task.call {
                            cnt = cnt + 1
                            text e ('seconds passed: ' + cnt)    
                            if(cnt == 6) {
                                process.done(ctx)
                            }                        
                        })
                        (task.wait 1.001)
                        ; push a new process into the existing process...                        
                        (appmain.createElement(playg card1))
                    ) 
                    (process (process.attr 'exit' 'true')
                        (task.call {
                            print "**************************************************"
                            print "the main process exits now"
                        })          
                    )
                    (task.wait 30.0)  
                )
            def ctx (new JinxProcessCtx)
            p.start(ctx)
        }
    }
}

plugin.ui @noinfix(true) {

    page "First Test" "material2" {
        h1 "Simple page"
    }

    page "First Test" "material1" {
        navbar {
            ul.right.hide-on-med-and-down {
                li (a '#' 'Menu item 1')
                li (a '#' 'Menu item 2')
                li (a '#' 'Menu item 3')
            }
        }
        div.container {
            h1@(otsikko.yleinen) "Hello World"    
            div.row.s12@(playground) {

            }
            div.row.s12 {
                div.col.s6 {
                    input.col.s6 first_name "Etunimi"
                    input.col.s6 second_name "Sukunimi"
                }
                div.co.s6 {
                    input.col.s8 first_name "Katuosoite"
                    input.col.s4 second_name "Postinro"
                }
            }
            div.row.s12@(cards.obiwan) {
                div.col.s4@(samplecard) {
                    card {
                        div.card-image {
                            img@(main.img) "https://i.imgflip.com/b62tb.jpg"
                        }
                        card-content {
                            input card_title 'Kortin otsikko'
                        }
                    }
                }
                div.col.s4 {
                    card {
                        div.card-image {
                            img@(main.img) "https://i.imgflip.com/b62tb.jpg"
                        }
                        card-content {
                            p.card-title "Hello!"
                            p "Here is some content to the card!!!"
                        }
                    }
                }
                div.col.s4 {
                    card {
                        div.card-image {
                            img@(main.img) "https://i.imgflip.com/b62tb.jpg"
                        }
                        card-content {
                            p.card-title "Hello!"
                            p "Here is some content to the card!!!"
                        }
                    }
                }
            }

            button.floating (icon menu)
            button.floating (icon edit)

            card.blue-grey {
                div.card-content {
                    p.card-title "Hello!"
                    "Here is some content to the card!!!"
                    div {
                        button.floating (icon menu)
                        button.floating (icon edit)
                    }
                }
            }

            div.chip ( "Cool!" (icon.close 'close'))

            table {
                thead "Eka" "Toka" "Kolmas"
                tr 1 2 ( (b NOTE:) 'This works OK!!!')
                tr 4 5 6 
                tr 7 8 ( (div.chip 'hoo!!') )
            }

            ul.collection {
                li.collection-item "Row 1"
                li.collection-item "Row 2"
                li.collection-item "Row 3"
            }

            div.row {
                button "OK"
                button "Fail"
            }

        }

        footer {
            div.container {
                div.row {
                    p "here some text"
                }
            }
            div.footer-copyright {
                p "(C) ACME Ltd."
            }
        }

    }
}

plugin.file 'README.md' '
# Hello World from the file plugin
'

plugin.md 'MDTEST.md' {
    ## Hello World
    table {
        tr 1 2 ( (b NOTE:) 'This works OK!!!')
        tr 4 5 6 
        tr 7 8 9 
    }
    code.javascript `
function foo() {
    
}
    `
}

plugin.md 'MDTEST2.md' @noinfix(true) {

        h1 @id('start') "Good to have some content"
        
        a 'http://www.yle.fi' 'Uuutiset'
        
        # Level 1 (i 'information') for you 
        p 'Never leave home without it'
        ## Level 2
        ### Level 3
        pre 'Some code could be here'
        
        p { 
            So each page must have introduction or perhaps even more...
            button "OK"
        }
        ul {
            li 'list item 1'
            li 'list item 2'
        }
        b '*) please notice these subleties...'
        p 'OK so here some more'
        ol {
            li 'second row with some more items'
        }
        pre '
            for list item:string i {

            }
        '
        p (button "OK")
        table {
            thead 'First items' ( (i 'Very') 'important ' things) 'the rest'
            tr 'here is one cell' 'here is second' 'AND here is the third' 
            tr (Something here) (Something here) {
                                                    'I just wanted to create a longer subsection over here now'
                                                    (p 'not because it is important though...')
                                                 }
            tr "third row" '' ''
        }
        h1 @id("end") "Good to have some content" 
        p { 
            So each page must have introduction or perhaps even more...
            button "OK"
        }
        ul {
            li 'list item 1'
            li 'list item 2'
        }
        b '*) please notice these subleties...'
        p 'OK so here some more'
        ol {
            li 'second row with some more items'
        }
        pre '
            for list item:string i {

            }
        '
        p (button "OK")

}


plugin.slides @noinfix(true) {
    presentation "Testi presis" "reveal_test.html" {
        slide {
            h1 "Ranger"
        }
        slide {
            slide {
                h1 "Supports"
                table {
                    tr 'JavaScript' 'Go' 'PHP' 
                    tr 'Scala' 'C#' 'Java'
                    tr 'C++' 'TypeScript' 'Swift'
                }
                p.fragment '+ plugins'
            }
        }
        slide {
            quote `"We made a deliberate decision: no warnings. If it's worth complaining  
about, it's worth fixing."`  
            i "-" Rob Pike
        }
    }
}