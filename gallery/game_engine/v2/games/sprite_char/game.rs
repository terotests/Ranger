//! Sprite character — Rust/WASM sketch (does not compile yet).
//!
//! Replaces RGSP1 `sprite_game!` slots with `ranger_wasm::two_d` handles (D-2D-8).

use ranger_wasm::{
    core::{
        ActionMap, FrameInfo, Game, GameContext, GamepadAxis, InitContext, Key, Result,
    },
    two_d,
};

struct SpriteCharGame {
    scene: two_d::Scene2D,
    camera: two_d::Camera2D,
    renderer: two_d::Renderer2D,
    player: two_d::Sprite2D,
    anim: two_d::AnimationPlayer2D,
    controls: ActionMap,
    // MISSING: store atlas handle for facing swaps
}

impl Game for SpriteCharGame {
    async fn init(ctx: &mut InitContext) -> Result<Self> {
        let scene = two_d::Scene2D::new()?;
        let camera = two_d::Camera2D::new()?;
        camera.position()?.set(240.0, 135.0)?;
        // TODO: camera.set_zoom(2.0)
        let renderer = two_d::Renderer2D::new()?;
        ctx.surface().attach_renderer(&renderer)?;

        // abi: load_sprite_atlas — not RGSP1 catalog ids
        let atlas = ctx
            .assets()
            .load_sprite_atlas("lpc/characters/hero/atlas.json")
            .await?;

        let player = two_d::Sprite2D::new(&atlas.region("walk-down-0")?)?;
        player.anchor()?.set(0.5, 1.0)?;
        player.position()?.set(240.0, 180.0)?;
        scene.add(&player)?;

        let anim = two_d::AnimationPlayer2D::new(&player)?;
        anim.play(
            &atlas.animation("walk-down")?,
            two_d::PlayOptions {
                looping: true,
                frames_per_second: 9.0,
            },
        )?;

        let controls = ctx.input().create_action_map(
            ActionMap::builder()
                .axis_1d("move_x")
                .keyboard(Key::ArrowLeft, Key::ArrowRight)
                .gamepad_axis(GamepadAxis::LeftStickX)
                .finish()
                .axis_1d("move_y")
                .keyboard(Key::ArrowUp, Key::ArrowDown)
                .gamepad_axis(GamepadAxis::LeftStickY)
                .finish()
                .build(),
        )?;

        Ok(Self {
            scene,
            camera,
            renderer,
            player,
            anim,
            controls,
        })
    }

    fn update(&mut self, _ctx: &mut GameContext, frame: FrameInfo) -> Result<()> {
        let dx = self.controls.axis_1d("move_x")?;
        let dy = self.controls.axis_1d("move_y")?;
        let pos = self.player.position()?;
        // HACK: Vector2Ref API — set from components after read
        self.player.position()?.set(
            pos.x + dx * 80.0 * frame.delta_seconds,
            pos.y + dy * 80.0 * frame.delta_seconds,
        )?;

        // TODO: facing → anim.play(walk-*)
        let _ = &self.anim;

        self.camera
            .position()?
            .set(self.player.position()?.x, self.player.position()?.y)?;
        self.renderer.render(&self.scene, &self.camera)?;
        Ok(())
    }
}

ranger_wasm::export_game!(SpriteCharGame);
// NOT sprite_game! / RGSP1 exports — retired after D-2D-10
