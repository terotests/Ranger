//! Linear ABI autopeli logic (traffic AI + player controls).
//! Host runs GamePhysics; this module reads/writes the shared ABI block.

mod ui;

pub const ABI_MAGIC: i32 = 0x3157_4752; // 'RGW1'
pub const ABI_VERSION: i32 = 1;
pub const ABI_SIZE: i32 = 2560;
pub const FP: i32 = 256;
pub const STEER_SCALE: i32 = 1000;

pub const OFF_MAGIC: i32 = 0;
pub const OFF_VERSION: i32 = 4;
pub const OFF_SIZE: i32 = 8;
pub const OFF_DT: i32 = 12;
pub const OFF_TIME: i32 = 16;
pub const OFF_INPUT: i32 = 20;
pub const OFF_INPUT_P2: i32 = 24;
pub const OFF_BODY_COUNT: i32 = 28;
pub const OFF_IMPULSE_CNT: i32 = 32;
pub const OFF_CONTACT_CNT: i32 = 36;
pub const OFF_SCORE: i32 = 40;
pub const OFF_HITS: i32 = 44;
pub const OFF_CAMERA_Y: i32 = 48;
pub const OFF_EVENT_CNT: i32 = 52;
pub const OFF_AIR_P1: i32 = 56;
pub const OFF_AIR_P2: i32 = 60;

pub const OFF_BODIES: i32 = 64;
pub const BODY_SIZE: i32 = 24;
pub const OFF_CONTROLS: i32 = 832;
pub const CTRL_SIZE: i32 = 16;
pub const OFF_IMPULSES: i32 = 1344;
pub const IMPULSE_SIZE: i32 = 16;
pub const OFF_CONTACTS: i32 = 1600;
pub const CONTACT_SIZE: i32 = 32;
pub const OFF_EVENTS: i32 = 2048;
pub const EVENT_SIZE: i32 = 20;
pub const MAX_CONTACTS: i32 = 14;
pub const MAX_IMPULSES: i32 = 16;
pub const MAX_EVENTS: i32 = 12;

pub const ID_WALL_L: i32 = 1000;
pub const ID_WALL_R: i32 = 1001;

pub const EVT_SOUND: i32 = 1;
pub const EVT_RUMBLE: i32 = 2;
pub const EVT_PARTICLES: i32 = 3;
pub const SND_WALL: i32 = 1;
pub const SND_BOUNCE: i32 = 2;
pub const SND_WIN: i32 = 3;

const CAR_MASS: i32 = 1200;
const CONE_MASS: i32 = 3;
const WIN_SCORE: i32 = 5000;
const FINISH_Y: i32 = 140;
const BRAKE_SCREECH_CD_MS: i32 = 900;
const BRAKE_SCREECH_MIN_SPD: i32 = 18;
const OIL_EFFECT_MS: i32 = 260;
const OIL_RECOVER_MS: i32 = 380;

pub const BODY_P1: i32 = 0;
pub const BODY_P2: i32 = 1;
pub const TRAFFIC_START: i32 = 2;
pub const TRAFFIC_COUNT: i32 = 15;
pub const BODY_COUNT: i32 = 2 + TRAFFIC_COUNT;

pub const IN_UP: i32 = 1;
pub const IN_DOWN: i32 = 2;
pub const IN_LEFT: i32 = 4;
pub const IN_RIGHT: i32 = 8;

static mut ABI: [u8; 2560] = [0u8; 2560];
static mut RAMP_CD_P1: i32 = 0;
static mut RAMP_CD_P2: i32 = 0;
static mut BRAKE_CD_P1: i32 = 0;
static mut BRAKE_CD_P2: i32 = 0;
static mut SOMEONE_WON: bool = false;
static mut AIR_P1: i32 = 0;
static mut AIR_P2: i32 = 0;
static mut OIL_CD_P1: i32 = 0;
static mut OIL_CD_P2: i32 = 0;
static mut OIL_RECOVER_P1: i32 = 0;
static mut OIL_RECOVER_P2: i32 = 0;
static mut OIL_WAS_P1: bool = false;
static mut OIL_WAS_P2: bool = false;
static mut EVENT_WRITE: i32 = 0;

// ---- RGU1 UI document (retained-mode HUD) ------------------------------
// The HUD is authored from data the guest already sees each frame: per-player
// collision counts + last-collision type (from the contact stream the host
// writes into the ABI before update()), computed surface grip, and boost.
static mut UI_BUF: [u8; ui::UI_SIZE] = [0u8; ui::UI_SIZE];
static mut UI_REV: u32 = 0;
static mut UI_LAST_SIG: i32 = -1;

const HIT_FLASH_MS: i32 = 260;

// Per-player HUD state.
static mut HITS_P1: i32 = 0;
static mut HITS_P2: i32 = 0;
static mut LAST_HIT_P1: i32 = 0; // 0 none,1 wall,2 bar,3 car,4 cone
static mut LAST_HIT_P2: i32 = 0;
static mut FLASH_P1: i32 = 0; // ms remaining on the crash flash
static mut FLASH_P2: i32 = 0;
static mut GRIP_P1: i32 = 0; // 0..1000
static mut GRIP_P2: i32 = 0;

/// Record a player collision for the HUD (called from process_contacts).
fn hud_note_hit(player: i32, other: i32) {
    let kind = if is_wall(other) {
        1
    } else if is_bar(other) {
        2
    } else if is_traffic(other) {
        3
    } else if is_cone(other) {
        4
    } else {
        0
    };
    if kind == 0 {
        return;
    }
    unsafe {
        // Cone (kind 4) is a light bump: show the label but don't count it as a
        // hit or flash the counter red.
        if player == BODY_P1 {
            LAST_HIT_P1 = kind;
            if kind != 4 {
                HITS_P1 += 1;
                FLASH_P1 = HIT_FLASH_MS;
            }
        } else if player == BODY_P2 {
            LAST_HIT_P2 = kind;
            if kind != 4 {
                HITS_P2 += 1;
                FLASH_P2 = HIT_FLASH_MS;
            }
        }
    }
}

/// A small signature of everything the HUD renders, so revision only bumps when
/// the displayed content actually changes (snapshot-first).
fn hud_signature(p1: ui::PlayerHud, p2: ui::PlayerHud) -> i32 {
    let mut s: i32 = 17;
    let mut mix = |v: i32| {
        s = s.wrapping_mul(31).wrapping_add(v);
    };
    mix(p1.hits);
    mix(p1.last_hit);
    mix(p1.grip / 10);
    mix(p1.boost as i32);
    mix(p1.flash as i32);
    mix(p2.hits);
    mix(p2.last_hit);
    mix(p2.grip / 10);
    mix(p2.boost as i32);
    mix(p2.flash as i32);
    s
}

/// Rebuild the HUD document only when its rendered content changed, bumping
/// `revision` so the host can skip identical frames.
fn ui_refresh() {
    unsafe {
        let p1 = ui::PlayerHud {
            hits: HITS_P1,
            last_hit: LAST_HIT_P1,
            grip: GRIP_P1,
            boost: AIR_P1 > 0,
            flash: FLASH_P1 > 0,
        };
        let p2 = ui::PlayerHud {
            hits: HITS_P2,
            last_hit: LAST_HIT_P2,
            grip: GRIP_P2,
            boost: AIR_P2 > 0,
            flash: FLASH_P2 > 0,
        };
        let sig = hud_signature(p1, p2);
        if sig != UI_LAST_SIG {
            UI_LAST_SIG = sig;
            UI_REV += 1;
            ui::build_hud_into(&mut UI_BUF, p1, p2, UI_REV);
        }
    }
}

#[no_mangle]
pub extern "C" fn rg_ui_ptr() -> i32 {
    unsafe { UI_BUF.as_ptr() as i32 }
}

#[no_mangle]
pub extern "C" fn rg_ui_size() -> i32 {
    ui::UI_SIZE as i32
}

#[no_mangle]
pub extern "C" fn rg_ui_revision() -> i32 {
    unsafe { UI_REV as i32 }
}

struct RoadPt {
    y: i32,
    x: i32,
    half: i32,
}

const ROAD: [RoadPt; 16] = [
    RoadPt { y: 6000, x: 240, half: 126 },
    RoadPt { y: 5600, x: 220, half: 104 },
    RoadPt { y: 5200, x: 200, half: 78 },
    RoadPt { y: 4800, x: 250, half: 96 },
    RoadPt { y: 4400, x: 300, half: 114 },
    RoadPt { y: 4000, x: 255, half: 94 },
    RoadPt { y: 3600, x: 210, half: 108 },
    RoadPt { y: 3200, x: 250, half: 94 },
    RoadPt { y: 2800, x: 310, half: 110 },
    RoadPt { y: 2400, x: 250, half: 92 },
    RoadPt { y: 2000, x: 170, half: 98 },
    RoadPt { y: 1600, x: 220, half: 90 },
    RoadPt { y: 1200, x: 290, half: 104 },
    RoadPt { y: 800, x: 250, half: 88 },
    RoadPt { y: 400, x: 210, half: 74 },
    RoadPt { y: 100, x: 240, half: 112 },
];

struct OilPatch {
    y: i32,
    lane_milli: i32,
    r: i32,
}

const OIL: [OilPatch; 9] = [
    OilPatch { y: 5460, lane_milli: 350, r: 34 },
    OilPatch { y: 5050, lane_milli: -450, r: 30 },
    OilPatch { y: 4300, lane_milli: 420, r: 38 },
    OilPatch { y: 3740, lane_milli: -280, r: 32 },
    OilPatch { y: 3060, lane_milli: 500, r: 36 },
    OilPatch { y: 2480, lane_milli: -500, r: 40 },
    OilPatch { y: 1780, lane_milli: 340, r: 34 },
    OilPatch { y: 1080, lane_milli: -350, r: 31 },
    OilPatch { y: 560, lane_milli: 250, r: 28 },
];

struct RampDef {
    y: i32,
    lane_milli: i32,
    w: i32,
    h: i32,
}

const RAMPS: [RampDef; 5] = [
    RampDef { y: 5350, lane_milli: 50, w: 38, h: 22 },
    RampDef { y: 4720, lane_milli: -420, w: 34, h: 20 },
    RampDef { y: 3500, lane_milli: 380, w: 40, h: 22 },
    RampDef { y: 2640, lane_milli: -350, w: 38, h: 20 },
    RampDef { y: 1160, lane_milli: 320, w: 36, h: 20 },
];

struct TrafficDef {
    y: i32,
    lane_milli: i32,
    throttle_milli: i32,
    weave: i32,
    weave_speed_milli: i32,
    phase_milli: i32,
}

const TRAFFIC: [TrafficDef; 15] = [
    TrafficDef { y: 5520, lane_milli: -580, throttle_milli: 450, weave: 4, weave_speed_milli: 1, phase_milli: 200 },
    TrafficDef { y: 5260, lane_milli: 500, throttle_milli: 390, weave: 7, weave_speed_milli: 1, phase_milli: 1400 },
    TrafficDef { y: 4930, lane_milli: -180, throttle_milli: 490, weave: 3, weave_speed_milli: 2, phase_milli: 2200 },
    TrafficDef { y: 4590, lane_milli: 620, throttle_milli: 420, weave: 5, weave_speed_milli: 1, phase_milli: 3100 },
    TrafficDef { y: 4270, lane_milli: -580, throttle_milli: 520, weave: 4, weave_speed_milli: 1, phase_milli: 4500 },
    TrafficDef { y: 3950, lane_milli: 200, throttle_milli: 370, weave: 8, weave_speed_milli: 1, phase_milli: 800 },
    TrafficDef { y: 3610, lane_milli: -620, throttle_milli: 470, weave: 4, weave_speed_milli: 1, phase_milli: 5400 },
    TrafficDef { y: 3280, lane_milli: 580, throttle_milli: 430, weave: 6, weave_speed_milli: 1, phase_milli: 2700 },
    TrafficDef { y: 2940, lane_milli: -100, throttle_milli: 540, weave: 3, weave_speed_milli: 2, phase_milli: 1900 },
    TrafficDef { y: 2570, lane_milli: 620, throttle_milli: 400, weave: 7, weave_speed_milli: 1, phase_milli: 3800 },
    TrafficDef { y: 2190, lane_milli: -580, throttle_milli: 500, weave: 5, weave_speed_milli: 1, phase_milli: 5900 },
    TrafficDef { y: 1810, lane_milli: 260, throttle_milli: 380, weave: 8, weave_speed_milli: 1, phase_milli: 4100 },
    TrafficDef { y: 1420, lane_milli: -620, throttle_milli: 460, weave: 4, weave_speed_milli: 1, phase_milli: 500 },
    TrafficDef { y: 1040, lane_milli: 580, throttle_milli: 510, weave: 5, weave_speed_milli: 1, phase_milli: 2900 },
    TrafficDef { y: 650, lane_milli: -200, throttle_milli: 420, weave: 7, weave_speed_milli: 1, phase_milli: 5100 },
];

fn rd_i32(off: i32) -> i32 {
    unsafe {
        let p = ABI.as_ptr().add(off as usize) as *const i32;
        core::ptr::read_unaligned(p)
    }
}

fn wr_i32(off: i32, v: i32) {
    unsafe {
        let p = ABI.as_ptr().add(off as usize) as *mut i32;
        core::ptr::write_unaligned(p, v);
    }
}

fn clamp(v: i32, lo: i32, hi: i32) -> i32 {
    if v < lo { lo } else if v > hi { hi } else { v }
}

fn clamp_f(v: f64, lo: f64, hi: f64) -> f64 {
    if v < lo { lo } else if v > hi { hi } else { v }
}

fn decay_timer(t: i32, dt: i32) -> i32 {
    let next = t - dt;
    if next < 0 { 0 } else { next }
}

fn sin_milli(phase_milli: i64) -> i32 {
    let x = (phase_milli % 6283) as f64 / 1000.0;
    let x2 = x * x;
    let x3 = x2 * x;
    let x5 = x3 * x2;
    (x - x3 / 6.0 + x5 / 120.0) as i32 * 1000
}

fn sin_f(x: f64) -> f64 {
    let x2 = x * x;
    let x3 = x2 * x;
    let x5 = x3 * x2;
    x - x3 / 6.0 + x5 / 120.0
}

fn road_at(y_fp: i32) -> (i32, i32) {
    let y = y_fp / FP;
    let first = &ROAD[0];
    if y >= first.y {
        return (first.x * FP, first.half * FP);
    }
    let last = &ROAD[15];
    if y <= last.y {
        return (last.x * FP, last.half * FP);
    }
    let mut i = ((first.y - y) / 400) as usize;
    if i > 14 { i = 14; }
    let a = &ROAD[i];
    let b = &ROAD[i + 1];
    let span = a.y - b.y;
    let mut t = 0i32;
    if span > 0 {
        t = ((a.y - y) * FP) / span;
    }
    let cx = a.x * FP + (b.x * FP - a.x * FP) * t / FP;
    let half = a.half * FP + (b.half * FP - a.half * FP) * t / FP;
    (cx, half)
}

fn lane_x(y: i32, lane_milli: i32, margin: i32) -> i32 {
    let (cx, half) = road_at(y * FP);
    let usable = half - margin * FP;
    cx + usable * clamp(lane_milli, -1000, 1000) / 1000
}

fn body_x(idx: i32) -> i32 {
    rd_i32(OFF_BODIES + idx * BODY_SIZE)
}

fn body_y(idx: i32) -> i32 {
    rd_i32(OFF_BODIES + idx * BODY_SIZE + 4)
}

fn body_speed(idx: i32) -> i32 {
    rd_i32(OFF_BODIES + idx * BODY_SIZE + 12)
}

fn body_ang_vel_fp(idx: i32) -> i32 {
    rd_i32(OFF_BODIES + idx * BODY_SIZE + 16)
}

fn write_control(idx: i32, steer: i32, throttle: i32, brake: i32, grip: i32) {
    let base = OFF_CONTROLS + idx * CTRL_SIZE;
    wr_i32(base, steer);
    wr_i32(base + 4, throttle);
    wr_i32(base + 8, brake);
    wr_i32(base + 12, grip);
}

fn push_event(kind: i32, sub: i32, a: i32, b: i32, c: i32) {
    unsafe {
        if EVENT_WRITE >= MAX_EVENTS {
            return;
        }
        let base = OFF_EVENTS + EVENT_WRITE * EVENT_SIZE;
        wr_i32(base, kind);
        wr_i32(base + 4, sub);
        wr_i32(base + 8, a);
        wr_i32(base + 12, b);
        wr_i32(base + 16, c);
        EVENT_WRITE += 1;
    }
}

fn push_sound(id: i32) {
    push_event(EVT_SOUND, id, 0, 0, 0);
}

fn push_particles(x_fp: i32, y_fp: i32, amount: i32) {
    push_event(EVT_PARTICLES, 0, x_fp, y_fp, amount);
}

fn push_rumble(pad: i32, ms: i32, strength: i32) {
    push_event(EVT_RUMBLE, pad, strength, strength, ms);
}

fn drive_from_input(flags: i32) -> (i32, i32, i32) {
    let mut steer = 0;
    let mut throttle = 0;
    let mut brake = 0;
    if (flags & IN_LEFT) != 0 { steer = -STEER_SCALE; }
    if (flags & IN_RIGHT) != 0 { steer = STEER_SCALE; }
    if (flags & IN_UP) != 0 { throttle = STEER_SCALE; }
    if (flags & IN_DOWN) != 0 { brake = STEER_SCALE; }
    (steer, throttle, brake)
}

fn patch_x(o: &OilPatch) -> i32 {
    lane_x(o.y, o.lane_milli, 18)
}

fn on_oil(x_fp: i32, y_fp: i32) -> bool {
    let y = y_fp / FP;
    let mut i = 0;
    while i < OIL.len() {
        let o = &OIL[i];
        let px = patch_x(o);
        let dx = (x_fp - px) as f64 / FP as f64;
        let dy = (y - o.y) as f64;
        if dx * dx + dy * dy < (o.r * o.r) as f64 {
            return true;
        }
        i += 1;
    }
    false
}

fn road_grip_milli(x_fp: i32, y_fp: i32) -> i32 {
    let (cx, half) = road_at(y_fp);
    let edge = half - 16 * FP;
    let off = x_fp - cx;
    let mut grip = 1000;
    if off < 0 {
        if -off > edge { grip = 450; }
    } else if off > edge {
        grip = 450;
    }
    grip
}

fn oil_cd_for(idx: i32) -> i32 {
    unsafe {
        if idx == BODY_P2 {
            OIL_CD_P2
        } else {
            OIL_CD_P1
        }
    }
}

fn oil_recover_for(idx: i32) -> i32 {
    unsafe {
        if idx == BODY_P2 {
            OIL_RECOVER_P2
        } else {
            OIL_RECOVER_P1
        }
    }
}

fn surface_grip_for_player(idx: i32, x_fp: i32, y_fp: i32) -> i32 {
    let grip = road_grip_milli(x_fp, y_fp);
    if idx > BODY_P2 && on_oil(x_fp, y_fp) && grip > 500 {
        return 500;
    }
    grip
}

fn oil_entry_spin(idx: i32, steer: i32, now: i32) -> i32 {
    let mut spd_f = body_speed(idx) as f64 / FP as f64;
    if spd_f < 40.0 {
        spd_f = 40.0;
    }
    let x = body_x(idx) as f64 / FP as f64;
    let y = body_y(idx) as f64 / FP as f64;
    let phase = now as f64 * 0.012 + x * 0.06 + y * 0.04;
    let sign = if sin_f(phase) >= 0.0 { 1.0 } else { -1.0 };
    let wobble = sin_f(phase) * spd_f * 0.08;
    let steer_spin = (steer as f64 / STEER_SCALE as f64) * spd_f * 0.12;
    ((wobble + steer_spin + sign * 22.0) * FP as f64) as i32
}

fn spin_stabilizer_fp(idx: i32, oil_recover: bool) -> i32 {
    let av_fp = body_ang_vel_fp(idx);
    let av = av_fp as f64 / FP as f64;
    let mut abs = av;
    if abs < 0.0 { abs = -abs; }
    let (start, full, base, span) = if oil_recover {
        (35.0, 180.0, 0.28, 0.42)
    } else {
        (200.0, 420.0, 0.10, 0.20)
    };
    if abs < start { return 0; }
    let mut t = (abs - start) / (full - start);
    t = clamp_f(t, 0.0, 1.0);
    let strength = base + t * span;
    (-av * strength * FP as f64) as i32
}

fn hit_ramp(x_fp: i32, y_fp: i32) -> bool {
    let y = y_fp / FP;
    let half_w = |w: i32| (w * FP) / 2;
    let mut i = 0;
    while i < RAMPS.len() {
        let r = &RAMPS[i];
        let rx = lane_x(r.y, r.lane_milli, 24);
        let hw = half_w(r.w);
        if x_fp >= rx - hw && x_fp <= rx + hw {
            if y >= r.y && y <= r.y + r.h {
                return true;
            }
        }
        i += 1;
    }
    false
}

fn collision_rumble(player: i32, imp_fp: i32, kind: i32) {
    let imp = imp_fp as f64 / FP as f64;
    if imp < 22.0 {
        return;
    }
    let pad = if player == BODY_P2 { 1 } else { 0 };
    let (ms, strength) = if kind == 1 {
        (38, 6500 + clamp(((imp * 40.0) as i32), 0, 9000))
    } else if kind == 2 {
        (55 + clamp(((imp * 0.35) as i32), 0, 100), 12000 + clamp(((imp * 70.0) as i32), 0, 18000))
    } else {
        (60 + clamp(((imp * 0.45) as i32), 0, 130), 14000 + clamp(((imp * 90.0) as i32), 0, 24000))
    };
    push_rumble(pad, ms, strength);
}

fn push_collision_feedback(player: i32, other: i32, imp_fp: i32, _x_fp: i32, _y_fp: i32) {
    if is_wall(other) || is_bar(other) || is_traffic(other) {
        let imp = imp_fp as f64 / FP as f64;
        if imp >= 18.0 {
            push_sound(SND_WALL);
        }
        let kind = if is_traffic(other) { 2 } else { 0 };
        collision_rumble(player, imp_fp, kind);
        return;
    }
    if is_cone(other) {
        push_sound(SND_BOUNCE);
        collision_rumble(player, imp_fp, 1);
    }
}

fn tick_brake_audio(player: i32, brake: i32, cd: &mut i32, dt: i32) {
    *cd = decay_timer(*cd, dt);
    if brake <= 0 || *cd > 0 {
        return;
    }
    let spd = body_speed(player);
    if spd / FP >= BRAKE_SCREECH_MIN_SPD {
        push_sound(SND_BOUNCE);
        *cd = BRAKE_SCREECH_CD_MS;
    }
}

fn traffic_control(idx: i32, t: &TrafficDef, now: i32) -> (i32, i32, i32, i32) {
    let bx = body_x(idx);
    let by = body_y(idx);
    let look_y = by - 115 * FP;
    let (cx, half) = road_at(look_y);
    let phase = now as i64 * t.weave_speed_milli as i64 * 12 / 10000 + t.phase_milli as i64;
    let wave = sin_milli(phase) * t.weave / 1000;
    let target_x = cx + (half - 23 * FP) * t.lane_milli / 1000 + wave * FP;
    let error = target_x - bx;
    let mut steer = clamp(error / 34, -STEER_SCALE, STEER_SCALE);
    let (here_cx, here_half) = road_at(by);
    let safe_l = here_cx - here_half + 16 * FP;
    let safe_r = here_cx + here_half - 16 * FP;
    if bx < safe_l { steer = STEER_SCALE; }
    if bx > safe_r { steer = -STEER_SCALE; }
    let grip = surface_grip_for_player(idx, bx, by);
    (steer, t.throttle_milli, 0, grip)
}

// Host imports (module "env") — linked by the wasm3 bridge. The module calls
// these during declare_resources() so the host loads assets through GameHost.
#[link(wasm_import_module = "env")]
extern "C" {
    fn rg_host_register_sheet(
        id_ptr: i32,
        id_len: i32,
        path_ptr: i32,
        path_len: i32,
        fw: i32,
        fh: i32,
        scale: i32,
        feet: i32,
        draw_layer: i32,
    );
    fn rg_host_register_rect(
        id_ptr: i32,
        id_len: i32,
        w: i32,
        h: i32,
        r: i32,
        g: i32,
        b: i32,
        draw_layer: i32,
    );
}

fn host_sheet(id: &str, path: &str, fw: i32, fh: i32, scale: i32, feet: i32, draw_layer: i32) {
    unsafe {
        rg_host_register_sheet(
            id.as_ptr() as i32,
            id.len() as i32,
            path.as_ptr() as i32,
            path.len() as i32,
            fw,
            fh,
            scale,
            feet,
            draw_layer,
        );
    }
}

fn host_rect(id: &str, w: i32, h: i32, r: i32, g: i32, b: i32, draw_layer: i32) {
    unsafe {
        rg_host_register_rect(
            id.as_ptr() as i32,
            id.len() as i32,
            w,
            h,
            r,
            g,
            b,
            draw_layer,
        );
    }
}

#[no_mangle]
pub extern "C" fn declare_resources() {
    host_sheet("p1", "assets/car1.png", 471, 909, 4, 454, 10);
    host_sheet("p2", "assets/car2.png", 471, 908, 4, 454, 10);
    host_sheet("trafficCar", "assets/othercar.png", 285, 625, 7, 312, 10);
    host_sheet("cone", "assets/cone.png", 204, 275, 9, 252, 10);
    host_sheet("oil", "assets/oil.png", 891, 706, 9, 353, 0);
    host_rect("bar", 8, 46, 210, 215, 225, 5);
}

#[no_mangle]
pub extern "C" fn abi_base() -> i32 {
    unsafe { ABI.as_ptr() as i32 }
}

#[no_mangle]
pub extern "C" fn init() {
    wr_i32(OFF_MAGIC, ABI_MAGIC);
    wr_i32(OFF_VERSION, ABI_VERSION);
    wr_i32(OFF_SIZE, ABI_SIZE);
    wr_i32(OFF_BODY_COUNT, BODY_COUNT);
    wr_i32(OFF_IMPULSE_CNT, 0);
    wr_i32(OFF_CONTACT_CNT, 0);
    wr_i32(OFF_EVENT_CNT, 0);
    wr_i32(OFF_AIR_P1, 0);
    wr_i32(OFF_AIR_P2, 0);
    wr_i32(OFF_SCORE, 0);
    wr_i32(OFF_HITS, 0);
    unsafe {
        RAMP_CD_P1 = 0;
        RAMP_CD_P2 = 0;
        BRAKE_CD_P1 = 0;
        BRAKE_CD_P2 = 0;
        SOMEONE_WON = false;
        EVENT_WRITE = 0;
        AIR_P1 = 0;
        AIR_P2 = 0;
        OIL_CD_P1 = 0;
        OIL_CD_P2 = 0;
        OIL_RECOVER_P1 = 0;
        OIL_RECOVER_P2 = 0;
        OIL_WAS_P1 = false;
        OIL_WAS_P2 = false;
        UI_REV = 0;
        UI_LAST_SIG = -1;
        HITS_P1 = 0;
        HITS_P2 = 0;
        LAST_HIT_P1 = 0;
        LAST_HIT_P2 = 0;
        FLASH_P1 = 0;
        FLASH_P2 = 0;
        GRIP_P1 = 0;
        GRIP_P2 = 0;
    }

    let (sx, _) = road_at((6000 - 140) * FP);
    wr_i32(OFF_BODIES + BODY_P1 * BODY_SIZE, sx - 28 * FP);
    wr_i32(OFF_BODIES + BODY_P1 * BODY_SIZE + 4, (6000 - 140) * FP);
    wr_i32(OFF_BODIES + BODY_P2 * BODY_SIZE, sx + 28 * FP);
    wr_i32(OFF_BODIES + BODY_P2 * BODY_SIZE + 4, (6000 - 140) * FP);

    let mut ti = 0;
    while ti < TRAFFIC_COUNT {
        let t = &TRAFFIC[ti as usize];
        let idx = TRAFFIC_START + ti;
        let x = cx_lane(t.y * FP, t.lane_milli);
        wr_i32(OFF_BODIES + idx * BODY_SIZE, x);
        wr_i32(OFF_BODIES + idx * BODY_SIZE + 4, t.y * FP);
        ti += 1;
    }
}

fn cx_lane(y_fp: i32, lane_milli: i32) -> i32 {
    let (cx, half) = road_at(y_fp);
    let usable = half - 22 * FP;
    cx + usable * clamp(lane_milli, -1000, 1000) / 1000
}

fn is_player(code: i32) -> bool {
    code == BODY_P1 || code == BODY_P2
}

fn is_wall(code: i32) -> bool {
    code == ID_WALL_L || code == ID_WALL_R
}

fn is_cone(code: i32) -> bool {
    code >= 100 && code < 200
}

fn is_bar(code: i32) -> bool {
    code >= 200 && code < 300
}

fn is_traffic(code: i32) -> bool {
    code >= TRAFFIC_START && code < TRAFFIC_START + TRAFFIC_COUNT
}

fn body_vx_vy_fp(idx: i32) -> (i32, i32) {
    let ang_milli = rd_i32(OFF_BODIES + idx * BODY_SIZE + 8);
    let speed_fp = rd_i32(OFF_BODIES + idx * BODY_SIZE + 12);
    let ang_deg = ang_milli as f64 / 1000.0;
    let rad = ang_deg * core::f64::consts::PI / 180.0;
    let speed = speed_fp as f64 / FP as f64;
    let vx = (rad.sin() * speed * FP as f64) as i32;
    let vy = (-rad.cos() * speed * FP as f64) as i32;
    (vx, vy)
}

fn write_impulse(idx: i32, body: i32, lx_fp: i32, ly_fp: i32, ang_fp: i32) {
    let base = OFF_IMPULSES + idx * IMPULSE_SIZE;
    wr_i32(base, body);
    wr_i32(base + 4, lx_fp);
    wr_i32(base + 8, ly_fp);
    wr_i32(base + 12, ang_fp);
}

fn append_impulse(imp_cnt: &mut i32, body: i32, lx_fp: i32, ly_fp: i32, ang_fp: i32) {
    if *imp_cnt >= MAX_IMPULSES {
        return;
    }
    write_impulse(*imp_cnt, body, lx_fp, ly_fp, ang_fp);
    *imp_cnt += 1;
}

fn cone_launch_impulse(player: i32, body_b: i32, nx_m: i32, ny_m: i32) -> (i32, i32, i32) {
    let mut nx = nx_m;
    let mut ny = ny_m;
    if body_b == player {
        nx = -nx;
        ny = -ny;
    }
    let nx_f = nx as f64 / 1000.0;
    let ny_f = ny as f64 / 1000.0;
    let (cvx, cvy) = body_vx_vy_fp(player);
    let cvx_f = cvx as f64 / FP as f64;
    let cvy_f = cvy as f64 / FP as f64;
    let share = CAR_MASS as f64 / (CAR_MASS + CONE_MASS) as f64;
    let lvx_f = cvx_f * share * 0.25 + nx_f * 25.0;
    let lvy_f = cvy_f * share * 0.25 + ny_f * 25.0;
    let ang_f = nx_f * 200.0 + ny_f * 90.0;
    (
        (lvx_f * FP as f64) as i32,
        (lvy_f * FP as f64) as i32,
        (ang_f * FP as f64) as i32,
    )
}

fn process_contacts() {
    let cnt = rd_i32(OFF_CONTACT_CNT);
    let mut hits = rd_i32(OFF_HITS);
    let mut imp_cnt = 0;
    let mut ci = 0;
    while ci < cnt && ci < MAX_CONTACTS {
        let base = OFF_CONTACTS + ci * CONTACT_SIZE;
        let body_a = rd_i32(base);
        let body_b = rd_i32(base + 4);
        let phase = rd_i32(base + 8);
        let imp_fp = rd_i32(base + 12);
        let x_fp = rd_i32(base + 16);
        let y_fp = rd_i32(base + 20);
        if phase == 1 {
            let (player, other) = if is_player(body_a) {
                (body_a, body_b)
            } else if is_player(body_b) {
                (body_b, body_a)
            } else {
                (-1, -1)
            };
            if player >= 0 {
                hud_note_hit(player, other);
                if is_wall(other) || is_bar(other) || is_traffic(other) {
                    hits += 1;
                    let imp = imp_fp as f64 / FP as f64;
                    if is_wall(other) && imp > 80.0 {
                        push_particles(x_fp, y_fp, 6);
                    }
                    if is_bar(other) && imp > 45.0 {
                        push_particles(x_fp, y_fp, 6);
                    }
                    if is_traffic(other) && imp > 55.0 {
                        push_particles(x_fp, y_fp, 5);
                    }
                }
                if is_cone(other) {
                    let nx_m = rd_i32(base + 24);
                    let ny_m = rd_i32(base + 28);
                    let (lx, ly, ang) = cone_launch_impulse(player, body_b, nx_m, ny_m);
                    append_impulse(&mut imp_cnt, other, lx, ly, ang);
                }
                push_collision_feedback(player, other, imp_fp, x_fp, y_fp);
            }
        }
        ci += 1;
    }
    wr_i32(OFF_HITS, hits);
    wr_i32(OFF_IMPULSE_CNT, imp_cnt);
}

fn oil_tick_entry(idx: i32, oil_cd: &mut i32, oil_recover: &mut i32, oil_was: &mut bool) {
    let on = on_oil(body_x(idx), body_y(idx));
    if on && !*oil_was {
        *oil_cd = OIL_EFFECT_MS;
        *oil_recover = OIL_RECOVER_MS;
    }
}

fn apply_player_extras(
    idx: i32,
    steer: i32,
    now: i32,
    dt: i32,
    ramp_cd: &mut i32,
    air_tick: &mut i32,
    oil_cd: &mut i32,
    oil_recover: &mut i32,
    oil_was: &mut bool,
    imp_cnt: &mut i32,
) {
    let x = body_x(idx);
    let y = body_y(idx);
    let on = on_oil(x, y);
    if on && !*oil_was {
        push_sound(SND_BOUNCE);
        let burst = oil_entry_spin(idx, steer, now);
        if burst != 0 {
            append_impulse(imp_cnt, idx, 0, 0, burst);
        }
    }
    *oil_was = on;
    if *oil_cd > 0 {
        *oil_cd = decay_timer(*oil_cd, dt);
    }
    if *oil_recover > 0 {
        *oil_recover = decay_timer(*oil_recover, dt);
    }
    let recover = *oil_recover > 0;
    let damp = spin_stabilizer_fp(idx, recover);
    if damp != 0 {
        append_impulse(imp_cnt, idx, 0, 0, damp);
    }
    if *ramp_cd <= 0 && hit_ramp(x, y) {
        append_impulse(imp_cnt, idx, 0, -95 * FP, 320 * FP);
        *ramp_cd = 700;
        *air_tick = 900;
        let pad = if idx == BODY_P2 { 1 } else { 0 };
        push_sound(SND_BOUNCE);
        push_rumble(pad, 70, 12000);
    }
}

fn check_win() {
    unsafe {
        if SOMEONE_WON {
            return;
        }
    }
    let y1 = body_y(BODY_P1) / FP;
    let y2 = body_y(BODY_P2) / FP;
    if y1 < FINISH_Y || y2 < FINISH_Y {
        wr_i32(OFF_SCORE, rd_i32(OFF_SCORE) + WIN_SCORE);
        push_sound(SND_WIN);
        unsafe { SOMEONE_WON = true; }
    }
}

#[no_mangle]
pub extern "C" fn update() {
    unsafe { EVENT_WRITE = 0; }

    process_contacts();

    let dt = rd_i32(OFF_DT);
    let flags = rd_i32(OFF_INPUT);
    let flags_p2 = rd_i32(OFF_INPUT_P2);
    let now = rd_i32(OFF_TIME);

    let (p_steer, p_th, p_br) = drive_from_input(flags);
    let (p2_steer, p2_th, p2_br) = drive_from_input(flags_p2);
    unsafe {
        oil_tick_entry(BODY_P1, &mut OIL_CD_P1, &mut OIL_RECOVER_P1, &mut OIL_WAS_P1);
        oil_tick_entry(BODY_P2, &mut OIL_CD_P2, &mut OIL_RECOVER_P2, &mut OIL_WAS_P2);
    }
    let p1_grip = surface_grip_for_player(BODY_P1, body_x(BODY_P1), body_y(BODY_P1));
    let p2_grip = surface_grip_for_player(BODY_P2, body_x(BODY_P2), body_y(BODY_P2));
    unsafe {
        GRIP_P1 = p1_grip;
        GRIP_P2 = p2_grip;
    }
    write_control(BODY_P1, p_steer, p_th, p_br, p1_grip);
    write_control(BODY_P2, p2_steer, p2_th, p2_br, p2_grip);

    let mut ti = 0;
    while ti < TRAFFIC_COUNT {
        let idx = TRAFFIC_START + ti;
        let t = &TRAFFIC[ti as usize];
        let (st, th, br, gr) = traffic_control(idx, t, now);
        write_control(idx, st, th, br, gr);
        ti += 1;
    }

    unsafe {
        tick_brake_audio(BODY_P1, p_br, &mut BRAKE_CD_P1, dt);
        tick_brake_audio(BODY_P2, p2_br, &mut BRAKE_CD_P2, dt);
        RAMP_CD_P1 = decay_timer(RAMP_CD_P1, dt);
        RAMP_CD_P2 = decay_timer(RAMP_CD_P2, dt);
        AIR_P1 = decay_timer(AIR_P1, dt);
        AIR_P2 = decay_timer(AIR_P2, dt);
        FLASH_P1 = decay_timer(FLASH_P1, dt);
        FLASH_P2 = decay_timer(FLASH_P2, dt);
    }

    let mut imp_extra = rd_i32(OFF_IMPULSE_CNT);
    unsafe {
        apply_player_extras(
            BODY_P1, p_steer, now, dt, &mut RAMP_CD_P1, &mut AIR_P1,
            &mut OIL_CD_P1, &mut OIL_RECOVER_P1, &mut OIL_WAS_P1, &mut imp_extra,
        );
        apply_player_extras(
            BODY_P2, p2_steer, now, dt, &mut RAMP_CD_P2, &mut AIR_P2,
            &mut OIL_CD_P2, &mut OIL_RECOVER_P2, &mut OIL_WAS_P2, &mut imp_extra,
        );
        wr_i32(OFF_AIR_P1, AIR_P1);
        wr_i32(OFF_AIR_P2, AIR_P2);
    }
    wr_i32(OFF_IMPULSE_CNT, imp_extra);

    wr_i32(OFF_CAMERA_Y, body_y(BODY_P1) - 120 * FP);
    check_win();

    unsafe {
        wr_i32(OFF_EVENT_CNT, EVENT_WRITE);
    }

    ui_refresh();
}
