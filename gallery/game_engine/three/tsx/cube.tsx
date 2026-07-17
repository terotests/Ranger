// ============================================================================
// cube.tsx — the canonical Three.js rotating-cube example, run 1:1 in the TSX
// engine on the Ranger Three façade. (Browser-plumbing lines — the resize
// listener and document.body.appendChild — belong to the web host and are added
// there; window.* is provided as a host global.)
// ============================================================================

import * as THREE from 'three';

let camera, scene, renderer;
let mesh;

export function init() {

  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 100 );
  camera.position.z = 2;

  scene = new THREE.Scene();

  const texture = new THREE.TextureLoader().load( 'textures/crate.gif' );
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial( { map: texture } );

  mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );

}

function animate() {

  mesh.rotation.x += 0.005;
  mesh.rotation.y += 0.01;

  renderer.render( scene, camera );

}

// --- PoC introspection hooks (the host frame loop calls animate() each frame) ---
export function tick() { animate(); }
export function frames() { return renderer.frames; }
export function rotX() { return mesh.rotation.x; }
export function rotY() { return mesh.rotation.y; }
export function camZ() { return camera.position.z; }
export function texPath() { return mesh.material.map.path; }
export function texColorSpace() { return mesh.material.map.colorSpace; }
export function boxW() { return mesh.geometry.width; }
export function loopWired() { return renderer.hasLoop; }
export function rendererW() { return renderer.width; }
