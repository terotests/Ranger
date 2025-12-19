
Import "Vec2.clj"

class PathExecutor {
  fn Move:void( x:double y:double) {
    print "Move called with " + x + ", " + y
  }
  fn Line:void( x:double y:double) {
    print "Line called with " + x + ", " + y
  }  
  fn Curve:void( x0:double y0:double x1:double y1:double x2:double y2:double) {
    print "Cubic bezier curve called with " + x0 + ", " + y0 + " "+ x1 + ", " + y1 + " "+ x2 + ", " + y2 + " "
  }    
}

class PathCollector {
  Extends(PathExecutor)
  def pathParts:[string]
  fn Move:void( x:double y:double) {
    push pathParts "M " + x + " " + y +" "
  }
  fn Line:void( x:double y:double) {
    push pathParts "L " + x + " " + y +" "
  }  
  fn Curve:void( x0:double y0:double x1:double y1:double x2:double y2:double) {
    push pathParts "C " + x0 + " " + y0 +" "+ x1 + " " + y1 +" "+ x2 + " " + y2 +" "
  }      
  fn getString:string () {
    return (join pathParts " ")
  }
}

class PathSegment {
  def t0:double 0.0
  def t1:double 0.0
  def t2:double 0.0
  def t3:double 0.0
  def t4:double 0.0
  def t5:double 0.0
  def t6:double 0.0
}

class EVGBezierPath {
  def points:[Vec2]
  def next:EVGBezierPath
  def pointCnt:int 0
  def closed:boolean false
  def bounds:Vec2 (Vec2.CreateNew ( 0.0 0.0 ))
  def cp1:Vec2 (Vec2.CreateNew ( 0.0 0.0 ))
  def cp2:Vec2 (Vec2.CreateNew ( 0.0 0.0 ))
  def controlPoint:Vec2 (Vec2.CreateNew ( 0.0 0.0 ))

  fn close:void () {
    closed = true
  }
  fn Line:void (point:Vec2) {
  }
  fn moveTo:void (point:Vec2) {
    controlPoint.x = point.x
    controlPoint.y = point.y
  }
}

class EVGPathParser {
  
  def i:int 0
  def len:int 0
  def buff:charbuffer
  def last_number:double 0.0 

  fn __sqr:double (v:double) {
    return (v * v)
  }
  fn __xformPoint:Vec2 (point:Vec2 seg:PathSegment) {
    def res:Vec2 (Vec2.CreateNew ( ((point.x * seg.t0) + (point.y * seg.t2) + seg.t4)
    ((point.x * seg.t1) + (point.y * seg.t3) + seg.t5) ) )
    return res
  }
  fn __xformVec:Vec2 (point:Vec2 seg:PathSegment) {
    return (Vec2.CreateNew ( ((point.x * seg.t0) + (point.y * seg.t2))
    ((point.x * seg.t1) + (point.y * seg.t3)) ) )
  }
  fn __vmag:double (point:Vec2) {
    return (sqrt ((point.x * point.x) + (point.y * point.y)))
  }
  fn __vecrat:double (u:Vec2 v:Vec2) {
    return (((u.x * v.x) + (u.y * v.y)) / ((this.__vmag(u)) * (this.__vmag(v))))
  }
  fn __vecang:double (u:Vec2 v:Vec2) {
    def r:double (this.__vecrat(u v))
    if (r < -1.0) {
      r = -1.0
    }
    if (r > 1.0) {
      r = 1.0
    }
    def res:double 1.0
    if ((u.x * v.y) < (u.y * v.x)) {
      res = -1.0
    } 
    return (res * (acos r))
  }

  fn scanNumber:boolean () {
    def s:charbuffer (unwrap this.buff)
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
  }

  fn pathArcTo:Vec2 ( callback:PathExecutor cp:Vec2 args:PathSegment rel:boolean ) {    
    def rx 0.0
    def ry 0.0
    def rotx 0.0
    def x1 0.0
    def y1 0.0
    def x2 0.0
    def y2 0.0
    def cx 0.0
    def cy 0.0
    def dx 0.0
    def dy 0.0
    def d 0.0
    def x1p 0.0
    def y1p 0.0
    def cxp 0.0
    def cyp 0.0
    def s 0.0
    def sa 0.0
    def sb 0.0
    def ux 0.0
    def uy 0.0
    def vx 0.0
    def vy 0.0
    def a1 0.0
    def da 0.0
    def x 0.0
    def y 0.0
    def tanx 0.0
    def tany 0.0
    def a 0.0
    def px 0.0
    def py 0.0
    def ptanx 0.0
    def ptany 0.0
    def t (new PathSegment())
    def sinrx 0.0
    def cosrx 0.0
    def fa 0.0
    def fs 0.0
    def i 0
    def ndivs 0
    def hda 0.0
    def kappa 0.0
    def PI_VALUE (M_PI)
    def cpx cp.x
    def cpy cp.y
    rx = ( fabs args.t0)
    ry = ( fabs args.t1)
    rotx = args.t2 / 180.00 * PI_VALUE
    fa = (? ( (fabs args.t3) > 0.00001 ) 1.0 0.0 )
    fs = (? ( (fabs args.t4) > 0.00001 ) 1.0 0.0 )
    x1 = cpx
    y1 = cpy
    if rel {
      x2 = cpx + args.t5
      y2 = cpy + args.t6
    } {
      x2 = args.t5
      y2 = args.t6
    }    
    dx = x1 - x2
    dy = y1 - y2
    d = (sqrt ((dx*dx) + (dy*dy)))
    if( (d < 0.00001 ) || (rx < 0.00001) || (ry < 0.00001) ) {
      callback.Line( x2 y2 )
      return (Vec2.CreateNew (x2 y2))
    }
    sinrx = (sin rotx)
    cosrx = (cos rotx)
    x1p = ( cosrx * dx  ) / 2.0 + ( sinrx * dy / 2.0 )
    y1p = ( -1.0 * sinrx * dx ) / 2.0 + ( cosrx * dy / 2.0 )
    d = (x1p*x1p) / (rx*rx) + (y1p*y1p) / (ry*ry)
    if ( d > 1.0 ) {
      d = (sqrt d)
      rx = rx * d
      ry = ry * d
    }
    s = 0.0
    sa = (rx*rx)*(ry*ry) - (rx*rx)*(y1p*y1p) - (ry*ry)*(x1p*x1p)
    sb = (rx*rx)*(y1p*y1p) + (ry*ry)*(x1p*x1p)
    if( sa < 0.0 ) {
      sa = 0.0
    }
    if( sb > 0.0 ) {
      s = (sqrt (sa / sb))
    }
    if ( fa == fs ) {
      s = -1.0 * s
    }    
    
    cxp = s * rx * y1p / ry
    cyp = s * (-1.0 * ry) * x1p / rx
    cx = (x1 + x2) / 2.0 + (cosrx * cxp - sinrx * cyp)
    cy = (y1 + y2) / 2.0 + (sinrx * cxp + cosrx * cyp)

    def u (Vec2.CreateNew ( ( ( x1p - cxp ) / rx) ( ( y1p - cyp ) / ry) ) )
    def v (Vec2.CreateNew ( ( ( -1.0*x1p - cxp ) / rx ) ( ( -1.0*y1p - cyp ) / ry ) ))
    def unitV (Vec2.CreateNew (1.0 0.0 ))
    a1 = (this.__vecang( unitV u ))
    da = (this.__vecang( u v))
    if( (fs == 0.0) && (da > 0.0) ) {
        da = da - 2.0 * PI_VALUE
    } {
      if( ( fs == 1.0) && (da < 0.0)) {
        da = 2.0 * PI_VALUE + da
      }
    }
    t.t0 = cosrx
    t.t1 = sinrx
    t.t2 = -1.0 * sinrx
    t.t3 = cosrx
    t.t4 = cx
    t.t5 = cy

    ndivs = (to_int (  ( (fabs da) / (PI_VALUE * 0.5) ) + 1.0 ) )
    hda = ( da / (to_double ndivs)) / 2.0
    kappa = (fabs ( 4.0 / 3.0 * (1.0 - (cos hda) ) / (sin hda) ) )
    if (da < 0.0) {
      kappa = -1.0 * kappa
    }
    i = 0
    while ( i <= ndivs ) {
      a = a1 + (da * (to_double i) / (to_double ndivs))
      dx = (cos a)
      dy = (sin a)
      def trans (this.__xformPoint ( (Vec2.CreateNew ( (dx*rx) (dy*ry) )) t ))
      x = trans.x
      y = trans.y
      def v_trans (this.__xformVec ( (Vec2.CreateNew ( (-1.0 * dy*rx *kappa) (dx*ry*kappa) )) t ))
      tanx = v_trans.x
      tany = v_trans.y
      if( i > 0 ) {
        callback.Curve(
          (px + ptanx) (py + ptany)
          (x - tanx) ( y - tany )
          x y
        )
      }
      px = x
      py = y
      ptanx = tanx
      ptany = tany
      i = i + 1
    }

    def rv (Vec2.CreateNew (x2 y2))
    return rv
  }

  fn parsePath:void (path:string callback:PathExecutor) {

    i = 0
    this.buff = (to_charbuffer path)
    def s:charbuffer (unwrap this.buff)
    len = (length s)

    def buff:charbuffer (to_charbuffer path)
    def cmd:char (ccode "L")
    def path:EVGBezierPath (new EVGBezierPath ())

    def args:PathSegment (new PathSegment())
    def require_args:int 2
    def arg_cnt:int 0

    def QPx:PathSegment (new PathSegment())
    def QPy:PathSegment (new PathSegment())
    def CPx:PathSegment (new PathSegment())
    def CPy:PathSegment (new PathSegment())

    def cx:double 0.0
    def cy:double 0.0
    def cx2:double 0.0
    def cy2:double 0.0

    ; callback.Move( cx cy )

    def last_i:int -1

    while ( i < len ) {
      if(last_i == i) {
        i = i + 1
      }
      last_i = i
      def c:char (charAt s i)

      if( (c == (ccode "V"))  || (c == (ccode "v")) || (c == (ccode "H")) || (c == (ccode "h")) )  {
        cmd = c
        require_args = 1
        arg_cnt = 0
        continue
      }      
      if( (c == (ccode "m")) || (c == (ccode "M")) || (c == (ccode "L"))  || (c == (ccode "l")) || (c == (ccode "t")) || (c == (ccode "T")) )  {
        cmd = c
        require_args = 2
        arg_cnt = 0
        continue
      }
      if( (c == (ccode "q")) || (c == (ccode "Q")) || (c == (ccode "S"))  || (c == (ccode "s"))  )  {
        cmd = c
        require_args = 4
        arg_cnt = 0
        continue
      } 
      if( (c == (ccode "c")) || (c == (ccode "C")) )  {
        cmd = c
        require_args = 6
        arg_cnt = 0
        continue
      }   
      if( (c == (ccode "a")) || (c == (ccode "A")) )  {
        cmd = c
        require_args = 7
        arg_cnt = 0
        continue
      }             
      if(this.scanNumber()) {
        switch arg_cnt {
          case 0 { args.t0 = last_number }
          case 1 { args.t1 = last_number }
          case 2 { args.t2 = last_number }
          case 3 { args.t3 = last_number }
          case 4 { args.t4 = last_number }
          case 5 { args.t5 = last_number }
          case 6 { args.t6 = last_number }
          default {
            
          }
        }
        arg_cnt = arg_cnt + 1
        if ( arg_cnt >= require_args ) {
          switch cmd {
            case (ccode "m") {
              callback.Move( (cx + args.t0) (cy + args.t1) )
              cx = args.t0
              cy = args.t1
              cmd = (ccode "L")
              require_args = 2
              cx2 = cx
              cy2 = cy
            }
            case (ccode "M") {
              callback.Move( args.t0 args.t1 )
              cx = args.t0
              cy = args.t1
              cmd = (ccode "L")
              require_args = 2
              cx2 = cx
              cy2 = cy              
            }
            case (ccode "l") {
              callback.Line( (cx + args.t0) (cy + args.t1) )
              cx = cx + args.t0
              cy = cy + args.t1
              cx2 = cx
              cy2 = cy              
            }
            case (ccode "L") {
              callback.Line( args.t0 args.t1 )
              cx = args.t0
              cy = args.t1
              cx2 = cx
              cy2 = cy              
            }
            case (ccode "h") {
              callback.Line( (cx + args.t0) cy )
              cx = cx + args.t0
              cx2 = cx         
            }
            case (ccode "H") {
              callback.Line( args.t0 cy )
              cx = args.t0
              cx2 = cx         
            }
            case (ccode "v") {
              callback.Line( cx (cy + args.t0) )
              cy = cy + args.t0
              cy2 = cy         
            }
            case (ccode "V") {
              callback.Line( cx args.t0 )
              cy = args.t0
              cy2 = cy       
            }    
            case (ccode "c") {
              callback.Curve( (cx + args.t0) (cy + args.t1) 
                              (cx + args.t2) (cy + args.t3)
                              (cx + args.t4) (cy + args.t5)  
                             )
              cx2 = cx + args.t2
              cy2 = cy + args.t3
              cx  = cx + args.t4
              cy  = cy + args.t5   
            }             
            case (ccode "C") {
              callback.Curve( args.t0  args.t1 
                              args.t2  args.t3
                              args.t4  args.t5  
                             )
              cx2 = args.t2
              cy2 = args.t3
              cx  = args.t4
              cy  = args.t5   
            }
            case (ccode "s") {
              callback.Curve( (cx + cx - cx2) (cy + cy - cy2) 
                              (cx + args.t0) (cy + args.t1)
                              (cx + args.t2) (cy + args.t3)  
                             )
              cx2 = cx + args.t0
              cy2 = cy + args.t1
              cx  = cx + args.t2
              cy  = cy + args.t3   
            }             
            case (ccode "S") {
              callback.Curve( (cx + cx - cx2) (cy + cy - cy2) 
                              args.t0  args.t1
                              args.t2  args.t3  
                             )
              cx2 = args.t0
              cy2 = args.t1
              cx  = args.t2
              cy  = args.t3   
            }             
            case (ccode "q") {
              QPx.t0 = cx
              QPy.t0 = cy
              QPx.t1 = cx + args.t0
              QPy.t1 = cy + args.t1
              QPx.t2 = cx + args.t2
              QPy.t2 = cy + args.t3
              CPx.t0 = QPx.t0
              CPy.t0 = QPy.t0
              CPx.t1 = QPx.t0 + ( 2.0 / 3.0 ) * ( QPx.t1 - QPx.t0 )
              CPy.t1 = QPy.t0 + ( 2.0 / 3.0 ) * ( QPy.t1 - QPy.t0 )            
              CPx.t2 = QPx.t2 + ( 2.0 / 3.0 ) * ( QPx.t1 - QPx.t2 )
              CPy.t2 = QPy.t2 + ( 2.0 / 3.0 ) * ( QPy.t1 - QPy.t2 )
              CPx.t3 = QPx.t2 
              CPy.t3 = QPy.t2                  
              callback.Curve( CPx.t1 CPy.t1
                              CPx.t2 CPy.t2
                              CPx.t3 CPy.t3
                             )
              cx2 = CPx.t2 
              cy2 = CPy.t2 
              cx  = CPx.t3
              cy  = CPy.t3 
            }
            case (ccode "Q") {
              QPx.t0 = cx
              QPy.t0 = cy
              QPx.t1 = args.t0
              QPy.t1 = args.t1
              QPx.t2 = args.t2
              QPy.t2 = args.t3
              CPx.t0 = QPx.t0
              CPy.t0 = QPy.t0
              CPx.t1 = QPx.t0 + ( 2.0 / 3.0 ) * ( QPx.t1 - QPx.t0 )
              CPy.t1 = QPy.t0 + ( 2.0 / 3.0 ) * ( QPy.t1 - QPy.t0 )            
              CPx.t2 = QPx.t2 + ( 2.0 / 3.0 ) * ( QPx.t1 - QPx.t2 )
              CPy.t2 = QPy.t2 + ( 2.0 / 3.0 ) * ( QPy.t1 - QPy.t2 )
              CPx.t3 = QPx.t2 
              CPy.t3 = QPy.t2                  
              callback.Curve( CPx.t1 CPy.t1
                              CPx.t2 CPy.t2
                              CPx.t3 CPy.t3
                             )
              cx2 = CPx.t1 
              cy2 = CPy.t1 
              cx  = CPx.t2
              cy  = CPy.t3 
            }      
            case (ccode "T") {
              QPx.t0 = cx
              QPy.t0 = cy
              QPx.t1 = 2.0*cx - cx2
              QPy.t1 = 2.0*cy - cy2
              QPx.t2 = args.t0
              QPy.t2 = args.t1
              CPx.t0 = QPx.t0
              CPy.t0 = QPy.t0
              CPx.t1 = QPx.t0 + ( 2.0 / 3.0 ) * ( QPx.t1 - QPx.t0 )
              CPy.t1 = QPy.t0 + ( 2.0 / 3.0 ) * ( QPy.t1 - QPy.t0 )            

              ; TODO: is this correct here ?? it was stored to index 3
              CPx.t2 = QPx.t2 
              CPy.t2 = QPy.t2                  
              callback.Curve( CPx.t0 CPy.t0
                              CPx.t1 CPy.t1
                              CPx.t2 CPy.t2
                             )
              cx2 = CPx.t1 
              cy2 = CPy.t1 
              cx  = CPx.t2
              cy  = CPy.t3 
            }   
            case (ccode "t") {
              QPx.t0 = cx
              QPy.t0 = cy
              QPx.t1 = 2.0*cx - cx2
              QPy.t1 = 2.0*cy - cy2
              QPx.t2 = cx + args.t0
              QPy.t2 = cy + args.t1
              CPx.t0 = QPx.t0
              CPy.t0 = QPy.t0
              CPx.t1 = QPx.t0 + ( 2.0 / 3.0 ) * ( QPx.t1 - QPx.t0 )
              CPy.t1 = QPy.t0 + ( 2.0 / 3.0 ) * ( QPy.t1 - QPy.t0 )            

              ; TODO: is this correct here ?? it was stored to index 3
              CPx.t2 = QPx.t2 
              CPy.t2 = QPy.t2                  
              callback.Curve( CPx.t0 CPy.t0
                              CPx.t1 CPy.t1
                              CPx.t2 CPy.t2
                             )
              cx2 = CPx.t1 
              cy2 = CPy.t1 
              cx  = CPx.t2
              cy  = CPy.t3 
            }
            case (ccode "a") {
              def res (this.pathArcTo(callback (Vec2.CreateNew (cx cy)) args true ))
              cx = res.x
              cy = res.y
              cx2 = cx
              cy2 = cy
            }
            case (ccode "A") {
              def res (this.pathArcTo(callback (Vec2.CreateNew (cx cy)) args false ))
              cx = res.x
              cy = res.y
              cx2 = cx
              cy2 = cy
            }
            default {
              if (arg_cnt >= 2) {
                cx = args.t0
                cy = args.t1
                cx2 = cx
                cy2 = cy
              }
            }                           
          }
          ; if arg cnt was matched reset args
          arg_cnt = 0
        }
      }      
    }
  }
  sfn m@(main) () {
    def path1 "M130 110 C 120 140, 180 140, 170 110"
    def path2 "M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80"
    def path3 "M10 80 Q 95 10 180 80"
    def path4 "M10 80 Q 52.5 10, 95 80 T 180 80"
    def path5 "M-130 -110 C 120 140, 180 140, 170 110"
    def path6 "M10 315
           L 110 215
           A 30 50 0 0 1 162.55 162.45
           L 172.55 152.45
           A 30 50 -45 0 1 215.1 109.9
           L 315 10"   

    def path7 "M 14.781 14.347 h 1.738 c 0.24 0 0.436 -0.194 0.436 -0.435 v -1.739 c 0 -0.239 -0.195 -0.435 -0.436 -0.435 h -1.738 c -0.239 0 -0.435 0.195 -0.435 0.435 v 1.739 C 14.347 14.152 14.542 14.347 14.781 14.347 M 18.693 3.045 H 1.307 c -0.48 0 -0.869 0.39 -0.869 0.869 v 12.17 c 0 0.479 0.389 0.869 0.869 0.869 h 17.387 c 0.479 0 0.869 -0.39 0.869 -0.869 V 3.915 C 19.562 3.435 19.173 3.045 18.693 3.045 M 18.693 16.085 H 1.307 V 9.13 h 17.387 V 16.085 Z M 18.693 5.653 H 1.307 V 3.915 h 17.387 V 5.653 Z M 3.48 12.608 h 7.824 c 0.24 0 0.435 -0.195 0.435 -0.436 c 0 -0.239 -0.194 -0.435 -0.435 -0.435 H 3.48 c -0.24 0 -0.435 0.195 -0.435 0.435 C 3.045 12.413 3.24 12.608 3.48 12.608 M 3.48 14.347 h 6.085 c 0.24 0 0.435 -0.194 0.435 -0.435 s -0.195 -0.435 -0.435 -0.435 H 3.48 c -0.24 0 -0.435 0.194 -0.435 0.435 S 3.24 14.347 3.48 14.347"
    def path8 "M 4.423 9.141 H 3.565 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.192 0.429 -0.429 S 4.66 9.141 4.423 9.141 M 6.997 16.861 H 6.139 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.191 0.429 -0.429 S 7.234 16.861 6.997 16.861 M 4.423 16.861 H 3.565 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.191 0.429 -0.429 S 4.66 16.861 4.423 16.861 M 13.861 9.998 h 0.857 c 0.236 0 0.429 -0.192 0.429 -0.429 s -0.192 -0.429 -0.429 -0.429 h -0.857 c -0.237 0 -0.43 0.192 -0.43 0.429 S 13.624 9.998 13.861 9.998 M 14.719 16.861 h -0.857 c -0.237 0 -0.43 0.192 -0.43 0.43 s 0.192 0.429 0.43 0.429 h 0.857 c 0.236 0 0.429 -0.191 0.429 -0.429 S 14.955 16.861 14.719 16.861 M 15.576 13.001 c -0.236 0 -0.429 0.192 -0.429 0.43 c 0 0.236 0.192 0.429 0.429 0.429 c 0.237 0 0.43 -0.192 0.43 -0.429 C 16.006 13.193 15.813 13.001 15.576 13.001 M 6.997 9.141 H 6.139 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.192 0.429 -0.429 S 7.234 9.141 6.997 9.141 M 12.145 9.141 h -0.857 c -0.236 0 -0.429 0.192 -0.429 0.429 s 0.193 0.429 0.429 0.429 h 0.857 c 0.237 0 0.43 -0.192 0.43 -0.429 S 12.382 9.141 12.145 9.141 M 17.722 10.856 V 7.424 c 0 -0.948 -0.769 -1.716 -1.716 -1.716 h -0.617 l -1.038 -3.873 c -0.245 -0.916 -1.186 -1.458 -2.101 -1.213 L 3.592 2.912 C 2.676 3.157 2.133 4.098 2.378 5.014 l 0.186 0.695 H 2.278 c -0.947 0 -1.716 0.768 -1.716 1.716 V 17.72 c 0 0.947 0.769 1.716 1.716 1.716 h 13.728 c 0.947 0 1.716 -0.769 1.716 -1.716 v -1.716 c 0.947 0 1.716 -0.769 1.716 -1.716 v -1.716 C 19.438 11.624 18.669 10.856 17.722 10.856 M 16.006 6.566 c 0.473 0 0.857 0.384 0.857 0.858 v 0.238 c -0.253 -0.146 -0.544 -0.238 -0.857 -0.238 h -0.157 l -0.229 -0.858 H 16.006 Z M 14.41 5.372 l 0.55 2.053 H 6.67 L 14.41 5.372 Z M 3.814 3.741 l 8.657 -2.29 c 0.458 -0.123 0.928 0.149 1.051 0.607 l 0.222 0.828 L 3.43 5.621 l -0.223 -0.83 C 3.084 4.333 3.356 3.863 3.814 3.741 M 1.42 7.424 c 0 -0.474 0.384 -0.858 0.858 -0.858 h 0.517 l 0.229 0.858 H 2.278 c -0.314 0 -0.605 0.091 -0.858 0.238 V 7.424 Z M 16.863 17.72 c 0 0.474 -0.385 0.858 -0.857 0.858 H 2.278 c -0.474 0 -0.858 -0.385 -0.858 -0.858 V 9.141 c 0 -0.474 0.384 -0.858 0.858 -0.858 h 13.728 c 0.473 0 0.857 0.384 0.857 0.858 v 1.715 h -1.716 c -0.947 0 -1.716 0.768 -1.716 1.716 v 1.716 c 0 0.947 0.769 1.716 1.716 1.716 h 1.716 V 17.72 Z M 18.58 14.288 c 0 0.474 -0.385 0.857 -0.858 0.857 h -2.574 c -0.474 0 -0.857 -0.384 -0.857 -0.857 v -1.716 c 0 -0.474 0.384 -0.858 0.857 -0.858 h 2.574 c 0.474 0 0.858 0.385 0.858 0.858 V 14.288 Z M 9.571 16.861 H 8.713 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.236 0 0.429 -0.191 0.429 -0.429 S 9.808 16.861 9.571 16.861 M 12.145 16.861 h -0.857 c -0.236 0 -0.429 0.192 -0.429 0.43 s 0.193 0.429 0.429 0.429 h 0.857 c 0.237 0 0.43 -0.191 0.43 -0.429 S 12.382 16.861 12.145 16.861 M 9.571 9.141 H 8.713 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 C 9.808 9.998 10 9.806 10 9.569 S 9.808 9.141 9.571 9.141"
    def path9 "M 4.423 9.141 H 3.565 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.192 0.429 -0.429 S 4.66 9.141 4.423 9.141 M 6.997 16.861 H 6.139 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.191 0.429 -0.429 S 7.234 16.861 6.997 16.861 M 4.423 16.861 H 3.565 c -0.237 0 -0.429 0.192 -0.429 0.43 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.191 0.429 -0.429 S 4.66 16.861 4.423 16.861 M 13.861 9.998 h 0.857 c 0.236 0 0.429 -0.192 0.429 -0.429 s -0.192 -0.429 -0.429 -0.429 h -0.857 c -0.237 0 -0.43 0.192 -0.43 0.429 S 13.624 9.998 13.861 9.998 M 14.719 16.861 h -0.857 c -0.237 0 -0.43 0.192 -0.43 0.43 s 0.192 0.429 0.43 0.429 h 0.857 c 0.236 0 0.429 -0.191 0.429 -0.429 S 14.955 16.861 14.719 16.861 M 15.576 13.001 c -0.236 0 -0.429 0.192 -0.429 0.43 c 0 0.236 0.192 0.429 0.429 0.429 c 0.237 0 0.43 -0.192 0.43 -0.429 C 16.006 13.193 15.813 13.001 15.576 13.001 M 6.997 9.141 H 6.139 c -0.237 0 -0.429 0.192 -0.429 0.429 s 0.192 0.429 0.429 0.429 h 0.858 c 0.237 0 0.429 -0.192 0.429 -0.429 S 7.234 9.141 6.997 9.141 M 12.145 9.141 h -0.857 c -0.236 0 -0.429 0.192 -0.429 0.429 s 0.193 0.429 0.429 0.429 h 0.857 c 0.237 0 0.43 -0.192 0.43 -0.429 S 12.382 9.141 12.145 9.141 M 17.722 10.856 V 7.424 c 0 -0.948 -0.769 -1.716 -1.716 -1.716 h -0.617 l -1.038 -3.873 -3 -4"
    def path10 "M 16.853 8.355 V 5.888 c 0 -3.015 -2.467 -5.482 -5.482 -5.482 H 8.629 c -3.015 0 -5.482 2.467 -5.482 5.482 v 2.467 l -2.741 7.127 c 0 1.371 4.295 4.112 9.594 4.112 s 9.594 -2.741 9.594 -4.112 L 16.853 8.355 Z M 5.888 17.367 c -0.284 0 -0.514 -0.23 -0.514 -0.514 c 0 -0.284 0.23 -0.514 0.514 -0.514 c 0.284 0 0.514 0.23 0.514 0.514 C 6.402 17.137 6.173 17.367 5.888 17.367 Z M 5.203 10 c 0 -0.377 0.19 -0.928 0.423 -1.225 c 0 0 0.651 -0.831 1.976 -0.831 c 0.672 0 1.141 0.309 1.141 0.309 C 9.057 8.46 9.315 8.938 9.315 9.315 v 1.028 c 0 0.188 -0.308 0.343 -0.685 0.343 H 5.888 C 5.511 10.685 5.203 10.377 5.203 10 Z M 7.944 16.853 H 7.259 v -1.371 l 0.685 -0.685 V 16.853 Z M 9.657 16.853 H 8.629 v -2.741 h 1.028 V 16.853 Z M 8.972 13.426 v -1.028 c 0 -0.568 0.46 -1.028 1.028 -1.028 c 0.568 0 1.028 0.46 1.028 1.028 v 1.028 H 8.972 Z M 11.371 16.853 h -1.028 v -2.741 h 1.028 V 16.853 Z M 12.741 16.853 h -0.685 v -2.056 l 0.685 0.685 V 16.853 Z M 14.112 17.367 c -0.284 0 -0.514 -0.23 -0.514 -0.514 c 0 -0.284 0.23 -0.514 0.514 -0.514 c 0.284 0 0.514 0.23 0.514 0.514 C 14.626 17.137 14.396 17.367 14.112 17.367 Z M 14.112 10.685 h -2.741 c -0.377 0 -0.685 -0.154 -0.685 -0.343 V 9.315 c 0 -0.377 0.258 -0.855 0.572 -1.062 c 0 0 0.469 -0.309 1.141 -0.309 c 1.325 0 1.976 0.831 1.976 0.831 c 0.232 0.297 0.423 0.848 0.423 1.225 S 14.489 10.685 14.112 10.685 Z M 18.347 15.801 c -0.041 0.016 -0.083 0.023 -0.124 0.023 c -0.137 0 -0.267 -0.083 -0.319 -0.218 l -2.492 -6.401 c -0.659 -1.647 -1.474 -2.289 -2.905 -2.289 c -0.95 0 -1.746 0.589 -1.754 0.595 c -0.422 0.317 -1.084 0.316 -1.507 0 C 9.239 7.505 8.435 6.916 7.492 6.916 c -1.431 0 -2.246 0.642 -2.906 2.292 l -2.491 6.398 c -0.069 0.176 -0.268 0.264 -0.443 0.195 c -0.176 -0.068 -0.264 -0.267 -0.195 -0.444 l 2.492 -6.401 c 0.765 -1.911 1.824 -2.726 3.543 -2.726 c 1.176 0 2.125 0.702 2.165 0.731 c 0.179 0.135 0.506 0.135 0.685 0 c 0.04 -0.029 0.99 -0.731 2.165 -0.731 c 1.719 0 2.779 0.814 3.542 2.723 l 2.493 6.404 C 18.611 15.534 18.524 15.733 18.347 15.801 Z"
    def path11 "M10,6.536c-2.263,0-4.099,1.836-4.099,4.098S7.737,14.732,10,14.732s4.099-1.836,4.099-4.098S12.263,6.536,10,6.536M10,13.871c-1.784,0-3.235-1.453-3.235-3.237S8.216,7.399,10,7.399c1.784,0,3.235,1.452,3.235,3.235S11.784,13.871,10,13.871M17.118,5.672l-3.237,0.014L12.52,3.697c-0.082-0.105-0.209-0.168-0.343-0.168H7.824c-0.134,0-0.261,0.062-0.343,0.168L6.12,5.686H2.882c-0.951,0-1.726,0.748-1.726,1.699v7.362c0,0.951,0.774,1.725,1.726,1.725h14.236c0.951,0,1.726-0.773,1.726-1.725V7.195C18.844,6.244,18.069,5.672,17.118,5.672 M17.98,14.746c0,0.477-0.386,0.861-0.862,0.861H2.882c-0.477,0-0.863-0.385-0.863-0.861V7.384c0-0.477,0.386-0.85,0.863-0.85l3.451,0.014c0.134,0,0.261-0.062,0.343-0.168l1.361-1.989h3.926l1.361,1.989c0.082,0.105,0.209,0.168,0.343,0.168l3.451-0.014c0.477,0,0.862,0.184,0.862,0.661V14.746z"
    def ex (new PathExecutor)
    def parser (new EVGPathParser)
    parser.parsePath(path1 ex)
    parser.parsePath(path2 ex)
    parser.parsePath(path3 ex)
    parser.parsePath(path4 ex)
    parser.parsePath(path5 ex)
    parser.parsePath(path6 ex)
    def coll (new PathCollector)
    parser.parsePath(path6 coll)
    print (coll.getString())

    def coll (new PathCollector)
    parser.parsePath(path7 coll)
    print (coll.getString())
    print " -----  "
    def coll (new PathCollector)
    parser.parsePath(path8 coll)
    print (coll.getString())
    print " -----  "
    def coll (new PathCollector)
    parser.parsePath(path9 coll)
    print (coll.getString())
    print " -----  "
    def coll (new PathCollector)
    parser.parsePath(path10 coll)
    print (coll.getString())
  }
}

