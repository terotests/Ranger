
operators {
    has_console_colors  cmdHasColors:boolean () {
        templates {
            es6 @macro(true) ( "true" ) 
            * @macro(true) ( "false" )
        }
    }
    color_print cmdPrint:void (cname:string text:string) {
        templates {
            es6 ("console.log( require('chalk').keyword(" ( e 1 ) ")(" (e 2) "));" )
            * @macro(true) ( nl "print " (e 2) nl )
        }       
    }
}

class ColorConsole {

    fn out:void (color:string str:string ) {
        print str
    }
}