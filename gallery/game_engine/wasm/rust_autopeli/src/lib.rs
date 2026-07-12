//! Linear ABI autopeli logic (traffic AI + player controls).
//! Host runs GamePhysics; this module reads/writes the shared ABI block.

pub const ABI_MAGIC: i32 = 0x3157_4752; // 'RGW1'
pub const ABI_VERSION: i32 = 1;
pub const ABI_SIZE: i32 = 2048;
pub const FP: i32 = 256;
pub const STEER_SCALE: i32 = 1000;

pub const OFF_MAGIC: i32 = 0;
pub const OFF_VERSION: i32 = 4;
pub const OFF_SIZE: i32 = 8;
pub const OFF_DT: i32 = 12;
pub const OFF_TIME: i32 = 16;
pub const OFF_INPUT: i32 = 20;
pub const OFF_BODY_COUNT: i32 = 28;
pub const OFF_IMPULSE_CNT: i32 = 32;
pub const OFF_CONTACT_CNT: i32 = 36;
pub const OFF_SCORE: i32 = 40;
pub const OFF_HITS: i32 = 44;
pub const OFF_CAMERA_Y: i32 = 48;

pub const OFF_BODIES: i32 = 64;
pub const BODY_SIZE: i32 = 24;
pub const OFF_CONTROLS: i32 = 832;
pub const CTRL_SIZE: i32 = 16;
pub const OFF_IMPULSES: i32 = 1344;
pub const IMPULSE_SIZE: i32 = 16;
pub const OFF_CONTACTS: i32 = 1600;
pub const CONTACT_SIZE: i32 = 32;
pub const MAX_CONTACTS: i32 = 14;
pub const MAX_IMPULSES: i32 = 16;

pub const ID_WALL_L: i32 = 1000;
pub const ID_WALL_R: i32 = 1001;

const CAR_MASS: i32 = 1200;
const CONE_MASS: i32 = 3;
const WIN_SCORE: i32 = 5000;
const FINISH_Y: i32 = 140;

pub const BODY_P1: i32 = 0;
pub const BODY_P2: i32 = 1;
pub const TRAFFIC_START: i32 = 2;
pub const TRAFFIC_COUNT: i32 = 15;
pub const BODY_COUNT: i32 = 2 + TRAFFIC_COUNT;

pub const IN_UP: i32 = 1;
pub const IN_DOWN: i32 = 2;
pub const IN_LEFT: i32 = 4;
pub const IN_RIGHT: i32 = 8;

static mut ABI: [u8; 2048] = [0u8; 2048];

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

fn sin_milli(phase_milli: i64) -> i32 {
    let x = (phase_milli % 6283) as f64 / 1000.0;
    let x2 = x * x;
    let x3 = x2 * x;
    let x5 = x3 * x2;
    (x - x3 / 6.0 + x5 / 120.0) as i32 * 1000
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

fn body_x(idx: i32) -> i32 {
    rd_i32(OFF_BODIES + idx * BODY_SIZE)
}

fn body_y(idx: i32) -> i32 {
    rd_i32(OFF_BODIES + idx * BODY_SIZE + 4)
}

fn write_control(idx: i32, steer: i32, throttle: i32, brake: i32, grip: i32) {
    let base = OFF_CONTROLS + idx * CTRL_SIZE;
    wr_i32(base, steer);
    wr_i32(base + 4, throttle);
    wr_i32(base + 8, brake);
    wr_i32(base + 12, grip);
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
    (steer, t.throttle_milli, 0, 950)
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
    wr_i32(OFF_SCORE, 0);
    wr_i32(OFF_HITS, 0);

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
        if phase == 1 {
            let (player, other) = if is_player(body_a) {
                (body_a, body_b)
            } else if is_player(body_b) {
                (body_b, body_a)
            } else {
                (-1, -1)
            };
            if player >= 0 {
                if is_wall(other) || is_bar(other) || is_traffic(other) {
                    hits += 1;
                }
                if is_cone(other) && imp_cnt < MAX_IMPULSES {
                    let nx_m = rd_i32(base + 24);
                    let ny_m = rd_i32(base + 28);
                    let (lx, ly, ang) = cone_launch_impulse(player, body_b, nx_m, ny_m);
                    write_impulse(imp_cnt, other, lx, ly, ang);
                    imp_cnt += 1;
                }
            }
        }
        ci += 1;
    }
    wr_i32(OFF_HITS, hits);
    wr_i32(OFF_IMPULSE_CNT, imp_cnt);
}

fn check_win() {
    if rd_i32(OFF_SCORE) >= WIN_SCORE {
        return;
    }
    let y_fp = rd_i32(OFF_BODIES + BODY_P1 * BODY_SIZE + 4);
    if y_fp / FP < FINISH_Y {
        wr_i32(OFF_SCORE, rd_i32(OFF_SCORE) + WIN_SCORE);
    }
}

#[no_mangle]
pub extern "C" fn update() {
    process_contacts();

    let flags = rd_i32(OFF_INPUT);
    let now = rd_i32(OFF_TIME);
    let (p_steer, p_th, p_br) = drive_from_input(flags);
    write_control(BODY_P1, p_steer, p_th, p_br, 1000);
    write_control(BODY_P2, 0, 350, 0, 1000);

    let mut ti = 0;
    while ti < TRAFFIC_COUNT {
        let idx = TRAFFIC_START + ti;
        let t = &TRAFFIC[ti as usize];
        let (st, th, br, gr) = traffic_control(idx, t, now);
        write_control(idx, st, th, br, gr);
        ti += 1;
    }

    wr_i32(OFF_CAMERA_Y, body_y(BODY_P1) - 120 * FP);
    check_win();
}
