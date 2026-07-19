/**
 * Space Invaders — thin v2 rewrite (does not compile yet).
 *
 * v1: bitmap sprite frames in invaders_shared.tsx + multi-level screens.
 * v2: Shape2D placeholders + ActionMap; atlas/bitmap path marked MISSING.
 */

import {
  runtime,
  type Game,
  type FrameInfo,
  type ActionMap,
  type AudioSource,
  type AudioClip,
} from "ranger:core"
import * as TWO from "ranger:2d"

const COLS = 5
const ROWS = 3
const ALIEN_COUNT = COLS * ROWS
const W = 480
const H = 270

class InvadersGame implements Game {
  private scene!: TWO.Scene2D
  private camera!: TWO.Camera2D
  private renderer!: TWO.Renderer2D
  private ship!: TWO.Shape2D
  private aliens: TWO.Shape2D[] = []
  private alienAlive: boolean[] = []
  private shot: TWO.Shape2D | null = null

  private controls!: ActionMap
  private shootClip!: AudioClip
  private shootSound!: AudioSource

  private shipX = 240
  private alienOriginX = 80
  private alienOriginY = 40
  private alienDir = 1
  private shotX = 0
  private shotY = -1
  private cooldown = 0

  async init(): Promise<void> {
    this.scene = new TWO.Scene2D()
    this.camera = new TWO.Camera2D()
    this.camera.position.set(W / 2, H / 2)
    this.renderer = new TWO.Renderer2D()
    runtime.surface.attachRenderer(this.renderer)

    // MISSING: Sprite2D + SpriteAtlas from pixel-art frames (v1 bitmap kinds).
    // Using Shape2D rects as stand-ins until atlas bake lands (D-2D-2).
    this.ship = new TWO.Shape2D({
      kind: "rect",
      width: 24,
      height: 12,
      color: 0x78ffc8,
    })
    this.scene.add(this.ship)

    for (let i = 0; i < ALIEN_COUNT; i++) {
      const alien = new TWO.Shape2D({
        kind: "rect",
        width: 20,
        height: 14,
        color: 0xffaa40,
      })
      this.scene.add(alien)
      this.aliens.push(alien)
      this.alienAlive.push(true)
    }

    this.controls = runtime.input.createActionMap({
      move: {
        type: "axis1d",
        keyboard: { negative: "ArrowLeft", positive: "ArrowRight" },
        gamepad: { axis: "leftX" },
      },
      fire: {
        type: "button",
        keyboard: ["Space", "KeyZ"],
        gamepad: { button: "south" },
      },
    })

    this.shootClip = await runtime.assets.loadAudio("audio/invaders-shot.ogg")
    this.shootSound = runtime.audio.createSource(this.shootClip, { bus: "sfx" })

    this.layoutAliens()
    this.ship.position.set(this.shipX, H - 24)
  }

  update(frame: FrameInfo): void {
    const dt = frame.delta
    this.shipX += this.controls.axis1D("move") * 220 * dt
    this.shipX = clamp(this.shipX, 20, W - 20)
    this.ship.position.set(this.shipX, H - 24)

    // March aliens
    this.alienOriginX += this.alienDir * 40 * dt
    if (this.alienOriginX < 40 || this.alienOriginX > 200) {
      this.alienDir = -this.alienDir
      this.alienOriginY += 12
      // TODO: lose condition when aliens reach ship row
    }
    this.layoutAliens()

    // MISSING: AnimationPlayer2D for 2-frame alien wiggle (v1 flipped bitmaps).

    this.cooldown = Math.max(0, this.cooldown - dt)
    if (this.controls.wasPressed("fire") && this.cooldown <= 0 && this.shot == null) {
      this.shot = new TWO.Shape2D({
        kind: "rect",
        width: 3,
        height: 10,
        color: 0xffffff,
      })
      this.shotX = this.shipX
      this.shotY = H - 40
      this.scene.add(this.shot)
      this.cooldown = 0.35
      this.shootSound.playOneShot()
    }

    if (this.shot) {
      this.shotY -= 320 * dt
      this.shot.position.set(this.shotX, this.shotY)
      if (this.shotY < 0) {
        this.clearShot()
      } else {
        for (let i = 0; i < ALIEN_COUNT; i++) {
          if (!this.alienAlive[i]) continue
          const p = this.aliens[i].position
          if (Math.abs(p.x - this.shotX) < 12 && Math.abs(p.y - this.shotY) < 10) {
            this.alienAlive[i] = false
            this.aliens[i].visible = false
            this.clearShot()
            break
          }
        }
      }
    }

    // TODO: alien bombs, barriers, level-2 wave, win screen (v1 level2.tsx / win.tsx)

    this.renderer.render(this.scene, this.camera)
  }

  shutdown(): void {
    this.clearShot()
    this.shootSound.release()
    this.shootClip.release()
    this.scene.remove(this.ship)
    this.ship.release()
    for (const a of this.aliens) {
      this.scene.remove(a)
      a.release()
    }
  }

  private layoutAliens(): void {
    for (let i = 0; i < ALIEN_COUNT; i++) {
      if (!this.alienAlive[i]) continue
      const col = i % COLS
      const row = Math.floor(i / COLS)
      this.aliens[i].position.set(
        this.alienOriginX + col * 48,
        this.alienOriginY + row * 28,
      )
    }
  }

  private clearShot(): void {
    if (!this.shot) return
    this.scene.remove(this.shot)
    this.shot.release()
    this.shot = null
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

runtime.start(new InvadersGame())
