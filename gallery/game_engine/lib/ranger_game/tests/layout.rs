//! Byte-layout tests: assert the crate writes exactly the bytes the shipped
//! headers (`wasm/wasm_sprite_abi.h`, `wasm_game_abi.h`, `wasm_ui_abi.h`)
//! define, at the exact offsets a host reads. These run on the host target;
//! the blocks are the same statics the wasm guest exposes.
//!
//! NOTE: the blocks are process-global, so each block gets ONE test function
//! (Rust runs tests in threads); sub-cases run sequentially inside it.

use ranger_game::input::Buttons;
use ranger_game::{fp, sprite, ui, world};

#[test]
fn sprite_block_layout() {
    // Offsets from wasm_sprite_abi.h.
    const OFF_MAGIC: usize = 0;
    const OFF_VERSION: usize = 4;
    const OFF_SIZE: usize = 8;
    const OFF_DT: usize = 12;
    const OFF_CHAR_COUNT: usize = 20;
    const OFF_SLOT_COUNT: usize = 24;
    const OFF_INPUT: usize = 28;
    const OFF_VIEW_W: usize = 36;
    const OFF_VIEW_H: usize = 40;
    const OFF_MODE: usize = 44;
    const OFF_SLOTS: usize = 64;
    const OFF_CAT_IDS: usize = 2112;

    sprite::__init_block();
    assert_eq!(
        sprite::__read_i32(OFF_MAGIC) as u32,
        0x5053_4752,
        "magic 'RGSP'"
    );
    assert_eq!(sprite::__read_i32(OFF_VERSION), 1);
    assert_eq!(sprite::__read_i32(OFF_SIZE), 2560);
    assert_eq!(sprite::__read_i32(OFF_MODE), 0, "init mode = menu");

    // Host writes a frame; guest sees it typed, with defaults applied.
    sprite::__write_i32(OFF_DT, 16);
    sprite::__write_i32(OFF_INPUT, 16); // ACTION down
    sprite::__write_i32(OFF_VIEW_W, 0); // host has not sized the view yet
    sprite::__write_i32(OFF_VIEW_H, 0);
    sprite::__write_i32(OFF_CHAR_COUNT, 2);
    sprite::__write_i32(OFF_CAT_IDS, 7);
    sprite::__write_i32(OFF_CAT_IDS + 4, 9);

    let (frame, mut scene) = sprite::__begin_tick();
    assert_eq!(frame.dt_ms, 16);
    assert_eq!((frame.view_w, frame.view_h), (480, 270), "view defaults");
    assert_eq!(frame.catalog_id(0), 7);
    assert_eq!(frame.catalog_id(1), 9);
    assert_eq!(frame.catalog_id(2), 0, "out of range -> 0");
    assert!(frame.input.held(Buttons::ACTION));
    assert!(frame.input.pressed(Buttons::ACTION), "edge on first press");

    scene.push(
        sprite::Slot::character(3)
            .anim(sprite::Anim::Jump)
            .dir(sprite::Dir::Right)
            .at(100, 80)
            .clock(250)
            .flip_x(),
    );
    scene.set_mode(sprite::Mode::Play);
    sprite::__end_tick(scene);

    assert_eq!(sprite::__read_i32(OFF_SLOT_COUNT), 1);
    assert_eq!(sprite::__read_i32(OFF_MODE), 1);
    let s = |f: usize| sprite::__read_i32(OFF_SLOTS + f);
    assert_eq!(s(0), 3, "charId");
    assert_eq!(s(4), 2, "anim jump");
    assert_eq!(s(8), 3, "dir right");
    assert_eq!(s(12), 1 | 4, "ACTIVE | FLIP_X");
    assert_eq!(s(16), 100 * 256, "xFp");
    assert_eq!(s(20), 80 * 256, "yFp");
    assert_eq!(s(24), 250, "clock");

    // Held button is NOT an edge on the next tick.
    let (frame2, scene2) = sprite::__begin_tick();
    assert!(frame2.input.held(Buttons::ACTION));
    assert!(!frame2.input.pressed(Buttons::ACTION));
    assert_eq!(
        sprite::__read_i32(OFF_SLOT_COUNT),
        1,
        "old count until end_tick"
    );
    sprite::__end_tick(scene2);
    assert_eq!(sprite::__read_i32(OFF_SLOT_COUNT), 0, "no slots pushed");

    // Release edge.
    sprite::__write_i32(OFF_INPUT, 0);
    let (frame3, scene3) = sprite::__begin_tick();
    assert!(frame3.input.released(Buttons::ACTION));
    sprite::__end_tick(scene3);
}

#[test]
fn world_block_layout() {
    // Offsets from wasm_game_abi.h.
    const OFF_DT: usize = 12;
    const OFF_INPUT: usize = 20;
    const OFF_BODY_COUNT: usize = 28;
    const OFF_IMPULSE_CNT: usize = 32;
    const OFF_CONTACT_CNT: usize = 36;
    const OFF_SCORE: usize = 40;
    const OFF_CAMERA_Y: usize = 48;
    const OFF_EVENT_CNT: usize = 52;
    const OFF_BODIES: usize = 64;
    const OFF_CONTROLS: usize = 832;
    const OFF_IMPULSES: usize = 1344;
    const OFF_CONTACTS: usize = 1600;
    const OFF_EVENTS: usize = 2048;

    world::__init_block();
    assert_eq!(world::__read_i32(0) as u32, 0x3157_4752, "magic 'RGW1'");
    assert_eq!(world::__read_i32(4), 1);
    assert_eq!(world::__read_i32(8), 2560);

    // init-style writes.
    let mut w = world::__world();
    w.set_body_count(3);
    w.set_body_pos(1, fp(50), fp(60));
    w.set_control(2, -1000, 450, 0, 987);
    w.set_score(120);
    w.set_camera_y(fp(500));
    assert!(w.push_impulse(1, 11, -22, 33));
    assert!(w.sound(2));
    assert!(w.push_event(world::event::PARTICLES, 0, fp(1), fp(2), 5));
    world::__end_update(w);

    assert_eq!(world::__read_i32(OFF_BODY_COUNT), 3);
    assert_eq!(world::__read_i32(OFF_BODIES + 24 + 0), fp(50), "body1 x");
    assert_eq!(world::__read_i32(OFF_BODIES + 24 + 4), fp(60), "body1 y");
    assert_eq!(world::__read_i32(OFF_CONTROLS + 2 * 16 + 0), -1000, "ch0");
    assert_eq!(world::__read_i32(OFF_CONTROLS + 2 * 16 + 12), 987, "ch3");
    assert_eq!(world::__read_i32(OFF_SCORE), 120);
    assert_eq!(world::__read_i32(OFF_CAMERA_Y), fp(500));
    assert_eq!(world::__read_i32(OFF_IMPULSE_CNT), 1);
    assert_eq!(world::__read_i32(OFF_IMPULSES + 0), 1, "impulse body");
    assert_eq!(world::__read_i32(OFF_IMPULSES + 4), 11);
    assert_eq!(world::__read_i32(OFF_IMPULSES + 8), -22);
    assert_eq!(world::__read_i32(OFF_IMPULSES + 12), 33, "angular");
    assert_eq!(world::__read_i32(OFF_EVENT_CNT), 2);
    assert_eq!(world::__read_i32(OFF_EVENTS + 0), 1, "kind sound");
    assert_eq!(world::__read_i32(OFF_EVENTS + 4), 2, "sound sub id");
    assert_eq!(world::__read_i32(OFF_EVENTS + 20 + 0), 3, "kind particles");
    assert_eq!(world::__read_i32(OFF_EVENTS + 20 + 16), 5, "payload c");

    // Host writes a frame + a contact; guest reads them typed.
    world::__write_i32(OFF_DT, 16);
    world::__write_i32(OFF_INPUT, 4 | 1); // LEFT + UP
    world::__write_i32(OFF_CONTACT_CNT, 1);
    world::__write_i32(OFF_CONTACTS + 0, 0); // bodyA code
    world::__write_i32(OFF_CONTACTS + 4, 1001); // bodyB code
    world::__write_i32(OFF_CONTACTS + 8, world::contact_phase::BEGIN);
    world::__write_i32(OFF_CONTACTS + 12, 999);
    world::__write_i32(OFF_CONTACTS + 24, -1000);

    let (frame, w2) = world::__begin_update();
    assert_eq!(frame.dt_ms, 16);
    assert!(frame.input.held(Buttons::LEFT));
    assert!(frame.input.pressed(Buttons::UP));
    let contacts: Vec<world::Contact> = w2.contacts().collect();
    assert_eq!(contacts.len(), 1);
    assert_eq!(contacts[0].body_b, 1001);
    assert_eq!(contacts[0].phase, world::contact_phase::BEGIN);
    assert_eq!(contacts[0].impulse_fp, 999);
    assert_eq!(contacts[0].nx_milli, -1000);
    // A frame with no pushes publishes zero counts.
    world::__end_update(w2);
    assert_eq!(world::__read_i32(OFF_IMPULSE_CNT), 0);
    assert_eq!(world::__read_i32(OFF_EVENT_CNT), 0);
}

#[test]
fn ui_document_layout() {
    // Offsets from wasm_ui_abi.h.
    const OFF_REVISION: usize = 8;
    const OFF_ROOT_ID: usize = 12;
    const OFF_NODE_COUNT: usize = 20;
    const OFF_PROP_COUNT: usize = 28;
    const OFF_STRING_SIZE: usize = 36;
    const OFF_FLAGS: usize = 40;
    const NODES: usize = 64;
    const PROPS: usize = 2112;
    const STRINGS: usize = 4160;

    ui::reset();
    let mut card = ui::root(1);
    card.column().center().pad(12).bg(36, 42, 64, 255);
    let title = card.label(2, "Menu").font(20).color(255, 255, 255, 255);
    assert_eq!(title.id(), 2);
    let mut btn = card.button(3);
    btn.width(180);
    btn.label(4, "Go").text_center();
    ui::finish(7);

    assert_eq!(ui::__read_i32(0) as u32, 0x3155_4752, "magic 'RGU1'");
    assert_eq!(ui::__read_i32(OFF_REVISION), 7);
    assert_eq!(ui::__read_i32(OFF_ROOT_ID), 1);
    assert_eq!(ui::__read_i32(OFF_NODE_COUNT), 4);
    assert_eq!(ui::__read_i32(OFF_FLAGS), 1, "VALID");
    assert_eq!(ui::revision(), 7);

    // node 0: root VIEW, parent 0, order 0, 4 props (column/center/pad/bg)
    assert_eq!(ui::__read_i32(NODES + 0), 1, "root id");
    assert_eq!(ui::__read_u16(NODES + 8), 1, "kind VIEW");
    assert_eq!(ui::__read_u16(NODES + 16), 4, "root prop count");
    // node 1: TEXT child of 1, order 0, props: text/font/color
    assert_eq!(ui::__read_i32(NODES + 32), 2);
    assert_eq!(ui::__read_i32(NODES + 32 + 4), 1, "parent");
    assert_eq!(ui::__read_u16(NODES + 32 + 8), 2, "kind TEXT");
    assert_eq!(ui::__read_u16(NODES + 32 + 18), 0, "child order");
    assert_eq!(ui::__read_u16(NODES + 32 + 16), 3, "text/font/color");
    // node 2: BUTTON child of 1, order 1
    assert_eq!(ui::__read_u16(NODES + 64 + 8), 5, "kind BUTTON");
    assert_eq!(ui::__read_u16(NODES + 64 + 18), 1, "child order");
    // node 3: caption TEXT child of 3, order 0
    assert_eq!(ui::__read_i32(NODES + 96 + 4), 3, "caption parent = button");

    // prop 0 = flex-direction column on root: key 21, type ENUM(7), value 1.
    assert_eq!(ui::__read_u16(PROPS + 0), 21);
    assert_eq!(ui::__read_i32(PROPS + 4), 1);
    // prop 3 = root bg color 0x242A40FF.
    assert_eq!(ui::__read_u16(PROPS + 3 * 16), 2, "key BACKGROUND");
    assert_eq!(ui::__read_i32(PROPS + 3 * 16 + 4) as u32, 0x242A_40FF);
    // prop 4 = title text -> string table offset 0, len 4, bytes "Menu".
    assert_eq!(ui::__read_u16(PROPS + 4 * 16), 1, "key TEXT");
    assert_eq!(ui::__read_i32(PROPS + 4 * 16 + 4), 0, "string offset");
    assert_eq!(ui::__read_i32(PROPS + 4 * 16 + 8), 4, "string len");
    let m = (0..4)
        .map(|i| (ui::__read_i32(STRINGS + i) & 0xff) as u8)
        .collect::<Vec<u8>>();
    assert_eq!(&m, b"Menu");
    assert_eq!(ui::__read_i32(OFF_STRING_SIZE), 4 + 2, "\"Menu\" + \"Go\"");
    // 4 on root + 3 on title + 1 on button + 2 on caption.
    assert_eq!(ui::__read_i32(OFF_PROP_COUNT), 10);
}
