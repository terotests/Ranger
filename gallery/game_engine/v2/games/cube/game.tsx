/**
 * Rotating cube — v2 rewrite (does not compile yet).
 *
 * v1: import * as THREE from 'three'; window.innerWidth; setAnimationLoop.
 * v2: ranger:three + ranger:core surface; host-driven Game.update.
 */

import { runtime, type Game, type FrameInfo } from "ranger:core"
import * as THREE from "ranger:three"

class CubeGame implements Game {
  private camera!: THREE.PerspectiveCamera
  private scene!: THREE.Scene
  private renderer!: THREE.WebGLRenderer
  private mesh!: THREE.Mesh

  async init(): Promise<void> {
    const size = runtime.surface.size
    // NOT window.innerWidth — surface is runtime-owned (D-MODULES)

    this.camera = new THREE.PerspectiveCamera(
      70,
      size.width / size.height,
      0.1,
      100,
    )
    this.camera.position.z = 2

    this.scene = new THREE.Scene()

    // MISSING: TextureLoader path resolution vs runtime.assets.loadTexture.
    // Prefer assets API for WASM/native parity (D-ASYNC):
    //   const texture = await runtime.assets.loadTexture("textures/crate.gif")
    // Until then, keep Three-compat loader as a thin wrapper over assets.
    const texture = await runtime.assets.loadTexture("textures/crate.gif")
    // TODO: colorSpace / SRGB — declare on Texture2D / Three Texture residency

    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial({ map: texture })
    this.mesh = new THREE.Mesh(geometry, material)
    this.scene.add(this.mesh)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    runtime.surface.attachRenderer(this.renderer)
    // NOT document.body.appendChild
    this.renderer.setSize(size.width, size.height)
    // NOT renderer.setAnimationLoop — host calls update (D-MODULES frame pipeline)
  }

  update(frame: FrameInfo): void {
    // Scale rotation by delta so motion is frame-rate independent (v1 used fixed step).
    this.mesh.rotation.x += 0.005 * (frame.delta * 60)
    this.mesh.rotation.y += 0.01 * (frame.delta * 60)
    this.renderer.render(this.scene, this.camera)
  }

  resize(width: number, height: number): void {
    if (height === 0) return
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  shutdown(): void {
    this.scene.remove(this.mesh)
    // D-LIFE: dispose_backend ≠ release
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
    // TODO: texture.disposeBackend / release — ownership after material holds it (D-OWN)
    this.mesh.release()
  }
}

runtime.start(new CubeGame())
