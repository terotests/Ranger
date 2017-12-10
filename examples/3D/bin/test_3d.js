class ObjMeta  {
  constructor() {
    this.name = "";
  }
}
class test_3d  {
  constructor() {
  }
}
/* static JavaSript main routine at the end of the JS file */
function __js_main() {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true, {stencil: true});
  const scene = new BABYLON.Scene(engine);
  
  window.addEventListener('resize', function() {
      engine.resize();
  })
        
  const camera = new BABYLON.FreeCamera("cam1", (new BABYLON.Vector3(0, 11, -25)), scene);
  camera.setTarget(new BABYLON.Vector3(0, 0, 0));
  const loader = new BABYLON.AssetsManager(scene);
  const m = loader.addTextureTask("board",  "https://i.imgur.com/ghjDCqQ.png");
  m.onSuccess = (_task)=> {
    (((event) => { 
      new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
      new BABYLON.DirectionalLight("light2",new BABYLON.Vector3(-1, -1, -1),scene);
      const s1 = new BABYLON.Mesh.CreateSphere("s", 16.0, 1.0, scene);
      const s2 = new BABYLON.Mesh.CreateSphere("s", 16.0, 1.0, scene);
      const hl_layer = new BABYLON.HighlightLayer("hl1", scene);
      const dice = BABYLON.MeshBuilder.CreateBox("b", {width:1.5, height:1.5, depth:1.5, faceUV:[(new BABYLON.Vector4(0.0, 0.0,0.33,0.5)), (new BABYLON.Vector4(0.33, 0.0,0.66,0.5)), (new BABYLON.Vector4(0.66, 0.0,1.0,0.5)), (new BABYLON.Vector4(0.0, 0.5,0.33,1.0)), (new BABYLON.Vector4(0.33, 0.5,0.66,1.0)), (new BABYLON.Vector4(0.66, 0.5,1.0,1.0))]}, scene);
      dice.translate(new BABYLON.Vector3(-4, 5, 4), 1, BABYLON.Space.WORLD ) ;
      dice.rotationQuaternion = new BABYLON.Quaternion.RotationAxis((new BABYLON.Vector3(-1.0, 1.0,0.0)), ((Math.PI) * 0.6));
      const dData = new ObjMeta();
      dice.data = dData;
      dData.name = "dice";
      const points = [new BABYLON.Vector3(0, -2, 0), new BABYLON.Vector3(0, 1, 0)];
      const myTube = BABYLON.MeshBuilder.CreateTube("tube", {path: points, radiusFunction:((i, distance) => { 
        if ( i == 0 ) {
          return 1.0;
        }
        return 0.2;
      }), cap:BABYLON.Mesh.CAP_ALL}, scene);
      const head = new BABYLON.Mesh.CreateSphere("head", 16.0, 1.5, scene);
      head.translate(new BABYLON.Vector3(0, 1, 0), 1, BABYLON.Space.WORLD ) ;
      /** unused:  let merkit = []   **/ 
      const nappula = BABYLON.Mesh.MergeMeshes([myTube, head]);
      nappula.translate(new BABYLON.Vector3(6, 0, 4), 1, BABYLON.Space.WORLD ) ;
      const groundObj = BABYLON.MeshBuilder.CreateBox("board", {width:30.0, height:0.5, depth:30.0}, scene);
      groundObj.translate(new BABYLON.Vector3(-1, -1, -1), 1, BABYLON.Space.WORLD ) ;
      groundObj.data = new ObjMeta();
      s1.data = new ObjMeta();
      s2.data = new ObjMeta();
      const hlMaterial = new BABYLON.StandardMaterial("red", scene);
      hlMaterial.diffuseColor = new BABYLON.Color3(1.0, 0.3, 0.4);
      hlMaterial.specularColor  = new BABYLON.Color3(0.8, 0.2, 1.0);
      hlMaterial.emissiveColor   = new BABYLON.Color3(0.8, 0.2, 0.2);
      hlMaterial.alpha = 0.5;
      const orangeMaterial = new BABYLON.StandardMaterial("red", scene);
      orangeMaterial.diffuseColor = new BABYLON.Color3(1.0, 1.0, 0.4);
      /** unused:  const text2 = new BABYLON.Texture("bump_normal.png", scene)   **/ 
      const redMaterial = new BABYLON.StandardMaterial("red", scene);
      redMaterial.diffuseColor = new BABYLON.Color3(1.0, 0.3, 0.4);
      redMaterial.specularColor  = new BABYLON.Color3(0.8, 0.2, 1.0);
      redMaterial.emissiveColor   = new BABYLON.Color3(0.8, 0.2, 0.2);
      dice.material  = redMaterial;
      nappula.material  = redMaterial;
      nappula.scaling = new BABYLON.Vector3(0.3, 0.3,0.3);
      const n2 = nappula.clone("");
      n2.translate(new BABYLON.Vector3(1, 0, -7), 1, BABYLON.Space.WORLD ) ;
      const n3 = nappula.clone("");
      n3.translate(new BABYLON.Vector3(-4, 0, 3), 1, BABYLON.Space.WORLD ) ;
      const groundMaterial = new BABYLON.StandardMaterial("ground", scene);
      groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.4);
      groundMaterial.specularColor  = new BABYLON.Color3(1.0, 1.0, 1.0);
      const text = ( (c,g)=>{ var t = new BABYLON.GrassProceduralTexture( "grass" , 1024, scene);t.grassColor = c; t.groundColor=g; return t;})((new BABYLON.Color3(0.2, 0.8, 0.2)), (new BABYLON.Color3(0.2, 0.5, 0.2)));
      text.vScale = -1.0;
      text.uScale = -1.0;
      groundMaterial.diffuseTexture = text;
      const cardMaterial = new BABYLON.StandardMaterial("cardmat", scene);
      cardMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.3, 0.4);
      cardMaterial.specularColor  = new BABYLON.Color3(1.0, 0.3, 0.6);
      const text_1 = new BABYLON.Texture("https://i.imgur.com/ghjDCqQ.png", scene);
      text_1.vScale = -1.0;
      text_1.uScale = -1.0;
      cardMaterial.diffuseTexture = text_1;
      const fancyMaterial = new BABYLON.StandardMaterial("ground", scene);
      fancyMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.41, 0.28);
      fancyMaterial.specularColor  = new BABYLON.Color3(1.0, 1.0, 1.0);
      s1.material  = fancyMaterial;
      s2.material  = fancyMaterial;
      const diceMaterial = new BABYLON.StandardMaterial("dicemat", scene);
      diceMaterial.specularColor  = new BABYLON.Color3(1.0, 0.3, 0.6);
      const text_2 = new BABYLON.Texture("https://i.imgur.com/ghjDCqQ.png", scene);
      text_2.vScale = -1.0;
      text_2.uScale = -1.0;
      diceMaterial.diffuseTexture = text_2;
      dice.material  = diceMaterial;
      s1.translate(new BABYLON.Vector3(2, 0, 0), 1, BABYLON.Space.WORLD ) ;
      s2.translate(new BABYLON.Vector3(-4, 0, -1), 1, BABYLON.Space.WORLD ) ;
      camera.attachControl(canvas, false);
      /** unused:  const zz = -10.0   **/ 
      let time = 0.0;
      let oPos = (s2.position).clone();
      let pickedObj;
      let diceThrow = false;
      let diceStabileCnt = 0;
      canvas.addEventListener("click", (e)=>{ (((ev) => { 
        console.log((("Pointer : " + (scene.pointerX)) + " , ") + (scene.pointerY));
        const pickRes = scene.pick((scene.pointerX), (scene.pointerY));
        const point = pickRes.pickedPoint;
        if ( (typeof(point) !== "undefined" && point != null )  ) {
          const p = point;
          console.log("--> point was : " + (p.x));
          pickedObj = (pickRes.pickedMesh);
          let obj = pickedObj;
          while ((typeof((obj.parent)) !== "undefined" && (obj.parent) != null ) ) {
            obj = (obj.parent);
          };
          pickedObj = obj;
          oPos = (obj.position).clone();
          time = 0.0;
          const d = (pickedObj).data;
          if ( (typeof(d) !== "undefined" && d != null )  ) {
            if( typeof(d) === 'string' ) /* union case for string */ {
              var str = d;
              console.log(str);
            };
          }
          const meta = obj.data;
          if ( (typeof(meta) !== "undefined" && meta != null )  ) {
            if( meta instanceof ObjMeta ) /* union case */ {
              var data = meta;
              if ( (typeof(data.physics) !== "undefined" && data.physics != null )  ) {
                if ( obj == dice ) {
                  diceThrow = true;
                  diceStabileCnt = 10;
                }
                data.physics.applyImpulse(new BABYLON.Vector3(0, 10, 0), p ) ;
              }
            };
          }
        }
      }))(e) } ) 
      scene.enablePhysics();
      const opt1 = {};
      opt1.mass = 0.0;
      opt1.restitution = 0.2;
      const opt2 = {};
      opt2.mass = 1.0;
      opt2.restitution = 0.7;
      opt2.friction = 0.3;
      const opt3 = {};
      opt3.mass = 0.8;
      opt3.restitution = 0.1;
      opt3.friction = 0.4;
      const initGrounds = ((o) => { 
        o.physicsImpostor = new BABYLON.PhysicsImpostor(o, (BABYLON.PhysicsImpostor.BoxImpostor), opt1, scene);
        o.material  = groundMaterial;
      });
      initGrounds(groundObj);
      const applyPhysics = ((obj, opt, type) => { 
        const p_1 = new BABYLON.PhysicsImpostor(obj, type, opt, scene);
        obj.physicsImpostor = p_1;
        let meta_1 = obj.data;
        if ( typeof(meta_1) === "undefined" ) {
          meta_1 = new ObjMeta();
          obj.data = meta_1;
        }
        if ( (typeof(meta_1) !== "undefined" && meta_1 != null )  ) {
          if( meta_1 instanceof ObjMeta ) /* union case */ {
            var data_1 = meta_1;
            data_1.physics = p_1;
          };
        }
      });
      applyPhysics(s1, opt2, BABYLON.PhysicsImpostor.SphereImpostor);
      applyPhysics(s2, opt2, BABYLON.PhysicsImpostor.SphereImpostor);
      applyPhysics(dice, opt2, BABYLON.PhysicsImpostor.BoxImpostor);
      applyPhysics(nappula, opt2, BABYLON.PhysicsImpostor.BoxImpostor);
      applyPhysics(n2, opt2, BABYLON.PhysicsImpostor.BoxImpostor);
      applyPhysics(n3, opt2, BABYLON.PhysicsImpostor.BoxImpostor);
      let all_chips = [];
      const luo_merkki = ((x, y, z, size) => { 
        const merkki = BABYLON.MeshBuilder.CreateTube("tube", {path: [(new BABYLON.Vector3(0.0, -0.1,0.0)), (new BABYLON.Vector3(0.0, 0.1,0.0))], radiusFunction:((i, distance) => { 
          return size * 1.0;
        }), cap:BABYLON.Mesh.CAP_ALL}, scene);
        merkki.translate(new BABYLON.Vector3(x, y,z), 1, BABYLON.Space.WORLD ) ;
        applyPhysics(merkki, opt2, BABYLON.PhysicsImpostor.BoxImpostor);
        merkki.material  = orangeMaterial;
        all_chips.push(merkki);
      });
      luo_merkki(3.0, 3.0, 3.0, 1.0);
      luo_merkki(3.0, 3.3, 3.0, 1.0);
      luo_merkki(3.0, 3.6, 3.0, 1.0);
      luo_merkki(-3.0, 3.0, 3.0, 1.0);
      luo_merkki(-3.0, 3.3, 3.0, 1.0);
      luo_merkki(-3.0, 3.6, 3.0, 1.0);
      const create_card = ((x, y, z) => { 
        const card = BABYLON.MeshBuilder.CreateBox("card", {width:3.0, height:0.1, depth:5.0}, scene);
        card.translate(new BABYLON.Vector3(x, z,y), 1, BABYLON.Space.WORLD ) ;
        card.data = new ObjMeta();
        applyPhysics(card, opt3, BABYLON.PhysicsImpostor.BoxImpostor);
        card.material  = cardMaterial;
        card.rotationQuaternion = new BABYLON.Quaternion.RotationAxis((new BABYLON.Vector3(1.0, 1.0,1.0)), (0.5 * (Math.sin(z))));
      });
      const create_chips = ((n) => { 
        let cnt = n;
        while (cnt > 0) {
          const new_c = ((cnt) => { 
            setTimeout( () => {luo_merkki(3.0, 10.0, 3.0 + (0.1 * (cnt)), 1.0);
            } , 100 * cnt);
          });
          new_c(cnt);
          cnt = cnt - 1;
        };
      });
      let cnt_1 = 10;
      while (cnt_1 > 0) {
        const new_card = ((cnt) => { 
          setTimeout( () => {const rn = Math.sin(((cnt) * 0.1));
          const x = -4.3 + ((cnt) * 0.3);
          /** unused:  const y = -4.3 + rn   **/ 
          create_card(x, -6.3, 11.0 + rn);
          create_card(x, -6.3, 11.0 + rn);
          } , 100 * cnt);
        });
        new_card(cnt_1);
        cnt_1 = cnt_1 - 1;
      };
      /** unused:  const rot = 0.0   **/ 
      const direction = 1.0;
      let last_i = 0.0;
      let last_j = 0.0;
      let last_k = 0.0;
      let highlightCnt = 0;
      engine.runRenderLoop(()=>{
        ((() => { 
          time = time + (0.01 * direction);
          if ( diceStabileCnt > 0 ) {
            const WM = dice.getWorldMatrix();
            const i = WM.m[0 * 4 + 1];
            const j = WM.m[1 * 4 + 1];
            const k = WM.m[2 * 4 + 1];
            if ( (((Math.abs((i - last_i))) < 0.01) && ((Math.abs((j - last_j))) < 0.01)) && ((Math.abs((k - last_k))) < 0.01) ) {
              diceStabileCnt = diceStabileCnt - 1;
            }
            last_i = i;
            last_j = j;
            last_k = k;
            if ( diceStabileCnt == 0 ) {
              const diffAmount = 0.3;
              if ( diceThrow ) {
                const getDiceValue = (() => { 
                  if ( (((Math.abs((1.0 - i))) < diffAmount) && ((Math.abs((0.0 - j))) < diffAmount)) && ((Math.abs((0.0 - k))) < diffAmount) ) {
                    return 1;
                  }
                  if ( (((Math.abs((0.0 - i))) < diffAmount) && ((Math.abs((1.0 - j))) < diffAmount)) && ((Math.abs((0.0 - k))) < diffAmount) ) {
                    return 5;
                  }
                  if ( (((Math.abs((0.0 - i))) < diffAmount) && ((Math.abs((0.0 - j))) < diffAmount)) && ((Math.abs((1.0 - k))) < diffAmount) ) {
                    return 3;
                  }
                  if ( (((Math.abs((-1.0 - i))) < diffAmount) && ((Math.abs((0.0 - j))) < diffAmount)) && ((Math.abs((0.0 - k))) < diffAmount) ) {
                    return 6;
                  }
                  if ( (((Math.abs((0.0 - i))) < diffAmount) && ((Math.abs((-1.0 - j))) < diffAmount)) && ((Math.abs((0.0 - k))) < diffAmount) ) {
                    return 4;
                  }
                  if ( (((Math.abs((0.0 - i))) < diffAmount) && ((Math.abs((0.0 - j))) < diffAmount)) && ((Math.abs((-1.0 - k))) < diffAmount) ) {
                    return 2;
                  }
                  return 0;
                });
                const value = getDiceValue();
                if ( (value > 0) && (value < 6) ) {
                  create_chips(value);
                  switch (value ) { 
                    case 1 : 
                      hl_layer.addMesh(dice, new BABYLON.Color3(0.0, 0.8, 0.0));
                      break;
                    case 2 : 
                      hl_layer.addMesh(dice, new BABYLON.Color3(0.4, 0.8, 0.0));
                      break;
                    case 3 : 
                      hl_layer.addMesh(dice, new BABYLON.Color3(0.4, 0.4, 0.9));
                      break;
                    case 4 : 
                      hl_layer.addMesh(dice, new BABYLON.Color3(0.9, 0.4, 0.9));
                      break;
                    case 5 : 
                      hl_layer.addMesh(dice, new BABYLON.Color3(0.9, 0.9, 0.4));
                      break;
                  };
                  highlightCnt = 50;
                }
                if ( value == 6 ) {
                  hl_layer.addMesh(dice, new BABYLON.Color3(1.0, 0.0, 0.0));
                  highlightCnt = 100;
                  all_chips.forEach(((item, index) => { 
                    const meta_2 = item.data;
                    if ( (typeof(meta_2) !== "undefined" && meta_2 != null )  ) {
                      if( meta_2 instanceof ObjMeta ) /* union case */ {
                        var data_2 = meta_2;
                        if ( (typeof(data_2.physics) !== "undefined" && data_2.physics != null )  ) {
                          data_2.physics.applyImpulse(new BABYLON.Vector3(0, 30, 0), (item.getAbsolutePosition()).add((new BABYLON.Vector3(0.1, 0.1,0.1))) ) ;
                        }
                      };
                    }
                  }));
                }
                diceThrow = false;
              }
            }
          }
          if ( highlightCnt > 0 ) {
            highlightCnt = highlightCnt - 1;
            if ( highlightCnt == 0 ) {
              hl_layer.removeMesh(dice);
            }
          }
          scene.render();
        })) () 
       });
    }))(_task)
      }
      loader.load();
    }
    __js_main();
