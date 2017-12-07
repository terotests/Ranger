
Import "Engine3D.clj"

class test_3d {
  static fn main () {

    ; NOTE: init requires currently HTML having the <canvas id="renderCanvas"></canvas>
    def canvas (getMainCanvas 'renderCanvas')
    def engine (createEngine3D canvas)
    def scene (createScene engine)

    listenToResize engine

    def camera ( newCamera scene (vec 0 5 -10) 'cam1' )
    setTarget camera (vec 0 0 0)

    (newHemisphericLight scene (vec 0 1 0) 'light1')
    def s1 (newSphere scene 16.0 4.0 's')
    def s2 (newSphere scene 16.0 4.0 's')

    translate s1 (vec 2 0 0 )
    translate s2 (vec -4 0 -1 )

    setData s1 "Hello World!" ; test object data payload
  
    setMouseControl camera canvas

    def zz -10.0
    def time 0.0
    def oPos (clone (getPosition s2))

    def pickedObj:Object3D
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
      }
    }
    def loader (assetLoader scene)
    def m ( meshLoader loader 'sword' 'sword/' 'sg-sword-13.babylon')
    onReady m {
      def mat (createMaterial scene 'm1')
      def text (createTexture scene 'earth_daymap.jpg' )

      ; must flip text coords, otherwise texture upside down
      vScale text -1.0
      uScale text -1.0
      setTexture mat text
      setMaterial s1 mat
      setMaterial s2 mat

      def list ( getObjects event )
      list.forEach( {
        if( index == 0 ) {
          ; the first object in the scene file is the root object of sword...
          position item (vec -1 0 2)
          scale item (vec 0.2 0.2 0.2 )
          def second (clone item 'i2')
          position second (vec -2 0 5)
          setRotation item (quat (vec 0.0 0.0 1.0) (M_PI * -0.2) )
        } 
      })
    }
    start loader
    def rot 0.0
    def direction 1.0
    renderLoop engine {
      rot = rot + 0.01
      setRotation s1 (quat (vec 0.0 1.0 0.0) rot )
      setRotation s2 (quat (vec 0.0 1.0 0.0) (rot + (M_PI * 0.3) ) )
      if(!null? pickedObj) {
        def o (unwrap pickedObj)
        ; interpolate using catmull rom...
        position o (oPos + (catmull time (vec -1 0 0 ) (vec 0 0 0) (vec 3 1 3) (vec 4 2 5)))
      }
      time = time + 0.01 * direction
      if(time > 1.0) {
        time = 1.0
        direction = -1.0
      }
      if( time < 0.0) {
        time = 0.0
        direction = 1.0
      }
      render scene
    }
    
  }
}