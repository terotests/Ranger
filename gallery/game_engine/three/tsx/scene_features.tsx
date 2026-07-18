// ============================================================================
// scene_features.tsx — a "Sponza-shaped" scene (Preetham sky + a shadow-casting
// directional light + a lit mesh + a light-probe volume) declared with the plain
// façade and driven through the GENERIC bridge. It exists to prove the generic
// reconciler handles the same scene CONTENT the specialised Sponza bridge does —
// so no per-demo scene bridge is needed. GI baking is host plumbing (not scene
// reconciliation), so the probe grid is honestly reported as needing a plumbing
// module rather than silently faked.
// ============================================================================

import * as THREE from 'three';

let camera, scene, renderer, sky, dir, probes;

export function init() {

  camera = new THREE.PerspectiveCamera( 60, 1, 0.1, 1000 );
  camera.position.set( 0, 5, 10 );

  scene = new THREE.Scene();

  sky = new THREE.Sky();
  sky.turbidity = 8;
  sky.rayleigh = 2;
  sky.mieCoefficient = 0.004;
  sky.mieDirectionalG = 0.8;
  sky.sunPosition.set( 0.3, 0.9, 0.2 );
  scene.add( sky );

  dir = new THREE.DirectionalLight( 0xfff2dc, 2.0 );
  dir.position.set( 1, 2, 1 );
  dir.castShadow = true;
  dir.shadow.mapSize = 2048;
  scene.add( dir );

  const geo = new THREE.BoxGeometry();
  const mat = new THREE.MeshLambertMaterial( { color: 0xcccccc } );
  scene.add( new THREE.Mesh( geo, mat ) );

  // Declared as real scene content; GI baking is a host plumbing pass, so the
  // generic bridge must report this as needing a plumbing module (not fake it).
  probes = new THREE.LightProbeGrid( 4, 4, 4, 3, 3, 3 );
  scene.add( probes );

  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  renderer.setSize( 200, 200 );
  renderer.setAnimationLoop( function () { renderer.render( scene, camera ); } );

}

export function tick() { renderer.render( scene, camera ); }
