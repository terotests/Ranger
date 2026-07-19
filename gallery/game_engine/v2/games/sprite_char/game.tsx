/**
 * Sprite character demo — v2 rewrite (does not compile yet).
 *
 * v1: RGSP1 block with catalog character ids (hero/knight/mage/rogue) and
 *     host-timed walk animation. Guest wrote slot array indices.
 *
 * v2: loadSpriteAtlas + Sprite2D + AnimationPlayer2D; identity is spriteH.
 */

import {
  runtime,
  type Game,
  type FrameInfo,
  type ActionMap,
} from "ranger:core"
import * as TWO from "ranger:2d"

const CHARACTERS = ["hero", "knight", "mage", "rogue"] as const

class SpriteCharGame implements Game {
  private scene!: TWO.Scene2D
  private camera!: TWO.Camera2D
  private renderer!: TWO.Renderer2D
  private player!: TWO.Sprite2D
  private anim!: TWO.AnimationPlayer2D
  private npcs: TWO.Sprite2D[] = []
  private controls!: ActionMap
  private facing: "down" | "left" | "right" | "up" = "down"

  async init(): Promise<void> {
    this.scene = new TWO.Scene2D()
    this.camera = new TWO.Camera2D()
    this.camera.position.set(240, 135)
    this.camera.zoom = 2
    this.renderer = new TWO.Renderer2D()
    runtime.surface.attachRenderer(this.renderer)

    // NOT RGSP1 catalog id — atlas JSON from LPC pack (v2/lpc/pack/characters)
    // MISSING: exact atlas.json layout from LPC bake pipeline (D-2D-2).
    const atlas = await runtime.assets.loadSpriteAtlas(
      "lpc/characters/hero/atlas.json",
    )

    this.player = new TWO.Sprite2D(atlas.region("walk-down-0"))
    this.player.anchor.set(0.5, 1.0)
    this.player.position.set(240, 180)
    this.scene.add(this.player)

    this.anim = new TWO.AnimationPlayer2D(this.player)
    this.anim.play(atlas.animation("walk-down"), {
      loop: true,
      framesPerSecond: 9,
    })
    // MISSING: v1 jumped via ACTION — need jump clip + one-shot play.

    // Showcase other catalog characters as NPCs (separate atlas loads).
    let x = 80
    for (const name of CHARACTERS) {
      if (name === "hero") continue
      // TODO: batch atlas load / shared pack manifest via runtime.assets
      const other = await runtime.assets.loadSpriteAtlas(
        `lpc/characters/${name}/atlas.json`,
      )
      const npc = new TWO.Sprite2D(other.region("walk-down-0"))
      npc.anchor.set(0.5, 1.0)
      npc.position.set(x, 120)
      this.scene.add(npc)
      this.npcs.push(npc)
      x += 80
    }

    this.controls = runtime.input.createActionMap({
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
      jump: {
        type: "button",
        keyboard: ["Space"],
        gamepad: { button: "south" },
      },
    })
  }

  update(frame: FrameInfo): void {
    const dx = this.controls.axis1D("moveX")
    const dy = this.controls.axis1D("moveY")
    const speed = 80
    const p = this.player.position
    // HACK: hybrid Vector2 mutation — prefer p.set(p.x + …) once API is firm
    this.player.position.set(
      p.x + dx * speed * frame.delta,
      p.y + dy * speed * frame.delta,
    )

    const nextFacing = facingFromAxes(dx, dy, this.facing)
    if (nextFacing !== this.facing) {
      this.facing = nextFacing
      // MISSING: atlas.animation(`walk-${facing}`) hot-swap without recreating player
      // this.anim.play(atlas.animation(`walk-${this.facing}`), { loop: true })
    }

    if (this.controls.wasPressed("jump")) {
      // TODO: AnimationPlayer2D one-shot "jump" then return to walk
    }

    // Animation advances on runtime.time inside the player — guest does not
    // tick RGSP1 slot clocks (D-2D-5 / D-2D-8).

    this.camera.position.set(this.player.position.x, this.player.position.y)
    this.renderer.render(this.scene, this.camera)
  }

  shutdown(): void {
    this.scene.remove(this.player)
    this.player.release()
    // TODO: animation player release / atlas release (D-OWN borrowed regions)
    for (const npc of this.npcs) {
      this.scene.remove(npc)
      npc.release()
    }
  }
}

function facingFromAxes(
  dx: number,
  dy: number,
  fallback: "down" | "left" | "right" | "up",
): "down" | "left" | "right" | "up" {
  if (Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) return fallback
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left"
  return dy > 0 ? "down" : "up"
}

runtime.start(new SpriteCharGame())
