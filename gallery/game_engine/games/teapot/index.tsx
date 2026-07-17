// ============================================================================
// teapot.tsx — the classic Three.js webgl_geometry_teapot example, run in the
// TSX interpreter on the Ranger Three façade + WebGL. This is the *scene* code —
// lights, materials, the TeapotGeometry and the render() rebuild logic — exactly
// as in the Three.js example. Browser plumbing (OrbitControls, the lil-gui panel,
// the resize listener) is provided by the host, just as the cube example's
// appendChild + resize listener are. Edit a material, a colour, the default
// tessellation or shading and the scene hot-reloads.
//
// (One rename vs. the upstream example: the top-level render() is renamed
// renderScene() — the TSX interpreter reserves a top-level `render()` for JSX
// component rendering. Everything else is the example verbatim.)
// ============================================================================

import * as THREE from 'three';

let camera, scene, renderer;
let effectController;
const teapotSize = 300;
let ambientLight, light;

let tess = -1;   // force initialization
let bBottom, bLid, bBody, bFitLid, bNonBlinn, shading;

let teapot, textureCube, textureMap;
const materials = {};

export function init() {

  // CAMERA
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 80000 );
  camera.position.set( -600, 550, 1300 );

  // LIGHTS
  ambientLight = new THREE.AmbientLight( 0x7c7c7c, 2.0 );
  light = new THREE.DirectionalLight( 0xFFFFFF, 2.0 );
  light.position.set( 0.32, 0.39, 0.7 );

  // RENDERER
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  // TEXTURE MAP
  textureMap = new THREE.TextureLoader().load( 'textures/uv_grid_opengl.jpg' );
  textureMap.wrapS = textureMap.wrapT = THREE.RepeatWrapping;
  textureMap.anisotropy = 16;
  textureMap.colorSpace = THREE.SRGBColorSpace;

  // REFLECTION MAP
  const path = 'textures/cube/pisa/';
  const urls = [ 'px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png' ];
  textureCube = new THREE.CubeTextureLoader().setPath( path ).load( urls );

  materials['wireframe'] = new THREE.MeshBasicMaterial( { wireframe: true } );
  materials['flat'] = new THREE.MeshPhongMaterial( { specular: 0x000000, flatShading: true, side: THREE.DoubleSide } );
  materials['smooth'] = new THREE.MeshLambertMaterial( { side: THREE.DoubleSide } );
  materials['glossy'] = new THREE.MeshPhongMaterial( { color: 0xc0c0c0, specular: 0x404040, shininess: 300, side: THREE.DoubleSide } );
  materials['textured'] = new THREE.MeshPhongMaterial( { map: textureMap, side: THREE.DoubleSide } );
  materials['reflective'] = new THREE.MeshPhongMaterial( { envMap: textureCube, side: THREE.DoubleSide } );

  // scene itself
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xAAAAAA );

  scene.add( ambientLight );
  scene.add( light );

  effectController = {
    newTess: 15,
    bottom: true,
    lid: true,
    body: true,
    fitLid: false,
    nonblinn: false,
    newShading: 'glossy'
  };
}

export function renderScene() {

  if ( effectController.newTess !== tess ||
    effectController.bottom !== bBottom ||
    effectController.lid !== bLid ||
    effectController.body !== bBody ||
    effectController.fitLid !== bFitLid ||
    effectController.nonblinn !== bNonBlinn ||
    effectController.newShading !== shading ) {

    tess = effectController.newTess;
    bBottom = effectController.bottom;
    bLid = effectController.lid;
    bBody = effectController.body;
    bFitLid = effectController.fitLid;
    bNonBlinn = effectController.nonblinn;
    shading = effectController.newShading;

    createNewTeapot();
  }

  // skybox is rendered separately, so that it is always behind the teapot.
  if ( shading === 'reflective' ) {
    scene.background = textureCube;
  } else {
    scene.background = null;
  }

  renderer.render( scene, camera );
}

// Whenever the teapot changes, the scene is rebuilt from scratch.
function createNewTeapot() {

  if ( teapot ) {
    teapot.geometry.dispose();
    scene.remove( teapot );
  }

  const geometry = new THREE.TeapotGeometry( teapotSize,
    tess,
    effectController.bottom,
    effectController.lid,
    effectController.body,
    effectController.fitLid,
    ! effectController.nonblinn );

  teapot = new THREE.Mesh( geometry, materials[ shading ] );

  scene.add( teapot );
}

// --- host hooks (the host's OrbitControls + GUI plumbing drive these) --------
// Multi-value hooks take a single object (the interpreter binds one argument).
export function setShading(s) { effectController.newShading = s; renderScene(); }
export function setTess(t) { effectController.newTess = t; renderScene(); }
export function setBool(p) { effectController[ p.name ] = p.on; renderScene(); }
export function setCamera(p) { camera.position.set(p.x, p.y, p.z); }
export function currentShading() { return effectController.newShading; }
