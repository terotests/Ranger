class test_3d  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);
  
  window.addEventListener('resize', function() {
      engine.resize();
  })
        
  const camera = new BABYLON.FreeCamera("cam1", (new BABYLON.Vector3(0, 5, -10)), scene);
  camera.setTarget(new BABYLON.Vector3(0, 0, 0));
  new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
  const s1 = new BABYLON.Mesh.CreateSphere("s", 16.0, 4.0, scene);
  const s2 = new BABYLON.Mesh.CreateSphere("s", 16.0, 4.0, scene);
  s1.translate(new BABYLON.Vector3(2, 0, 0), 1, BABYLON.Space.WORLD ) ;
  s2.translate(new BABYLON.Vector3(-4, 0, -1), 1, BABYLON.Space.WORLD ) ;
  s1.data = "Hello World!";
  camera.attachControl(canvas, false);
  /** unused:  const zz = -10.0   **/ 
  let time = 0.0;
  let oPos = (s2.position).clone();
  let pickedObj;
  canvas.addEventListener("click", (e)=>{ (((ev) => { 
    console.log((("Pointer : " + (scene.pointerX)) + " , ") + (scene.pointerY));
    const pickRes = scene.pick((scene.pointerX), (scene.pointerY));
    const point = pickRes.pickedPoint;
    if ( typeof(point) !== "undefined" ) {
      const p = point;
      console.log("--> point was : " + (p.x));
      pickedObj = (pickRes.pickedMesh);
      let obj = pickedObj;
      while (typeof((obj.parent)) !== "undefined") {
        obj = (obj.parent);
      };
      pickedObj = obj;
      oPos = (obj.position).clone();
      time = 0.0;
      const d = (pickedObj).data;
      if ( typeof(d) !== "undefined" ) {
        if( typeof(d) === 'string' ) /* union case for string */ {
          var str = d;
          console.log(str);
        };
      }
    }
  }))(e) } ) 
  const loader = new BABYLON.AssetsManager(scene);
  const m = loader.addMeshTask("sword", "", "sword/", "sg-sword-13.babylon");
  m.onSuccess = (_task)=> {
    (((event) => { 
      const mat = new BABYLON.StandardMaterial("m1", scene);
      const text = new BABYLON.Texture("earth_daymap.jpg", scene);
      text.vScale = -1.0;
      text.uScale = -1.0;
      mat.diffuseTexture = text;
      s1.material  = mat;
      s2.material  = mat;
      const list = event.loadedMeshes;
      list.forEach(((item, index) => { 
        if ( index == 0 ) {
          item.position = new BABYLON.Vector3(-1, 0, 2);
          item.scaling = new BABYLON.Vector3(0.2, 0.2,0.2);
          const second = item.clone("i2");
          second.position = new BABYLON.Vector3(-2, 0, 5);
          item.rotationQuaternion = new BABYLON.Quaternion.RotationAxis((new BABYLON.Vector3(0.0, 0.0,1.0)), ((Math.PI) * -0.2));
        }
      }));
    }))(_task)
      }
      loader.load();
      let rot = 0.0;
      let direction = 1.0;
      engine.runRenderLoop(()=>{
        ((() => { 
          rot = rot + 0.01;
          s1.rotationQuaternion = new BABYLON.Quaternion.RotationAxis((new BABYLON.Vector3(0.0, 1.0,0.0)), rot);
          s2.rotationQuaternion = new BABYLON.Quaternion.RotationAxis((new BABYLON.Vector3(0.0, 1.0,0.0)), (rot + ((Math.PI) * 0.3)));
          if ( typeof(pickedObj) !== "undefined" ) {
            const o = pickedObj;
            o.position = oPos.add((BABYLON.Vector3.CatmullRom((new BABYLON.Vector3(-1, 0, 0)), (new BABYLON.Vector3(0, 0, 0)), (new BABYLON.Vector3(3, 1, 3)), (new BABYLON.Vector3(4, 2, 5)), time) ));
          }
          time = time + (0.01 * direction);
          if ( time > 1.0 ) {
            time = 1.0;
            direction = -1.0;
          }
          if ( time < 0.0 ) {
            time = 0.0;
            direction = 1.0;
          }
          scene.render();
        })) () 
       });
    }
    __js_main();
