/**
 * Teapot — slim v2 rewrite (does not compile yet).
 *
 * v1: full webgl_geometry_teapot with lil-gui + OrbitControls on the host.
 * v2: one phong teapot + directional light; orbit via action map.
 */

import { runtime, type Game, type FrameInfo, type ActionMap } from "ranger:core"
import * as THREE from "ranger:three"

class TeapotGame implements Game {
  private camera!: THREE.PerspectiveCamera
  private scene!: THREE.Scene
  private renderer!: THREE.WebGLRenderer
  private teapot!: THREE.Mesh
  private controls!: ActionMap
  private yaw = 0
  private pitch = 0.4
  private distance = 1600

  async init(): Promise<void> {
    const size = runtime.surface.size

    this.camera = new THREE.PerspectiveCamera(45, size.width / size.height, 1, 80000)
    this.scene = new THREE.Scene()

    const ambient = new THREE.AmbientLight(0x7c7c7c, 2.0)
    const light = new THREE.DirectionalLight(0xffffff, 2.0)
    light.position.set(0.32, 0.39, 0.7)
    this.scene.add(ambient)
    this.scene.add(light)

    // MISSING: THREE.TeapotGeometry in ranger:three registry?
    // v1 used custom TeapotGeometry — must be a registered class or guest mesh data.
    const geometry = new THREE.TeapotGeometry(300, 15, true, true, true, true, true)
    // TODO: if missing, load from BufferGeometry assets instead.

    const material = new THREE.MeshPhongMaterial({
      color: 0xc0c0c0,
      specular: 0x404040,
      shininess: 300,
      side: THREE.DoubleSide,
    })
    // MISSING: multi-material switcher / envMap / uv grid from v1 example.

    this.teapot = new THREE.Mesh(geometry, material)
    this.scene.add(this.teapot)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    runtime.surface.attachRenderer(this.renderer)
    this.renderer.setSize(size.width, size.height)

    // MISSING: OrbitControls as host helper — use action map orbit for now.
    this.controls = runtime.input.createActionMap({
      orbitX: {
        type: "axis1d",
        keyboard: { negative: "ArrowLeft", positive: "ArrowRight" },
        gamepad: { axis: "rightX" },
      },
      orbitY: {
        type: "axis1d",
        keyboard: { negative: "ArrowDown", positive: "ArrowUp" },
        gamepad: { axis: "rightY" },
      },
      zoom: {
        type: "axis1d",
        // TODO: mouse wheel binding not in ActionMap sketch yet
        gamepad: { axis: "rightTrigger" },
      },
    })

    this.applyCamera()
  }

  update(frame: FrameInfo): void {
    this.yaw += this.controls.axis1D("orbitX") * 1.5 * frame.delta
    this.pitch += this.controls.axis1D("orbitY") * 1.2 * frame.delta
    this.pitch = Math.max(-1.2, Math.min(1.2, this.pitch))
    this.distance *= 1 + this.controls.axis1D("zoom") * frame.delta
    this.distance = Math.max(400, Math.min(4000, this.distance))

    this.teapot.rotation.y += 0.15 * frame.delta
    this.applyCamera()
    this.renderer.render(this.scene, this.camera)
  }

  resize(width: number, height: number): void {
    if (height === 0) return
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  shutdown(): void {
    this.scene.remove(this.teapot)
    this.teapot.geometry.dispose()
    this.teapot.material.dispose()
    this.teapot.release()
  }

  private applyCamera(): void {
    const x = Math.cos(this.pitch) * Math.sin(this.yaw) * this.distance
    const y = Math.sin(this.pitch) * this.distance
    const z = Math.cos(this.pitch) * Math.cos(this.yaw) * this.distance
    this.camera.position.set(x, y, z)
    this.camera.lookAt(0, 0, 0)
    // TODO: lookAt residency / whether Camera has lookAt on host (D-ADAPTER)
  }
}

runtime.start(new TeapotGame())
