/**
 * Breakout — v2 rewrite (does not compile yet).
 *
 * v1: sprites() brick defs + screen model (play / gameOver) + HUD JSX.
 * v2: retained Shape2D bricks, action map, playOneShot SFX.
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

const COLS = 10
const ROWS = 5
const BRICK_COUNT = COLS * ROWS
const BRICK_W = 40
const BRICK_H = 12
const BRICK_GAP = 4
const BRICK_TOP = 52
const BRICK_LEFT = 40
const PADDLE_W = 88
const PADDLE_H = 10
const PADDLE_HALF = 44
const W = 480
const H = 270

const BRICK_COLORS = [0xdc505a, 0xff963c, 0xffdc50, 0x78dc8c, 0x5aaaff]

class BreakoutGame implements Game {
  private scene!: TWO.Scene2D
  private camera!: TWO.Camera2D
  private renderer!: TWO.Renderer2D
  private paddle!: TWO.Shape2D
  private ball!: TWO.Shape2D
  private bricks: TWO.Shape2D[] = []
  private alive: boolean[] = []

  private controls!: ActionMap
  private bounceSound!: AudioSource
  private brickSound!: AudioSource
  private bounceClip!: AudioClip
  private brickClip!: AudioClip

  private px = 240
  private bx = 240
  private by = 220
  private vx = 180
  private vy = 140
  private score = 0
  private lives = 3
  // MISSING: screen stack (play / gameOver). v1 froze play state in screens{}.
  private gameOver = false

  async init(): Promise<void> {
    this.scene = new TWO.Scene2D()
    this.camera = new TWO.Camera2D()
    this.camera.position.set(W / 2, H / 2)
    this.renderer = new TWO.Renderer2D()
    runtime.surface.attachRenderer(this.renderer)

    this.paddle = new TWO.Shape2D({
      kind: "rect",
      width: PADDLE_W,
      height: PADDLE_H,
      color: 0x78dcff,
    })
    this.ball = new TWO.Shape2D({
      kind: "circle",
      radius: 5,
      color: 0xf5f582,
    })
    this.scene.add(this.paddle)
    this.scene.add(this.ball)

    for (let i = 0; i < BRICK_COUNT; i++) {
      const row = Math.floor(i / COLS)
      const brick = new TWO.Shape2D({
        kind: "rect",
        width: BRICK_W,
        height: BRICK_H,
        color: BRICK_COLORS[row % BRICK_COLORS.length],
      })
      const col = i % COLS
      brick.position.set(
        BRICK_LEFT + col * (BRICK_W + BRICK_GAP) + BRICK_W / 2,
        BRICK_TOP + row * (BRICK_H + BRICK_GAP) + BRICK_H / 2,
      )
      this.scene.add(brick)
      this.bricks.push(brick)
      this.alive.push(true)
    }

    this.controls = runtime.input.createActionMap({
      move: {
        type: "axis1d",
        keyboard: { negative: "ArrowLeft", positive: "ArrowRight" },
        // ALSO: KeyA / KeyD — ActionMap multi-binding not clearly specified
        gamepad: { axis: "leftX" },
      },
      restart: {
        type: "button",
        keyboard: ["Space"],
        gamepad: { button: "south" },
      },
    })

    this.bounceClip = await runtime.assets.loadAudio("audio/breakout-bounce.ogg")
    this.brickClip = await runtime.assets.loadAudio("audio/breakout-brick.ogg")
    this.bounceSound = runtime.audio.createSource(this.bounceClip, { bus: "sfx" })
    this.brickSound = runtime.audio.createSource(this.brickClip, { bus: "sfx" })

    this.syncPaddleBall()
  }

  update(frame: FrameInfo): void {
    if (this.gameOver) {
      if (this.controls.wasPressed("restart")) {
        this.resetPlay()
      }
      // MISSING: game-over overlay via Text2D / UI module
      this.renderer.render(this.scene, this.camera)
      return
    }

    const dt = frame.delta
    this.px += this.controls.axis1D("move") * 340 * dt
    this.px = clamp(this.px, PADDLE_HALF, W - PADDLE_HALF)

    this.bx += this.vx * dt
    this.by += this.vy * dt

    if (this.by < 8) {
      this.by = 8
      this.vy = -this.vy
      this.bounceSound.playOneShot()
    }
    if (this.bx < 6) {
      this.bx = 6
      this.vx = -this.vx
      this.bounceSound.playOneShot()
    }
    if (this.bx > W - 6) {
      this.bx = W - 6
      this.vx = -this.vx
      this.bounceSound.playOneShot()
    }

    const py = 248
    if (this.by > py - 14 && this.bx > this.px - PADDLE_HALF && this.bx < this.px + PADDLE_HALF) {
      this.by = py - 14
      this.vy = -Math.abs(this.vy)
      this.vx += ((this.bx - this.px) / PADDLE_HALF) * 60
      this.bounceSound.playOneShot()
    }

    if (this.by > H) {
      this.lives--
      this.bx = this.px
      this.by = py - 24
      this.vx = 180
      this.vy = 140
      if (this.lives <= 0) {
        this.gameOver = true
        // TODO: freeze brick visibility; show "lose" UI
      }
    }

    for (let i = 0; i < BRICK_COUNT; i++) {
      if (!this.alive[i]) continue
      const pos = this.bricks[i].position
      // HACK: reading hybrid Vector2 — assume .x/.y after turn-start refresh (D-ADAPTER)
      if (Math.abs(this.bx - pos.x) < BRICK_W / 2 + 5 && Math.abs(this.by - pos.y) < BRICK_H / 2 + 5) {
        this.alive[i] = false
        // D-LIFE: hide ≠ release — keep handle for possible level reset
        this.bricks[i].visible = false
        this.vy = -this.vy
        this.score += 10
        this.brickSound.playOneShot()
      }
    }

    if (this.alive.every((a) => !a)) {
      this.gameOver = true
      // TODO: win screen
    }

    this.syncPaddleBall()
    this.renderer.render(this.scene, this.camera)
  }

  shutdown(): void {
    this.bounceSound.release()
    this.brickSound.release()
    this.bounceClip.release()
    this.brickClip.release()
    for (const b of this.bricks) {
      this.scene.remove(b)
      b.release()
    }
    this.scene.remove(this.paddle)
    this.scene.remove(this.ball)
    this.paddle.release()
    this.ball.release()
  }

  private syncPaddleBall(): void {
    this.paddle.position.set(this.px, 248)
    this.ball.position.set(this.bx, this.by)
  }

  private resetPlay(): void {
    this.gameOver = false
    this.score = 0
    this.lives = 3
    this.px = 240
    this.bx = 240
    this.by = 220
    this.vx = 180
    this.vy = 140
    for (let i = 0; i < BRICK_COUNT; i++) {
      this.alive[i] = true
      this.bricks[i].visible = true
    }
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

runtime.start(new BreakoutGame())
