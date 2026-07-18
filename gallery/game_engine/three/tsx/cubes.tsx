// ============================================================================
// cubes.tsx — a simple multi-mesh Three.js scene, run 1:1 in the TSX engine on
// the Ranger Three façade. A ring of crate-textured cubes, each tinted a
// different colour, orbiting the centre while spinning on their own axes.
//
// Like cube.tsx it is the *unmodified* Three.js style (import THREE, a scene
// graph, setAnimationLoop); the browser-plumbing lines (resize listener,
// document.body.appendChild) belong to the web host. It exercises the scene
// graph with many objects and per-object materials — no new engine features
// beyond the canonical rotating cube, so it renders on the same GPU path.
// ============================================================================

import * as THREE from 'three';

let camera, scene, renderer;
let cubes = [];
let t = 0;

const COUNT = 10;
const RADIUS = 3.4;
const TAU = 6.2831853;

// A hue-wheel palette (0xRRGGBB); each cube is tinted, the crate texture keeps
// the rotation readable on the unlit material (base = colour * texture).
const PALETTE = [
  0xff5252, 0xff8f00, 0xffd600, 0x9ccc65, 0x26a69a,
  0x29b6f6, 0x5c6bc0, 0xab47bc, 0xec407a, 0xe0e0e0,
];

export function init() {

  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
  camera.position.z = 8;
  camera.position.y = 1.5;

  scene = new THREE.Scene();

  const texture = new THREE.TextureLoader().load( 'textures/crate.gif' );
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.BoxGeometry();

  let i = 0;
  while ( i < COUNT ) {
    const material = new THREE.MeshBasicMaterial( { map: texture, color: PALETTE[ i ] } );
    const mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );
    cubes.push( mesh );
    i = i + 1;
  }

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );

}

function animate() {

  t = t + 0.01;

  let i = 0;
  while ( i < COUNT ) {
    const cube = cubes[ i ];
    const a = ( i / COUNT ) * TAU + t;
    cube.position.x = Math.cos( a ) * RADIUS;
    cube.position.y = Math.sin( a ) * RADIUS * 0.35;
    cube.position.z = Math.sin( a ) * RADIUS;
    cube.rotation.x = t * 2.0 + i;
    cube.rotation.y = t * 1.5 + i;
    i = i + 1;
  }

  renderer.render( scene, camera );

}

// --- introspection hooks (the host frame loop calls animate() each frame) ---
export function tick() { animate(); }
export function frames() { return renderer.frames; }
export function cubeCount() { return cubes.length; }
export function cube0X() { return cubes[ 0 ].position.x; }
export function camZ() { return camera.position.z; }
export function loopWired() { return renderer.hasLoop; }
