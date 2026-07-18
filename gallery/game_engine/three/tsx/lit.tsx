// ============================================================================
// lit.tsx — a lit scene (NOT a cube-only scene): a Lambert box under a
// directional light + ambient fill. Used to prove the GENERIC bridge maps every
// façade object to its real object-model counterpart by type — a directional
// light becomes a real ThreeDirectionalLight, a Lambert material becomes a real
// ThreeMeshLambertMaterial — with no bridge changes. (Also a valid demo.)
// ============================================================================

import * as THREE from 'three';

let camera, scene, renderer, mesh, dir;

export function init() {

  camera = new THREE.PerspectiveCamera( 50, 1, 0.1, 100 );
  camera.position.z = 3;

  scene = new THREE.Scene();

  scene.add( new THREE.AmbientLight( 0x333333, 1 ) );

  dir = new THREE.DirectionalLight( 0xffffff, 1 );
  dir.position.set( 1, 1, 2 );
  scene.add( dir );

  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshLambertMaterial( { color: 0xcccccc } );
  mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( 200, 200 );
  renderer.setAnimationLoop( animate );

}

function animate() {
  mesh.rotation.x += 0.02;
  mesh.rotation.y += 0.03;
  renderer.render( scene, camera );
}

export function tick() { animate(); }
