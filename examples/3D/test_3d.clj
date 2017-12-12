
Import "Timers.clj"
Import "Engine3D.clj"

class ObjMeta {
  def name ""
  def physics:PhysicsObject3D
}

operator type:void es6 {
  fn log (item:Quaternion3D) ('console.log(' (e 1)')')
}

class test_3d {

  static fn main () {

    ; NOTE: init requires currently HTML having the <canvas id="renderCanvas"></canvas>
    def canvas (getMainCanvas 'renderCanvas')
    def engine (createEngine3D canvas)
    def scene (createScene engine)

    listenToResize engine

    def camera ( newCamera scene (vec 0 11 -25) 'cam1' )
    setTarget camera (vec 0 0 0)

    def loader (assetLoader scene)
    def m ( textureLoader loader 'board' 'https://i.imgur.com/ghjDCqQ.png')
    onReady m {

      newHemisphericLight scene (vec 0 1 0) 'light1'
      newDirectionalLight scene (vec -1 -1 -1) 'light2'
      def s1 (newSphere scene 16.0 1.0 's')
      def s2 (newSphere scene 16.0 1.0 's')
      def hl_layer ( highlight scene 'hl1')

      def dice (box scene 1.5 1.5 1.5 ([] 
          (vec 0.0 0.0 0.33 0.5)
          (vec 0.33 0.0 0.66 0.5)
          (vec 0.66 0.0 1.00 0.5)
          (vec 0.0 0.5 0.33 1.0)
          (vec 0.33 0.5 0.66 1.0)
          (vec 0.66 0.5 1.00 1.0)
        ) 'b')

      translate dice (vec -4 5 4)
      setRotation dice (quat (vec -1.0 1.0 0.0) (M_PI * 0.6) ) 
      def dData (new ObjMeta)
      setData dice dData
      dData.name = 'dice'

      def points ([] (vec 0 -2 0) (vec 0 1 0))
      def myTube (tube scene points {
        if(i == 0 ) {
          return 1.0
        }
        return 0.2
      })
      def head (newSphere scene 16.0 1.5 'head')
      translate head (vec 0 1 0)

      def merkit:[Object3D]
      def nappula (merge ([] myTube head) )
      translate nappula (vec 6 0 4)
      def groundObj (box scene 30.0 0.5 30.0 'board')
      translate groundObj (vec -1 -1 -1)
      setData groundObj (new ObjMeta)
      setData s1 (new ObjMeta)
      setData s2 (new ObjMeta)

      def hlMaterial (createMaterial scene 'red')
      setDiffuse hlMaterial (color 1.0 0.3 0.4)
      setSpecular hlMaterial (color 0.8 0.2 1.0)
      setEmissive hlMaterial (color 0.8 0.2 0.2)
      setAlpha hlMaterial 0.5
  ;     setMaterial highligh hlMaterial

      def orangeMaterial (createMaterial scene 'red')
      setDiffuse orangeMaterial (color 1.0 1.0 0.4)
  ;    setSpecular orangeMaterial (color 0.3 0.1 1.0)

      def text2 (createTexture scene 'bump_normal.png')
      

      def redMaterial (createMaterial scene 'red')
      setDiffuse redMaterial (color 1.0 0.3 0.4)
      setSpecular redMaterial (color 0.8 0.2 1.0)
      setEmissive redMaterial (color 0.8 0.2 0.2)
      setMaterial dice redMaterial

      setMaterial nappula redMaterial
      scale nappula (vec 0.3 0.3 0.3)
      def n2 (clone nappula '')
      translate n2 (vec 1 0 -7 )
      def n3 (clone nappula '')
      translate n3 (vec -4 0 3 )

      def groundMaterial (createMaterial scene 'ground')
      setDiffuse groundMaterial (color 0.2 0.3 0.4)
      setSpecular groundMaterial (color 1.0 1.0 1.0)
      def text (grassTexture scene  (color 0.2 0.8. 0.2) (color 0.2 0.5. 0.2) 1024 )
      vScale text -1.0
      uScale text -1.0
      setTexture groundMaterial text    

      def cardMaterial (createMaterial scene 'cardmat')
      setDiffuse cardMaterial (color 0.2 0.3 0.4)
      setSpecular cardMaterial (color 1.0 0.3 0.6)
      def text (createTexture scene 'https://i.imgur.com/ghjDCqQ.png' )
      vScale text -1.0
      uScale text -1.0
      setTexture cardMaterial text

      def fancyMaterial (createMaterial scene 'ground')
      setDiffuse fancyMaterial (color 0.80 0.41 0.28)
      setSpecular fancyMaterial (color 1.0 1.0 1.0)

      setMaterial s1 fancyMaterial
      setMaterial s2 fancyMaterial

      def diceMaterial (createMaterial scene 'dicemat')
      ; setDiffuse diceMaterial (color 0.2 0.3 0.4)
      setSpecular diceMaterial (color 1.0 0.3 0.6)
      def text (createTexture scene 'https://i.imgur.com/ghjDCqQ.png' )
      vScale text -1.0
      uScale text -1.0
      setTexture diceMaterial text
      setMaterial dice diceMaterial

      translate s1 (vec 2 0 0 )
      translate s2 (vec -4 0 -1 )

      setMouseControl camera canvas

      def zz -10.0
      def time 0.0
      def oPos (clone (getPosition s2))

      def pickedObj:Object3D
      def diceThrow false
      def diceStabileCnt 0

      onClick canvas {
        print "Pointer : " + (getPointerX scene) + " , " + (getPointerY scene)
        def pickRes (pick scene (getPointerX scene) (getPointerY scene))
        def point (hitPoint pickRes)
        if(!null? point) {
          def p (unwrap point)
          print "--> point was : "  + (x p) 
          pickedObj = (unwrap (hitObject pickRes))
          def obj (unwrap pickedObj)
          while( (!null? (parent obj))) {
            obj = (unwrap (parent obj))
          }
          pickedObj = obj
          oPos = (clone (getPosition obj))
          time = 0.0
          def d (getData (unwrap pickedObj))
          if(!null? d) {
            case (unwrap d) str:string {
              print str
            }
          }
          def meta (getData obj)
          if(!null? meta) {
            case (unwrap meta) data:ObjMeta {
              if(!null? data.physics) {
                if( obj == dice ) {
                  diceThrow = true
                  diceStabileCnt = 10
                }
                impulse (unwrap data.physics) (vec 0 10 0) p
              }
            } 
          }
        }
      }
        

      enablePhysics scene

      def opt1 (physicsOptions)
      mass opt1 0.0
      restitution opt1 0.2

      def opt2 (physicsOptions)
      mass opt2 1.0
      restitution opt2 0.7
      friction opt2 0.3

      def opt3 (physicsOptions)
      mass opt3 0.8
      restitution opt3 0.1
      friction opt3 0.4

      def initGrounds (fn:void (o:Object3D) {
        setPhysics o ( physics scene o (physicsBox) opt1 )
        setMaterial o groundMaterial
      })
      initGrounds( groundObj )

      def applyPhysics (fn:void (obj:Object3D opt:PhysicsOptions3D type:PhysicsShape3D) {
        def p ( physics scene obj type opt )
        setPhysics obj p
        def meta (getData obj)
        if(null? meta) {
          meta = (new ObjMeta)
          setData obj (unwrap meta)
        }
        if(!null? meta) {
          case (unwrap meta) data:ObjMeta {
            data.physics = p
          }
        }
      })

      applyPhysics( s1 opt2 (physicsSphere))
      applyPhysics( s2 opt2 (physicsSphere))
      applyPhysics( dice opt2 (physicsBox))

      applyPhysics( nappula opt2 (physicsBox))
      applyPhysics( n2 opt2 (physicsBox))
      applyPhysics( n3 opt2 (physicsBox))

      def all_chips:[Object3D]
      def luo_merkki (fn:void (x:double y:double z:double size:double) {
        def merkki (tube scene ([] (vec 0.0 -0.1 0.0) (vec 0.0 0.1 0.0) ) {
          return size * 1.0
        })
        translate merkki (vec x y z)
        applyPhysics( merkki opt2 (physicsBox))
        setMaterial merkki orangeMaterial 
        push all_chips merkki
      })

      luo_merkki( 3.0 3.0 3.0 1.0)
      luo_merkki( 3.0 3.3 3.0 1.0)
      luo_merkki( 3.0 3.6 3.0 1.0)

      luo_merkki( -3.0 3.0 3.0 1.0)
      luo_merkki( -3.0 3.3 3.0 1.0)
      luo_merkki( -3.0 3.6 3.0 1.0)

      def create_card (fn:void (x:double y:double z:double) {
        def card (box scene 3.0 0.1 5.0 'card')      
        translate card (vec x z y)
        setData card (new ObjMeta)
        applyPhysics( card opt3 (physicsBox))
        setMaterial card cardMaterial
        setRotation card (quat (vec 1.0 1.0 1.0) (0.5 * (sin z)) )
      })

      def create_chips (fn:void (n:int) {
        def cnt n
        while( cnt > 0 ) {
          def new_c (fn:void (cnt:int)  {
            setTimeout {
              luo_merkki( 3.0 10.0 ( 3.0 + (0.1 * (to_double cnt) ) ) 1.0)
            } 100*cnt )
          })     
          new_c(cnt)
          cnt = cnt - 1
        }        
      })

      
      def cnt 10
      while( cnt > 0 ) {
        def new_card (fn:void (cnt:int)  {
          setTimeout {
            def rn (sin (to_double cnt ) * 0.1)
            def x ( -4.3 + (to_double cnt ) * 0.3 )
            def y ( -4.3 + rn )
            create_card( x -6.3 11.0 + rn)
            create_card( x -6.3 11.0 + rn)
          } 100*cnt )
        })     
        new_card(cnt)
        cnt = cnt - 1
      }

      def rot 0.0
      def direction 1.0
      
      def last_i 0.0
      def last_j 0.0
      def last_k 0.0

      def highlightCnt 0

      renderLoop engine {
        time = time + 0.01 * direction
        if( diceStabileCnt > 0 ) {
          def WM (getWorldMatrix dice)
          def i (cell WM 0 1)
          def j (cell WM 1 1)
          def k (cell WM 2 1)          
          if( (near i last_i 0.01) && (near j last_j 0.01) && (near k last_k 0.01) ) {
            diceStabileCnt = diceStabileCnt - 1
          } 
          last_i = i
          last_j = j
          last_k = k

          
          if( diceStabileCnt == 0 ) {
            ; nopan heiton suuruuden määritys...
            def diffAmount 0.3
            if diceThrow {
              def getDiceValue (fn:int () {
                if( (near 1.0 i diffAmount) && (near 0.0 j diffAmount) && (near 0.0 k diffAmount)) {
                  return 1
                }
                if( (near 0.0 i diffAmount) && (near 1.0 j diffAmount) && (near 0.0 k diffAmount)) {
                  return 5
                }
                if( (near 0.0 i diffAmount) && (near 0.0 j diffAmount) && (near 1.0 k diffAmount)) {
                  return 3
                }
                if( (near -1.0 i diffAmount) && (near 0.0 j diffAmount) && (near 0.0 k diffAmount)) {
                  return 6
                }
                if( (near 0.0 i diffAmount) && (near -1.0 j diffAmount) && (near 0.0 k diffAmount)) {
                  return 4
                }
                if( (near 0.0 i diffAmount) && (near 0.0 j diffAmount) && (near -1.0 k diffAmount)) {
                  return 2
                }
                return 0
              })
              def value (getDiceValue())
              if( value > 0 &&  value < 6 ) {
                create_chips( value )
                switch value {
                  case 1 {
                    add hl_layer dice (color 0.0 0.80 0.0)
                  }
                  case 2 {
                    add hl_layer dice (color 0.4 0.80 0.0)
                  }
                  case 3 {
                    add hl_layer dice (color 0.4 0.40 0.9)
                  }
                  case 4 {
                    add hl_layer dice (color 0.9 0.40 0.9)
                  }
                  case 5 {
                    add hl_layer dice (color 0.9 0.90 0.4)
                  }
                }
                highlightCnt = 50
              } 
              if( value == 6) {
                add hl_layer dice (color 1.0 0.0 0.0)
                highlightCnt = 100
                forEach all_chips {
                  def meta (getData item)
                  if(!null? meta) {
                    case (unwrap meta) data:ObjMeta {
                      if(!null? data.physics) {
                        impulse (unwrap data.physics) (vec 0 30 0) ( (getAbsolutePosition item) + (vec 0.1 0.1 0.1))   
                      }
                    }
                  }                                                    
                }
                
              }
              diceThrow = false
            }
          } 

        }        
        if( highlightCnt > 0 ) {
          highlightCnt = highlightCnt - 1
          if( highlightCnt == 0) {
            remove hl_layer dice            
          }
        }
        render scene
      }
    }
    start loader
  }
}