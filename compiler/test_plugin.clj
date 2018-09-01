
; Import "jabba"

; http://ryanogles.by/css/javascript/2017/05/25/the-state-of-css.html
; define CSS inside the Ranger code...

; https://golden-layout.com/

; https://framework7.io/docs/app-layout.html

; https://www.muicss.com/docs/v1/example-layouts/responsive-side-menu

; http://getskeleton.com/

; view-source:http://getskeleton.com/examples/landing/

; http://cssmenumaker.com/blog/5-css-frameworks-you-should-be-using/


Import "test_plugin.css"

plugin.renderers {
    ; this would be for rendering engines...
}

; https://purecss.io/layouts/marketing/

plugin.slides @noinfix(true) {
    presentation "Testi presis" "presentation.html" {
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
            slide {
                p "These slides were created using a Ranger plugin"
                code `
plugin.slides @noinfix(true) {
    presentation "Testi presis" "presentation.html" {
        slide {
            h1 "Ranger"
            p "These slides were created using a Ranger plugin"
            p.fragment.grow "namespaces and " (i 'styles')
        }            
                `
                p.fragment.grow "namespaces and " (i 'styles')
                
            }
            slide {
                a '/operators_slides.html' 'has Operators'
            }
        }

        slide.zoom-in {
            h1 Why?
        }
        slide.zoom-in {
            h1 Sharing algorithms
        }
        slide.zoom-in {
            h3 Compile against established compilers
        }
        slide { 
                h1 'Possible?'
                table {
                    tr 'JavaScript' (b.fragment.highlight-blue 'Go') 'PHP' 
                    tr 'Scala' 'C#' 'Java'
                    tr (b.fragment.highlight-blue 'C++') 'TypeScript' (b.fragment.highlight-blue 'Swift')
                }
        }

        slide {
            slide {
                h1 "GO"
            }
            slide {
                quote `"We made a deliberate decision: no warnings. If it's worth complaining  
about, it's worth fixing."`  
                i "-" Rob Pike
            }
            slide {
                h1 "GO 2"
            }
            slide {
                h1 "GO 3"
            }
        }
        slide {
            h1 "C++"
            p @class('fragment') {
                'nice language from the last century, fast'
            }
            code `
class Test : public std::enable_shared_from_this&lt;Test&gt; {
            `
        }
        slide {
            h1 "Scala"
        }
        slide {
            h1 "GO"
        }
    }

}

plugin.apps {
    page the_frontpage {

    }
}

; html generator plugin
plugin.html @noinfix(true) {

    page "index" {        

        ; the description of a manu of one page...
        menu {
            menutitle "Ranger tests"
            p {
                button 'Send a msg'
                button 'Back'
            }
            menulist {
                menuitem #start 'Welcome, test of a very long menu item'
                menuitem #end 'OK, the end'
                submenu {
                    menuitem #end 'Whatever'
                }
            }
            menulist {
                menuitem #start 'Welcome'
                menuitem #end 'OK, the end'
                menuitem /bootstrap.html 'See how BS'
            }
        }

        h1 @id('start') "Good to have some content"
        
        a #end to end
        
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
    page "introduction" {
        h1 "Good to have some content for the introduction too"
        table {
            thead aaa jjjj eierier
            tr "a" "b" "c"
            tr (Something here) (Something here) (Something here)
        }
    }
}

plugin.graphql {
    query HeroNameAndFriends ( $episode: Episode = "JEDI" ) {
        hero(episode: $episode) {
                name
                friends {
                    name
                }
        }
    }
}

class what {

}

class pluginTester {
    static fn main () {
        print "The plugin code tester"
        inserted_class.foo()
        alert "testing alert..."
    }
}