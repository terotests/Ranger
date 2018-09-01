
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

class Vec2 {
  def x:double 0.0
  def y:double 0.0
  Constructor(i:double j:double) {
    x = i
    y = j
  }
}
class PathSegment {
  def t0:double 0.0
  def t1:double 0.0
  def t2:double 0.0
  def t3:double 0.0
  def t4:double 0.0
  def t5:double 0.0
}

class EVGBezierPath {
  def points:[Vec2]
  def next:EVGBezierPath
  def pointCnt:int 0
  def closed:boolean false
  def bounds:Vec2 (new Vec2 ( 0.0 0.0 ))
  def cp1:Vec2 (new Vec2 ( 0.0 0.0 ))
  def cp2:Vec2 (new Vec2 ( 0.0 0.0 ))
  def controlPoint:Vec2 (new Vec2 ( 0.0 0.0 ))

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
  def last_number:double 0 

  fn __sqr:double (v:double) {
    return (v * v)
  }

  fn __xformPoint:Vec2 (point:Vec2 seg:PathSegment) {
    def res:Vec2 (new Vec2 ( ((point.x * seg.t0) + (point.y * seg.t2) + seg.t4)
    ((point.x * seg.t1) + (point.y * seg.t3) + seg.t5) ) )
    return res
  }

  
  fn __xformVec:Vec2 (dv:Vec2 point:Vec2 seg:PathSegment) {
    return (new Vec2( ((point.x * seg.t0) + (point.y * seg.t2))
    ((point.x * seg.t1) + (point.y * seg.t3)) ) )
  }
  

  fn __vmag:double (point:Vec2) {
    return (sqrt ((point.x * point.x) + (point.y * point.y)))
  }
  fn __vecrat:double (u:Vec2 v:Vec2) {
    return (((u.x * v.x) + (u.y * v.y)) / ((this.__vmag(u)) + (this.__vmag(v))))
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
              cx = args.t0
              cy = args.t1
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
              cx2 = cx + args.t2
              cy2 = cy + args.t3
              cx  = cx + args.t4
              cy  = cy + args.t5   
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
                              args.t2  args.t3
                              args.t4  args.t5  
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
      i = i + 1
    }
  }
}

