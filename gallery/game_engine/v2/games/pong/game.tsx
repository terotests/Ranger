/**
 * Pong — v2 rewrite (does not compile yet).
 *
 * v1: games/pong/index.tsx used GameRunner sprites() + initState/update +
 *     game_helpers soundEvent. Pixel field 480×270.
 *
 * v2: runtime.start(Game), ranger:2d Shape2D, action maps, audio sources.
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

const W = 480
const H = 270
const PADDLE_HALF = 28
const BALL_R = 6

class PongGame implements Game {
  private scene!: TWO.Scene2D
  private camera!: TWO.Camera2D
  private renderer!: TWO.Renderer2D

  private ball!: TWO.Shape2D
  private p1!: TWO.Shape2D
  private p2!: TWO.Shape2D

  private controlsP1!: ActionMap
  private controlsP2!: ActionMap

  // MISSING: Text2D / HUD layer for scores — v1 used host HUD/JSX.
  private score1 = 0
  private score2 = 0

  private bx = W / 2
  private by = H / 2
  private p1y = H / 2
  private p2y = H / 2
  private vx = 160
  private vy = 100

  private wallClip!: AudioClip
  private bounceClip!: AudioClip
  private wallSound!: AudioSource
  private bounceSound!: AudioSource

  async init(): Promise<void> {
    this.scene = new TWO.Scene2D()
    this.camera = new TWO.Camera2D()
    // TODO: Camera2D orthographic size / world units vs pixels is unspecified.
    // Assuming 1 world unit = 1 pixel for the 480×270 playfield for now.
    this.camera.position.set(W / 2, H / 2)
    this.camera.zoom = 1

    this.renderer = new TWO.Renderer2D()
    runtime.surface.attachRenderer(this.renderer)
    // MISSING: explicit setLogicalSize(480,270) — surface may be window-sized.

    // guest: retained shapes (D-2D) — not frame-local DrawList2D
    this.ball = new TWO.Shape2D({
      kind: "circle",
      radius: BALL_R,
      color: 0xf5f582,
    })
    this.p1 = new TWO.Shape2D({
      kind: "rect",
      width: 10,
      height: 56,
      color: 0x78dca0,
    })
    this.p2 = new TWO.Shape2D({
      kind: "rect",
      width: 10,
      height: 56,
      color: 0xdc8c78,
    })
    this.scene.add(this.ball)
    this.scene.add(this.p1)
    this.scene.add(this.p2)

    // Logical players — not gamepads[0]/1]
    this.controlsP1 = runtime.input.createActionMap({
      move: {
        type: "axis1d",
        keyboard: { negative: "KeyW", positive: "KeyS" },
        gamepad: { axis: "leftY", player: 0 },
      },
    })
    this.controlsP2 = runtime.input.createActionMap({
      move: {
        type: "axis1d",
        keyboard: { negative: "ArrowUp", positive: "ArrowDown" },
        gamepad: { axis: "leftY", player: 1 },
      },
    })
    // TODO: confirm ActionMap can bind per logical player; v1 used playerSlots=2.

    // MISSING: v1 used catalog sound names ("wall","bounce","lose") via soundEvent.
    // Target: load clips; until assets exist, these paths are placeholders.
    this.wallClip = await runtime.assets.loadAudio("audio/pong-wall.ogg")
    this.bounceClip = await runtime.assets.loadAudio("audio/pong-bounce.ogg")
    this.wallSound = runtime.audio.createSource(this.wallClip, {
      bus: "sfx",
      spatial: false,
    })
    this.bounceSound = runtime.audio.createSource(this.bounceClip, {
      bus: "sfx",
      spatial: false,
    })

    this.syncVisuals()
  }

  update(frame: FrameInfo): void {
    const dt = frame.delta // seconds; v1 used ms-style dt — verify units!

    const m1 = this.controlsP1.axis1D("move")
    const m2 = this.controlsP2.axis1D("move")
    this.p1y += m1 * 300 * dt
    this.p2y += m2 * 300 * dt
    this.p1y = clamp(this.p1y, 28, H - 28)
    this.p2y = clamp(this.p2y, 28, H - 28)

    const prevBx = this.bx
    this.bx += this.vx * dt
    this.by += this.vy * dt

    if (this.by < BALL_R) {
      this.by = BALL_R
      this.vy = -this.vy
      this.wallSound.playOneShot()
    }
    if (this.by > H - BALL_R) {
      this.by = H - BALL_R
      this.vy = -this.vy
      this.wallSound.playOneShot()
    }

    // Paddle collision — ported from v1 discrete bounce tests
    if (this.vx < 0 && this.hitPaddle(prevBx, this.bx, this.by, 18, 28, this.p1y)) {
      this.bx = 28
      this.vx = Math.abs(this.vx)
      this.vy += ((this.by - this.p1y) / PADDLE_HALF) * 70
      this.bounceSound.playOneShot()
    }
    if (this.vx > 0 && this.hitPaddle(prevBx, this.bx, this.by, 452, 462, this.p2y)) {
      this.bx = 452
      this.vx = -Math.abs(this.vx)
      this.vy += ((this.by - this.p2y) / PADDLE_HALF) * 70
      this.bounceSound.playOneShot()
    }

    if (this.bx < 0) {
      this.score2++
      this.resetBall(160)
      // MISSING: "lose" cue — need another clip or mixer bus event
    }
    if (this.bx > W) {
      this.score1++
      this.resetBall(-160)
    }

    // TODO: draw net + scores. Options:
    //   - DrawList2D each frame (immediate, no handle)
    //   - Text2D when registered (D-2D mentions text)
    // drawList.drawRect({ x: W/2-1, y: 0, width: 2, height: H, color: 0xffffff44 })

    this.syncVisuals()
    this.renderer.render(this.scene, this.camera)
  }

  resize(width: number, height: number): void {
    // TODO: letterbox 480×270 into surface; Camera2D.viewport API from D-2D.
    this.camera.viewport = { x: 0, y: 0, width, height }
  }

  shutdown(): void {
    this.wallSound.release()
    this.bounceSound.release()
    this.wallClip.release()
    this.bounceClip.release()
    // D-LIFE: scene.remove ≠ release; release shapes when dropping the game
    this.scene.remove(this.ball)
    this.scene.remove(this.p1)
    this.scene.remove(this.p2)
    this.ball.release()
    this.p1.release()
    this.p2.release()
  }

  private syncVisuals(): void {
    this.ball.position.set(this.bx, this.by)
    this.p1.position.set(18, this.p1y)
    this.p2.position.set(462, this.p2y)
  }

  private resetBall(vx: number): void {
    this.bx = W / 2
    this.by = H / 2
    this.vx = vx
    this.vy = 100
  }

  private hitPaddle(
    prevBx: number,
    bx: number,
    by: number,
    left: number,
    right: number,
    paddleY: number,
  ): boolean {
    if (by < paddleY - PADDLE_HALF || by > paddleY + PADDLE_HALF) return false
    if (this.vx < 0) {
      return prevBx > right && bx <= right
    }
    return prevBx < left && bx >= left
  }
}

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo
  if (v > hi) return hi
  return v
}

runtime.start(new PongGame())
