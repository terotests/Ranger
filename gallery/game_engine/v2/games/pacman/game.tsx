/**
 * Pac-Man — thin v2 rewrite (does not compile yet).
 *
 * v1: pacman_shared.tsx (~1450 lines), bitmap ghosts, multi-level progressive.
 * v2: Shape2D stand-ins on a tiny hard-coded maze; marks missing atlas/AI.
 */

import {
  runtime,
  type Game,
  type FrameInfo,
  type ActionMap,
  type AudioClip,
  type AudioSource,
} from "ranger:core"
import * as TWO from "ranger:2d"

// Tiny demo maze: 0 empty, 1 wall, 2 dot. Full v1 tile maps not ported.
const MAZE: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 2, 1, 1, 1, 2, 1, 2, 1],
  [1, 2, 2, 2, 2, 0, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]
const TILE = 24

class PacmanGame implements Game {
  private scene!: TWO.Scene2D
  private camera!: TWO.Camera2D
  private renderer!: TWO.Renderer2D
  private player!: TWO.Shape2D
  private ghost!: TWO.Shape2D
  private walls: TWO.Shape2D[] = []
  private dots = new Map<string, TWO.Shape2D>()

  private controls!: ActionMap
  private chompClip!: AudioClip
  private chompSound!: AudioSource

  private col = 1
  private row = 1
  private ghostCol = 9
  private ghostRow = 1
  private moveCooldown = 0

  async init(): Promise<void> {
    this.scene = new TWO.Scene2D()
    this.camera = new TWO.Camera2D()
    this.renderer = new TWO.Renderer2D()
    runtime.surface.attachRenderer(this.renderer)

    // MISSING: TileMap2D (D-2D) — building walls as individual Shape2D is OK for
    // a demo but will not scale to v1 mazes.
    for (let r = 0; r < MAZE.length; r++) {
      for (let c = 0; c < MAZE[r].length; c++) {
        const cell = MAZE[r][c]
        const x = c * TILE + TILE / 2
        const y = r * TILE + TILE / 2
        if (cell === 1) {
          const wall = new TWO.Shape2D({
            kind: "rect",
            width: TILE - 2,
            height: TILE - 2,
            color: 0x2040c0,
          })
          wall.position.set(x, y)
          this.scene.add(wall)
          this.walls.push(wall)
        } else if (cell === 2) {
          const dot = new TWO.Shape2D({
            kind: "circle",
            radius: 3,
            color: 0xffe0a0,
          })
          dot.position.set(x, y)
          this.scene.add(dot)
          this.dots.set(`${c},${r}`, dot)
        }
      }
    }

    // MISSING: Sprite2D wedge / mouth animation (v1 kind: "wedge")
    this.player = new TWO.Shape2D({
      kind: "circle",
      radius: 10,
      color: 0xffe040,
    })
    this.ghost = new TWO.Shape2D({
      kind: "circle",
      radius: 10,
      color: 0xff4060,
    })
    this.scene.add(this.player)
    this.scene.add(this.ghost)

    this.controls = runtime.input.createActionMap({
      // Discrete grid moves — axis thresholds in update
      moveX: {
        type: "axis1d",
        keyboard: { negative: "ArrowLeft", positive: "ArrowRight" },
        gamepad: { axis: "leftX" },
      },
      moveY: {
        type: "axis1d",
        keyboard: { negative: "ArrowUp", positive: "ArrowDown" },
        gamepad: { axis: "leftY" },
      },
    })

    this.chompClip = await runtime.assets.loadAudio("audio/pacman-chomp.ogg")
    this.chompSound = runtime.audio.createSource(this.chompClip, { bus: "sfx" })

    this.camera.position.set(
      (MAZE[0].length * TILE) / 2,
      (MAZE.length * TILE) / 2,
    )
    this.syncActors()
  }

  update(frame: FrameInfo): void {
    this.moveCooldown -= frame.delta
    if (this.moveCooldown <= 0) {
      const dx = this.controls.axis1D("moveX")
      const dy = this.controls.axis1D("moveY")
      let stepC = 0
      let stepR = 0
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 0.4) {
        stepC = dx > 0 ? 1 : -1
      } else if (Math.abs(dy) > 0.4) {
        stepR = dy > 0 ? 1 : -1
      }
      if (stepC !== 0 || stepR !== 0) {
        const nc = this.col + stepC
        const nr = this.row + stepR
        if (walkable(nc, nr)) {
          this.col = nc
          this.row = nr
          this.moveCooldown = 0.12
          this.eatDot(nc, nr)
        }
      }

      // MISSING: real ghost AI / frightened mode / tunnel wrap from v1
      this.wanderGhost()
    }

    this.syncActors()
    this.renderer.render(this.scene, this.camera)
  }

  shutdown(): void {
    this.chompSound.release()
    this.chompClip.release()
    for (const w of this.walls) {
      this.scene.remove(w)
      w.release()
    }
    for (const d of this.dots.values()) {
      this.scene.remove(d)
      d.release()
    }
    this.scene.remove(this.player)
    this.scene.remove(this.ghost)
    this.player.release()
    this.ghost.release()
  }

  private eatDot(c: number, r: number): void {
    const key = `${c},${r}`
    const dot = this.dots.get(key)
    if (!dot) return
    this.scene.remove(dot)
    dot.release()
    this.dots.delete(key)
    this.chompSound.playOneShot()
    // TODO: win when dots empty; power pellets; lives
  }

  private wanderGhost(): void {
    const options = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]
    // HACK: deterministic pick — not v1 chase/scatter
    for (const [dc, dr] of options) {
      const nc = this.ghostCol + dc
      const nr = this.ghostRow + dr
      if (walkable(nc, nr)) {
        this.ghostCol = nc
        this.ghostRow = nr
        break
      }
    }
  }

  private syncActors(): void {
    this.player.position.set(this.col * TILE + TILE / 2, this.row * TILE + TILE / 2)
    this.ghost.position.set(
      this.ghostCol * TILE + TILE / 2,
      this.ghostRow * TILE + TILE / 2,
    )
  }
}

function walkable(c: number, r: number): boolean {
  if (r < 0 || r >= MAZE.length || c < 0 || c >= MAZE[0].length) return false
  return MAZE[r][c] !== 1
}

runtime.start(new PacmanGame())
