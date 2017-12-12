

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
systemclass PhysicsObject3D {
  es6 Object
}
systemclass PhysicsShape3D {
  es6 Object
}
systemclass PhysicsOptions3D {
  es6 Object
}
systemclass HighlightLayer3D {

}
systemclass Vector4 {
  es6 BABYLON.Vector4
}
systemclass FaceUV {
  es6 BABYLON.Vector4
}
systemclass Matrix3D {
  es6 BABYLON.Matrix
}


systemunion AnyLight3D (Light3D HemisphericLight3D)

operators  {

  ; generic math ops

  near _:boolean (value:double compareTo:double delta:double) {
    templates {
      * @macro(true) ( '( (fabs ( ' (e 1) ' - ' (e 2) ') ) < ' (e 3) ' ) ' )
    }
  }


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

  vec _:Vector4 ( x:double y:double z:double w:double ) {
    templates {
      es6 ('new BABYLON.Vector4(' (e 1) ', ' (e 2) ',' (e 3) ',' (e 4) ')')
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

  ; color 
  color _:Color3 ( r:double g:double b:double ) {
    templates {
      es6 ('new BABYLON.Color3(' (e 1) ', ' (e 2) ', ' (e 3) ')')
    }
  }

  ; setting color
  setDiffuse _:void (o:Material3D color:Color3 ) {
    templates {
      es6 ( (e 1) '.diffuseColor = ' (e 2))
    }
  }
  setSpecular _:void (o:Material3D color:Color3 ) {
    templates {
      es6 ( (e 1) '.specularColor  = ' (e 2))
    }
  }
  setEmissive _:void (o:Material3D color:Color3 ) {
    templates {
      es6 ( (e 1) '.emissiveColor   = ' (e 2))
    }
  }
  setAmbitent _:void (o:Material3D color:Color3 ) {
    templates {
      es6 ( (e 1) '.ambientColor  = ' (e 2))
    }
  }

  setAlpha _:void (o:Material3D alpha:double) {
    templates {
      es6 ( (e 1) '.alpha = ' (e 2))
    }
  }

  setAlpha _:void (o:Texture3D alpha:bolean) {
    templates {
      es6 ( (e 1) '.hasAlpha = ' (e 2))
    }
  }

  ; Interesting ideas:
  ; https://doc.babylonjs.com/how_to/ribbon_tutorial
  ; https://doc.babylonjs.com/how_to/render_scene_on_a_png
  ; physics engine rules...
  ; https://doc.babylonjs.com/how_to/using_the_physics_engine

  enablePhysics _:void (scene:Scene3D) {
    templates {
      es6 ( (e 1) '.enablePhysics()')
    }
  }

  physicsOptions _:PhysicsOptions3D () {
    templates {
      es6 ('{}')
    }
  }
  mass _:void (o:PhysicsOptions3D value:double) {
    templates {
      es6 ( (e 1) '.mass = ' (e 2))
    }
  }
  friction _:void (o:PhysicsOptions3D value:double) {
    templates {
      es6 ( (e 1) '.friction = ' (e 2))
    }
  }
  restitution _:void (o:PhysicsOptions3D value:double) {
    templates {
      es6 ( (e 1) '.restitution = ' (e 2))
    }
  }

  physicsBox _:PhysicsShape3D () {
    templates {
      es6 ('BABYLON.PhysicsImpostor.BoxImpostor')
    }
  }
  physicsSphere _:PhysicsShape3D () {
    templates {
      es6 ('BABYLON.PhysicsImpostor.SphereImpostor')
    }
  }
  physicsPlane _:PhysicsShape3D () {
    templates {
      es6 ('BABYLON.PhysicsImpostor.PlaneImpostor')
    }
  }
  physicsMesh _:PhysicsShape3D () {
    templates {
      es6 ('BABYLON.PhysicsImpostor.MeshImpostor')
    }
  }
  physicsCylinder _:PhysicsShape3D () {
    templates {
      es6 ('BABYLON.PhysicsImpostor.CylinderImpostor')
    }
  }

  physics _:PhysicsObject3D (scene:Scene3D obj:Object3D shape:PhysicsShape3D options:PhysicsOptions3D ) {
    templates {
      es6 ( 'new BABYLON.PhysicsImpostor(' (e 2) ', '( e 3) ', ' (e 4) ', ' (e 1) ')')
    }
  }

  setPhysics _:void (obj:Object3D shape:PhysicsObject3D) {
    templates {
      es6 ( (e 1) '.physicsImpostor = ' (e 2))
    }
  }

  ; impostor.applyImpulse(new BABYLON.Vector3(10, 10, 0), sphere.getAbsolutePosition());
  impulse _:void (o:PhysicsObject3D forceVector:Vector3 forcePosition:Vector3) {
    templates {
      es6 ( (e 1) '.applyImpulse(' (e 2) ', ' (e 3) ' ) ' )
    }
  }

  ; lights

  newSpotLight _:Light3D (scene:Scene3D start:Vector3 end:Vector3 angle:double distance:double name:string) {
    templates {
      es6 ('new BABYLON.SpotLight(' (e 6) ',' (e 2) ',' (e 3) ',' (e 4) ',' (e 5) ',' (e 1) ')')
    }
  }
  newDirectionalLight _:Light3D (scene:Scene3D direction:Vector3  name:string) {
    templates {
      es6 ('new BABYLON.DirectionalLight(' (e 3) ',' (e 2) ',' (e 1) ')')
    }
  }

  setDiffuse _:void (o:Light3D color:Color3 ) {
    templates {
      es6 ( (e 1) '.diffuse = ' (e 2))
    }
  }
  setSpecular _:void (o:Light3D color:Color3 ) {
    templates {
      es6 ( (e 1) '.specular  = ' (e 2))
    }
  }
  setGround _:void (o:HemisphericLight3D color:Color3 ) {
    templates {
      es6 ( (e 1) '.groundColor  = ' (e 2))
    }
  }

  intensity _:void (l:Light3D amount:double) {
    templates {
      es6 ( (e 1) '.intensity = ' (e 2))
    }
  }

  range _:void (l:Light3D range:double) {
    templates {
      es6 ( (e 1) '.range = ' (e 2))
    }
  }

  enableFor _void ( l:Light3D list:[Object3D]) {
    templates {
      es6 ( (e 1) '.excludedMeshes = ' (e 2))
    }
  }
  disableFor _void ( l:Light3D list:[Object3D]) {
    templates {
      es6 ( (e 1) '.includedOnlyMeshes = ' (e 2))
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
  
  ; Matrix operators
  toArray _:[double] ( o:Matrix3D ) {
    templates {
      es6 ( (e 1) '.toArray()')
    }
  }

  invert _:Matrix3D ( o:Matrix3D ) {
    templates {
      es6 ( (e 1) '.invert()')
    }
  }
  
  add _:Matrix3D ( o:Matrix3D other:Matrix3D ) {
    templates {
      es6 ( (e 1) '.add(' (e 2) ')')
    }
  }

  + _:Matrix3D ( o:Matrix3D other:Matrix3D ) {
    templates {
      es6 ( (e 1) '.add(' (e 2) ')')
    }
  }

  setTranslate _:Matrix3D ( o:Matrix3D v:Vector3 ) {
    templates {
      es6 ( (e 1) '.setTranslation(' (e 2) ')')
    }
  }

  getTranslate _:Vector3 ( o:Matrix3D ) {
    templates {
      es6 ( (e 1) '.getTranslation()')
    }
  }

  resetRotateAndScale _:Matrix3D ( o:Matrix3D ) {
    templates {
      es6 ( (e 1) '.removeRotationAndScaling()')
    }
  }

  * _:Matrix3D ( o:Matrix3D other:Matrix3D ) {
    templates {
      es6 ( (e 1) '.mutiply(' (e 2) ')')
    }
  }

  copyFrom _:Matrix3D ( o:Matrix3D other:Matrix3D ) {
    templates {
      es6 ( (e 1) '.copyFrom(' (e 2) ')')
    }
  }
  
  == _:Matrix3D ( o:Matrix3D other:Matrix3D ) {
    templates {
      es6 ( (e 1) '.equals(' (e 2) ')')
    }
  }

  clone _:Matrix3D ( o:Matrix3D ) {
    templates {
      es6 ( (e 1) '.clone()')
    }
  }

  identity_matrix _:Matrix3D (  ) {
    templates {
      es6 ( 'BABYLON.Matrix.Identity()')
    }
  }
  

  getRow _:Vector4 ( o:Matrix3D index:int ) {
    templates {
      es6 ( (e 1) '.getRow(' (e 2) ')')
    }
  }

  cell _:double (o:Matrix3D row:int col:int) {
    templates {
      es6 ( (e 1) '.m[' (e 2) ' * 4 + ' (e 3) ']')
    }
  }
  



  

  newCamera _:Camera3D ( scene:Scene3D position:Vector3 name:string) {
    templates {
      es6 ('new BABYLON.FreeCamera(' (e 3) ', ' (e 2)', ' (e 1)')')
    }
  }

  newHemisphericLight _:HemisphericLight3D ( scene:Scene3D position:Vector3 name:string) {
    templates {
      es6 ('new BABYLON.HemisphericLight(' (e 3) ', ' (e 2)', ' (e 1)')')
    }
  }

  ; standard object types

  newSphere _:Object3D ( scene:Scene3D width:double height:double name:string) {
    templates {
      es6 ('new BABYLON.Mesh.CreateSphere(' (e 4) ', ' (e 2) ', ' (e 3)', ' (e 1)')')
    }
  }

  tube _:Object3D ( scene:Scene3D path:[Vector3] radiusFn:(_:double (i:int distance:double)) ) {
    templates {
      es6 ('BABYLON.MeshBuilder.CreateTube("tube", {path: ' (e 2)', radiusFunction:'(e 3)', cap:BABYLON.Mesh.CAP_ALL}, ' (e 1) ')')
    }
  }

  box _:Object3D ( scene:Scene3D size:double name:string) {
    templates {
      es6 ('BABYLON.Mesh.CreateBox(' (e 3)', ' (e 2) ', ' (e 1) ')')
    }
  }

  box _:Object3D ( scene:Scene3D width:double height:double depth:double name:string) {
    templates {
      es6 ('BABYLON.MeshBuilder.CreateBox(' (e 5)', {width:' (e 2) ', height:' (e 3) ', depth:'(e 4)'}, ' (e 1) ')')
    }
  }

  box _:Object3D ( scene:Scene3D  width:double height:double depth:double faces:[Vector4] name:string) {
    templates {
      es6 ('BABYLON.MeshBuilder.CreateBox(' (e 6)', {width:' (e 2) ', height:' (e 3) ', depth:'(e 4)', faceUV:'(e 5)'}, ' (e 1) ')')
    }
  }

  merge _:Object3D ( meshes:[Object3D]) {
    templates {
      es6 ( 'BABYLON.Mesh.MergeMeshes(' (e 1) ')')
    }
  }


  render _:void (s:Scene3D) {
    templates {
      es6 ((e 1)'.render()')
    }
  }

  ; object routines

  getQuat _:Quaternion3D (o:Object3D) {
    templates {
      es6 ( (e 1 ) '.rotation.toQuaternion()')
    }
  }

  wireframe _:void (o:Object3D is:boolean) {
    templates {
      es6 ( (e 1) '.wireframe = ' (e 2))
    }
  }

  getAbsolutePosition _:Vector3 (obj:Object3D) {
    templates {
      es6 ( (e 1) '.getAbsolutePosition()')
    }
  }

  setPosition _:void (obj:Object3D v:Vector3) {
    templates {
      es6 ( (e 1) '.position = ' (e 2))
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

  getWorldMatrix _:Matrix3D ( o:Object3D ) {
    templates {
      es6 ( (e 1) '.getWorldMatrix()')
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
      es6 ('new BABYLON.Engine(' (e 1) ', true, {stencil: true})')
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
  ; new BABYLON.WoodProceduralTexture("texture", 1024, scene);
  grassTexture _:Texture3D (scene:Scene3D grassColor:Color3 groundColor:Color3 size:int) {
    templates {
      es6 ('( (c,g)=>{ var t = new BABYLON.GrassProceduralTexture( "grass" , ' (e 4) ', ' (e 1) ');t.grassColor = c; t.groundColor=g; return t;})(' (e 2) ', ' (e 3) ')') 
    }
  }

  woodTexture _:Texture3D (scene:Scene3D grassColor:Color3 scale:int size:int) {
    templates {
      es6 ('( (c,g)=>{ var t = new BABYLON.WoodProceduralTexture( "grass" , ' (e 4) ', ' (e 1) ');t.woodColor = c; t.ampScale=g; return t;})(' (e 2) ', ' (e 3) ')') 
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
  setNormalMap _:void (m:Material3D text:Texture3D) {
    templates {
      es6 ( (e 1) '.bumpTexture = ' (e 2) )
    }
  }

  highlight _:HighlightLayer3D (s:Scene3D name:string) {
    templates {
      es6 ('new BABYLON.HighlightLayer(' (e 2) ', ' (e 1) ')')
    }
  }
  outerGlow _:void (hl:HighlightLayer3D value:boolean) {
    templates {
      es6 ( (e 1) '.outerGlow = ' (e 2))
    }
  }
  innerGlow _:void (hl:HighlightLayer3D value:boolean) {
    templates {
      es6 ( (e 1) '.innerGlow = ' (e 2))
    }
  }

  add _:void ( hl:HighlightLayer3D o:Object3D color:Color3) {
    templates {
      es6 ( (e 1) '.addMesh(' (e 2) ', ' (e 3) ')' )
    }
  }

  remove _:void ( hl:HighlightLayer3D o:Object3D ) {
    templates {
      es6 ( (e 1) '.removeMesh(' (e 2) ')' )
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