Import "EVGColorContext.clj"

class EVGColor {

    def is_set:boolean true
    def r:double 0.0
    def g:double 0.0
    def b:double 0.0
    def a:double 1.0

    sfn m@(main):void () {
        def c (new EVGColor)
        c.testFn()
    }

    fn testFn:void () {
        def colors (new EVGColor)
        def c (EVGColor.hslToRgb( 195.0 100.0 50.0))
        print "RGB of 30 20 10 = " + c.r + "," + c.g + "," + c.b

        def c (new EVGColor)
        c.fromString("hsl(  195 100.20 50)") 
        print "parsed value = (" + (c.red()) + ", " + (c.green()) + ", " + (c.blue()) + " )"
        c.fromString("hsl( 43 100 56)") 
        print "parsed value = (" + (c.red()) + ", " + (c.green()) + ", " + (c.blue()) + " )"
        c.fromString("rgb( 43 100 56)") 
        print "parsed value = (" + (c.red()) + ", " + (c.green()) + ", " + (c.blue()) + " )"
        c.fromString("rgba( 43 100 56 0.4)") 
        print "parsed value = (" + (c.red()) + ", " + (c.green()) + ", " + (c.blue()) + " " + (c.alpha()) + " )"

        def ctx (new EVGColorContext)
        def redCol (ctx.byName("red"))
        print "Red color is " + (redCol.toCSSString())
        def blueCol (ctx.byName("blue"))
        print "Blue color is " + (blueCol.toCSSString())
    }

    sfn noColor:EVGColor () {
        def c (new EVGColor)
        c.is_set = false
        return c
    }

    fn  toCSSString:string () {
        if (is_set == false) {
            return "none"
        }
        if( a < 1.0) {
            return ("rgba(" + (this.red()) + "," + (this.green()) + "," + (this.blue()) + ", " + (this.alpha()) + ")" )
        }
        return ("rgb(" + (this.red()) + "," + (this.green()) + "," + (this.blue()) + ")" )
    }

    fn  alpha:double () {
        if( a < 0.0 ) {
            return 0.0
        }
        if ( a > 1.0 ) {
            return 1.0
        }
        return a
    }
    fn  red:int () {
        if(r > 255.00) {
            return 255
        }
        if(r < 0.0) {
            return 0
        }
        return (to_int r)
    }
    fn  green:int () {
        if(g > 255.00) {
            return 255
        }
        if(g < 0.0) {
            return 0
        }
        return (to_int g)
    }
    fn  blue:int () {
        if(b > 255.00) {
            return 255
        }
        if(b < 0.0) {
            return 0
        }
        return (to_int b)
    }

    sfn hue2rgb:double ( p:double q:double tt:double) {
        def t tt
        if(t < 0.0) {
            t = t + 1.0
        }
        if(t > 1.0) {
            t = t - 1.0
        }
        if(t < (1.0/6.0)) {
            return ( p + (q - p ) * 6.0 * t)
        }
        if(t < (1.0/2.0)) {
            return q
        }
        if(t < (2.0/3.0)) {
            return ( p + (q - p ) * (2.0 / 3.0  - t) * 6.0)
        }
        return p
    }
    sfn hslToRgb:EVGColor (hh:double ss:double ll:double) {
        def r 0.0
        def g 0.0
        def b 0.0

        def h (hh / 360.0)
        def s (ss / 100.0)
        def l (ll / 100.0)
        if( s == 0.0) {
            r = l
            g = r
            b = r
        } {
            def q  (? ( l < 0.5 ) l (l + s - l * s))
            def p  ( 2.0 * l - q)
            r = (EVGColor.hue2rgb( p q (h + 1.0/3.0)))
            g = (EVGColor.hue2rgb( p q h))
            b = (EVGColor.hue2rgb( p q (h - 1.0/3.0)))
        }
        def rv (new EVGColor )
        rv.r = r * 255.00
        rv.g = g * 255.00
        rv.b = b * 255.00
        return rv
    }

    fn copyFrom (col:EVGColor) {
        r = col.r
        g = col.g
        b = col.b
        a = col.a
        is_set = col.is_set
    }

    fn fromString:void ( str:string ) {
        
        def buff:charbuffer (to_charbuffer str)
        def i:int 0
        def last_number:double 0.0
        def len (length buff)

        def skipSpace (fn:void () {
            while(i < len) {
                def c (charAt buff i)
                if( ( c <= 32) || ( c == (ccode ",")) )  {
                    i = i + 1
                } {
                    break
                }
            }
        })
        def scanNumber (fn:boolean () {
            def s:charbuffer buff
            def fc:char (charAt s i)
            def c:char fc
            def sp:int 0
            def ep:int 0
            fc = (charAt s i)
            if (((fc == 45) && (((charAt s (i + 1))) >= 46) && (((charAt s (i + 1))) <= 57)) || ((fc >= 48) && (fc <= 57))) {
                sp = i
                i = 1 + i
                c = (charAt s i)
                while ((i < len) && (((c >= 48) && (c <= 57)) || (c == ((ccode "."))) || ((i == sp) && ((c == ((ccode "+"))) || (c == ((ccode "-"))))))) {
                    i = 1 + i
                    if (i >= len) {
                    break
                    }
                    c = (charAt s i)
                }
                ep = i
                last_number = (unwrap (str2double ((substring s sp ep))))
                return true
            }
            return false    
        })
        if(len > 4) {
            if( ((ccode "r" ) == (charAt buff 0)) &&
                ((ccode "g" ) == (charAt buff 1)) &&
                ((ccode "b" ) == (charAt buff 2)) &&
                ((ccode "a" ) == (charAt buff 3)) &&
                ((ccode "(" ) == (charAt buff 4)) ) {
                    i = i + 5
                    skipSpace()
                    def h:double 0.0
                    def s:double 0.0
                    def l:double 0.0
                    def a_lpha 0.0
                    def cnt 0
                    if( scanNumber () ) {
                        h = last_number
                        cnt = cnt + 1
                    }
                    skipSpace()
                    if( scanNumber () ) {
                        s = last_number
                        cnt = cnt + 1
                    }
                    skipSpace()
                    if( scanNumber () ) {
                        l = last_number
                        cnt = cnt + 1
                    }
                    skipSpace()
                    if( scanNumber () ) {
                        a_lpha = last_number
                        cnt = cnt + 1
                    }
                    if ( cnt == 4 ) {
                        r = h
                        g = s
                        b = l
                        a = a_lpha
                        is_set = true
                        return 
                    }
                }
            if( ((ccode "r" ) == (charAt buff 0)) &&
                ((ccode "g" ) == (charAt buff 1)) &&
                ((ccode "b" ) == (charAt buff 2)) &&
                ((ccode "(" ) == (charAt buff 3)) ) {
                    i = i + 4
                    skipSpace()
                    def h:double 0.0
                    def s:double 0.0
                    def l:double 0.0
                    def cnt 0
                    if( scanNumber () ) {
                        h = last_number
                        cnt = cnt + 1
                    }
                    skipSpace()
                    if( scanNumber () ) {
                        s = last_number
                        cnt = cnt + 1
                    }
                    skipSpace()
                    if( scanNumber () ) {
                        l = last_number
                        cnt = cnt + 1
                    }
                    if ( cnt == 3 ) {
                        r = h
                        g = s
                        b = l
                        a = 1.0
                        is_set = true
                        return 
                    }
                }
            
            if( ((ccode "h" ) == (charAt buff 0)) &&
                ((ccode "s" ) == (charAt buff 1)) &&
                ((ccode "l" ) == (charAt buff 2)) &&
                ((ccode "(" ) == (charAt buff 3)) ) {
                    i = i + 4
                    skipSpace()
                    def h:double 0.0
                    def s:double 0.0
                    def l:double 0.0
                    def cnt 0
                    if( scanNumber () ) {
                        h = last_number
                        cnt = cnt + 1
                    }
                    skipSpace()
                    if( scanNumber () ) {
                        s = last_number
                        cnt = cnt + 1
                    }
                    skipSpace()
                    if( scanNumber () ) {
                        l = last_number
                        cnt = cnt + 1
                    }
                    if ( cnt == 3 ) {
                        def rr ( EVGColor.hslToRgb( h s l) )
                        this.copyFrom( rr )
                        is_set = true
                        return
                    }
                }
        }
    }
}

class EVGColorStop {
    def is_set false
    def is_linear true
    def x 0.0
    def y 0.0
    def percentage 0.0
    def color:EVGColor (new EVGColor)
}

class EVGGradientColor {
    def is_set false
    def is_linear false
    def degree 0.0
    def stops:[EVGColorStop]
}

