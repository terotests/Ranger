// ============================================================================
// driven.tsx — a fixture that SPECIFIES the settings a demo-surface would other-
// wise hardcode or drop: camera orientation, renderer tone mapping + exposure,
// scene background, and an unsupported material feature (envMap). The generic
// bridge must actually honour the honourable ones and LOUDLY report the rest —
// i.e. the interpreted TSX drives the real objects, not a façade that fakes it.
// ============================================================================

import * as THREE from 'three';

let camera, scene, renderer, mesh;

export function init() {

  camera = new THREE.PerspectiveCamera( 50, 1, 0.1, 100 );
  camera.position.set( 0, 0, 5 );
  camera.rotation.set( 0.3, 0.2, 0.1 );          // orientation must be honoured

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xff0000 ); // clear colour must be honoured

  const geometry = new THREE.BoxGeometry();
  // envMap is specified but the generic bridge has no supplied cube map — it must
  // be reported (counted), not silently rendered as a plain material.
  const material = new THREE.MeshPhongMaterial( { color: 0x8888ff, envMap: new THREE.CubeTexture() } );
  mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );

  renderer = new THREE.WebGLRenderer();
  renderer.toneMapping = THREE.ACESFilmicToneMapping;   // = 4, must be honoured
  renderer.toneMappingExposure = 0.5;                   // must be honoured
  renderer.setSize( 200, 200 );
  renderer.setAnimationLoop( function () { renderer.render( scene, camera ); } );

}

export function tick() { renderer.render( scene, camera ); }
