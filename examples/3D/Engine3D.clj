

systemclass Vector3 {
  es6 BABYLON.Vector3
}

systemclass Canvas3D {
  es6 HTMLElement
}

systemclass Engine3D {
  es6 BABYLON.Engine
}

systemclass Scene3D {
  es6 BABYLON.Scene
}

systemclass Camera3D {
  es6 BABYLON.FreeCamera
}
systemclass Light3D {
  es6 Object
}
systemclass Object3D {
  es6 Object
}
systemclass PickResult3D {
  es6 Object
}
systemclass CanvasClick {
  es6 Object
}
systemclass ImportResult3D {
  es6 Object
}
systemclass AssetLoader3D {
  es6 Object
}
systemclass LoadTask3D {
  es6 Object
}
systemclass LoadTaskEvent3D {
  es6 Object
}
systemclass Material3D {
  es6 Object
}
systemclass Texture3D {
  es6 Object
}
systemclass Quaternion3D {
  es6 Object
}

operators  {

  content_ready _:void ( code:block) {
    templates {
      es6 (`window.addEventListener('DOMContentLoaded', function() {` nl I (block 1) i nl `})` nl)
    }
  }

  renderLoop _:void ( en:Engine3D cb:(_:void ()) ) {
    templates {
      es6 ( (e 1) '.runRenderLoop(()=>{' nl I '(' (e 2) ') () ' i nl ' });' nl  )
    }
  }

  vec3 _:Vector3 ( x:double y:double z:double ) {
    templates {
      es6 ('new BABYLON.Vector3(' (e 1) ', ' (e 2) ',' (e 3) ')')
    }
  }

  vec3 _:Vector3 ( x:int y:int z:int ) {
    templates {
      es6 ('new BABYLON.Vector3(' (e 1) ', ' (e 2) ', ' (e 3) ')')
    }
  }

  vec _:Vector3 ( x:double y:double z:double ) {
    templates {
      es6 ('new BABYLON.Vector3(' (e 1) ', ' (e 2) ',' (e 3) ')')
    }
  }

  vec _:Vector3 ( x:int y:int z:int ) {
    templates {
      es6 ('new BABYLON.Vector3(' (e 1) ', ' (e 2) ', ' (e 3) ')')
    }
  }

  
  ; vector math ops
  
  catmull _:Vector3 ( t:double v1:Vector3 v2:Vector3 v3:Vector3 v4:Vector3 ) {
    templates {
      es6 ( 'BABYLON.Vector3.CatmullRom(' (e 2) ', ' (e 3) ', ' (e 4) ', ' (e 5) ', ' (e 1) ') ' )
    }
  }
   
  - _:Vector3 ( v1:Vector3 other:Vector3 ) {
    templates {
      es6 ( (e 1) '.subtract(' (e 2) ')')
    }
  }

  * _:Vector3 ( v1:Vector3 n:double) {
    templates {
      es6 ( (e 1) '.scale(' (e 2) ')')
    }
  }

  * _:Vector3 ( v1:Vector3 v2:Vector3) {
    templates {
      es6 ( (e 1) '.mutiply(' (e 2) ')')
    }
  }
  
  + _:Vector3 ( v1:Vector3 v2:Vector3) {
    templates {
      es6 ( (e 1) '.add(' (e 2) ')')
    }
  }

  dot _:Vector3 ( v1:Vector3 v2:Vector3) {
    templates {
      es6 ( (e 1) '.Dot(' (e 2) ')')
    }
  }

  cross _:Vector3 ( v1:Vector3 v2:Vector3) {
    templates {
      es6 ( (e 1) '.Cross(' (e 2) ')')
    }
  }

  distance _:Vector3 ( v1:Vector3 v2:Vector3) {
    templates {
      es6 ( (e 1) '.Distance(' (e 2) ')')
    }
  }
  

  == _:Vector3 ( v1:Vector3 v2:Vector3) {
    templates {
      es6 ( (e 1) '.equals(' (e 2) ')')
    }
  }

  clone _:Vector3 ( v1:Vector3 ) {
    templates {
      es6 ( (e 1) '.clone()')
    }
  }

  normalize _:Vector3 ( v1:Vector3 ) {
    templates {
      es6 ( (e 1) '.normalize()')
    }
  }
  
  

  newCamera _:Camera3D ( scene:Scene3D position:Vector3 name:string) {
    templates {
      es6 ('new BABYLON.FreeCamera(' (e 3) ', ' (e 2)', ' (e 1)')')
    }
  }

  newHemisphericLight _:Light3D ( scene:Scene3D position:Vector3 name:string) {
    templates {
      es6 ('new BABYLON.HemisphericLight(' (e 3) ', ' (e 2)', ' (e 1)')')
    }
  }

  newSphere _:Object3D ( scene:Scene3D width:double height:double name:string) {
    templates {
      es6 ('new BABYLON.Mesh.CreateSphere(' (e 4) ', ' (e 2) ', ' (e 3)', ' (e 1)')')
    }
  }

  render _:void (s:Scene3D) {
    templates {
      es6 ((e 1)'.render()')
    }
  }

  getPosition _:Vector3 (obj:Object3D) {
    templates {
      es6 ( (e 1) '.position')
    }
  }
  
  translate _:void ( obj:Object3D vector:Vector3 ) {
    templates {
      es6 ( (e 1) '.translate(' (e 2) ', 1, BABYLON.Space.WORLD ) ' )
    }
  }

  x _:double ( v:Vector3 ) {
    templates {
      es6 ( (e 1) '.x')
    }
  }

  y _:double ( v:Vector3 ) {
    templates {
      es6 ( (e 1) '.y')
    }
  }

  z _:double ( v:Vector3 ) {
    templates {
      es6 ( (e 1) '.z')
    }
  }

  parent _@(optional):Object3D (o:Object3D) {
    templates {
      es6 ( (e 1 ) '.parent')
    }
  }

  clone _:Object3D (o:Object3D name:string) {
    templates {
      es6 ( (e 1 ) '.clone(' (e 2) ')')
    }
  }

  setX _:void ( cam:Camera3D x:double) {
    templates {
      es6 ( (e 1 ) '.position.x = ' (e 2))
    }
  }

  setY _:void ( cam:Camera3D y:double) {
    templates {
      es6 ( (e 1 ) '.position.y = ' (e 2))
    }
  }
  
  setZ _:void ( cam:Camera3D z:double) {
    templates {
      es6 ( (e 1 ) '.position.z = ' (e 2))
    }
  }

  setZ _:void ( cam:Object3D z:double) {
    templates {
      es6 ( (e 1 ) '.position.z = ' (e 2))
    }
  }

  scale _:void ( o:Object3D v:Vector3) {
    templates {
      es6 ( (e 1 ) '.scaling = ' (e 2))
    }
  }

  position _:void ( o:Object3D v:Vector3) {
    templates {
      es6 ( (e 1 ) '.position = ' (e 2))
    }
  }

  ; new BABYLON.Quaternion.RotationAxis
  quat _:Quaternion3D ( v:Vector3 rotation:double) {
    templates {
      es6 ('new BABYLON.Quaternion.RotationAxis(' (e 1) ', ' (e 2) ')')
    }
  }
  
  setRotation _:void (o:Object3D q:Quaternion3D) {
    templates {
      es6 ( (e 1) '.rotationQuaternion = ' (e 2))
    }
  }

  setMaterial _:void ( o:Object3D m:Material3D) {
    templates {
      es6 ( (e 1 ) '.material  = ' (e 2))
    }
  }

  uScale _:void (m:Texture3D val:double) {
    templates {
      es6 ( (e 1) '.uScale = ' (e 2))
    }
  }

  vScale _:void (m:Texture3D val:double) {
    templates {
      es6 ( (e 1) '.vScale = ' (e 2))
    }
  }
  

  onClick _:void (c:Canvas3D cb:(_:void (ev:CanvasClick)) ) {
    templates {
      es6 ( (e 1) '.addEventListener("click", (e)=>{ (' (e 2) ')(e) } ) ' nl )
    }
  }
  getX _:double (ev:CanvasClick) {
    templates {
      es6 ( (e 1) '.clientX')
    }
  }
  getY _:double (ev:CanvasClick) {
    templates {
      es6 ( (e 1) '.clientY')
    }
  }
  setData _:void (o:Object3D data:Any) {
    templates {
      es6 ( (e 1) '.data = ' (e 2))
    }
  }
  getData _@(optional):Any (o:Object3D) {
    templates {
      es6 ( (e 1) '.data')
    }
  }
  getPointerX _:double ( s:Scene3D) {
    templates {
      es6 ( (e 1) '.pointerX')
    }
  }
  getPointerY _:double ( s:Scene3D) {
    templates {
      es6 ( (e 1) '.pointerY')
    }
  }
  pick _:PickResult3D (s:Scene3D x:double y:double) {
    templates {
      es6 ( (e 1) '.pick(' (e 2) ', ' (e 3) ')')
    }
  }
  hitPoint _@(optional):Vector3 ( p:PickResult3D ) {
    templates {
      es6 ( (e 1) '.pickedPoint')
    }
  }
  hitObject _@(optional):Object3D ( p:PickResult3D ) {
    templates {
      es6 ( (e 1) '.pickedMesh')
    }
  }

  setTarget _:void ( cam:Camera3D position:Vector3) {
    templates {
      es6 ((e 1) '.setTarget(' (e 2)')')
    }
  }

  setMouseControl _:void ( cam:Camera3D canv:Canvas3D ) {
    templates {
      es6 ((e 1) '.attachControl(' (e 2)', false)')
    }
  }

  getMainCanvas _:Canvas3D ( canvasID:string ) {
    templates {
      es6 (`document.getElementById(` (e 1) `)`)
    }
  }
  createEngine3D _:Engine3D (c:Canvas3D) {
    templates {
      es6 ('new BABYLON.Engine(' (e 1) ', true)')
    }
  }
  createScene _:Scene3D (c:Engine3D) {
    templates {
      es6 ('new BABYLON.Scene(' (e 1) ')')
    }
  }

  getObjects _:[Object3D] (r:ImportResult3D) {
    templates {
      es6 ('_newMeshes')
    }
  }

  assetLoader _:AssetLoader3D (scene:Scene3D) {
    templates {
      es6 ('new BABYLON.AssetsManager(' (e 1) ')')
    }
  }

  meshLoader _:LoadTask3D (loader:AssetLoader3D name:string url:string objName:string) {
    templates {
      es6 ( (e 1) '.addMeshTask(' (e 2)', "", '(e 3)', ' (e 4) ')')
    }
  }
  onReady _:void (task:LoadTask3D cb:(_:void ( event:LoadTaskEvent3D ))) {
    templates {
      es6 ( (e 1) '.onSuccess = (_task)=> {' nl I '(' (e 2) ')(_task)' nl I '}' nl )
    }
  }
  getObjects _:[Object3D] ( ev:LoadTaskEvent3D) {
    templates {
      es6 ( (e 1) '.loadedMeshes')
    }
  }

  textureLoader _:LoadTask3D (loader:AssetLoader3D name:string url:string ) {
    templates {
      es6 ( (e 1) '.addTextureTask(' (e 2)',  '(e 3)')')
    }
  }

  createMaterial _:Material3D (scene:Scene3D name:string) {
    templates {
      es6 ('new BABYLON.StandardMaterial(' (e 2) ', ' (e 1) ')')
    }
  }
  createTexture _:Texture3D (scene:Scene3D imageName:string ) {
    templates {
      es6 ('new BABYLON.Texture(' (e 2) ', ' (e 1) ')')
    }
  }
  setTexture _:void (m:Material3D text:Texture3D) {
    templates {
      es6 ( (e 1) '.diffuseTexture = ' (e 2))
    }
  }

  start _:AssetLoader3D (loader:AssetLoader3D) {
    templates {
      es6 ( (e 1) '.load()')
    }
  }

  listenToResize _:void (c:Engine3D) {
    templates {
      es6 (`
window.addEventListener('resize', function() {
    ` (e 1)`.resize();
})      
      ` nl)
    }
  }
}