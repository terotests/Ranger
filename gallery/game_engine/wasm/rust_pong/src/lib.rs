//! Minimal Pong logic compiled to WASM for the Ranger game engine PoC.
//!
//! Export ABI (called by WasmGameRunner via wasm3):
//!   init()
//!   update(dt_ms, up, down, left, right)
//!   ball_x, ball_y, paddle1_y, paddle2_y, score1, score2 -> i32

const W: i32 = 480;
const H: i32 = 270;
const PADDLE_HALF: i32 = 28;
const PADDLE_SPEED: f64 = 0.18;
const BALL_RAD: i32 = 6;

struct Game {
    ball_x: f64,
    ball_y: f64,
    vx: f64,
    vy: f64,
    p1_y: f64,
    p2_y: f64,
    score1: i32,
    score2: i32,
}

static mut G: Game = Game {
    ball_x: 240.0,
    ball_y: 135.0,
    vx: 0.16,
    vy: 0.10,
    p1_y: 135.0,
    p2_y: 135.0,
    score1: 0,
    score2: 0,
};

#[no_mangle]
pub extern "C" fn init() {
    unsafe {
        G = Game {
            ball_x: 240.0,
            ball_y: 135.0,
            vx: 0.16,
            vy: 0.10,
            p1_y: 135.0,
            p2_y: 135.0,
            score1: 0,
            score2: 0,
        };
    }
}

fn clamp(v: f64, lo: f64, hi: f64) -> f64 {
    if v < lo {
        return lo;
    }
    if v > hi {
        return hi;
    }
    v
}

fn try_paddle_bounce(bx: f64, by: f64, py: f64, paddle_x: f64, vx: f64, vy: f64, from_left: bool) -> (f64, f64, f64, bool) {
    let half = PADDLE_HALF as f64;
    if by < py - half || by > py + half {
        return (bx, vx, vy, false);
    }
    if from_left {
        if vx >= 0.0 {
            return (bx, vx, vy, false);
        }
        if bx > paddle_x + 10.0 {
            return (bx, vx, vy, false);
        }
        let ny = vy + (by - py) * 0.004;
        return (paddle_x + 10.0, vx.abs(), ny, true);
    }
    if vx <= 0.0 {
        return (bx, vx, vy, false);
    }
    if bx < paddle_x - 10.0 {
        return (bx, vx, vy, false);
    }
    let ny = vy + (by - py) * 0.004;
    return (paddle_x - 10.0, -vx.abs(), ny, true)
}

#[no_mangle]
pub extern "C" fn update(dt_ms: i32, up: i32, down: i32, _left: i32, _right: i32) {
    let dt = dt_ms as f64;
    unsafe {
        if up != 0 {
            G.p1_y -= PADDLE_SPEED * dt;
        }
        if down != 0 {
            G.p1_y += PADDLE_SPEED * dt;
        }
        G.p1_y = clamp(G.p1_y, PADDLE_HALF as f64, (H - PADDLE_HALF) as f64);

        // Simple AI for P2
        if G.ball_y < G.p2_y - 4.0 {
            G.p2_y -= PADDLE_SPEED * 0.85 * dt;
        } else if G.ball_y > G.p2_y + 4.0 {
            G.p2_y += PADDLE_SPEED * 0.85 * dt;
        }
        G.p2_y = clamp(G.p2_y, PADDLE_HALF as f64, (H - PADDLE_HALF) as f64);

        let prev_bx = G.ball_x;
        G.ball_x += G.vx * dt;
        G.ball_y += G.vy * dt;

        let (bx, vx, vy, hit) = try_paddle_bounce(G.ball_x, G.ball_y, G.p1_y, 18.0, G.vx, G.vy, true);
        if hit {
            G.ball_x = bx;
            G.vx = vx;
            G.vy = vy;
        }
        let (bx2, vx2, vy2, hit2) = try_paddle_bounce(G.ball_x, G.ball_y, G.p2_y, 462.0, G.vx, G.vy, false);
        if hit2 {
            G.ball_x = bx2;
            G.vx = vx2;
            G.vy = vy2;
        }

        if G.ball_y <= BALL_RAD as f64 {
            G.ball_y = BALL_RAD as f64;
            G.vy = G.vy.abs();
        }
        if G.ball_y >= (H - BALL_RAD) as f64 {
            G.ball_y = (H - BALL_RAD) as f64;
            G.vy = -G.vy.abs();
        }

        if G.ball_x < 0.0 {
            G.score2 += 1;
            G.ball_x = 240.0;
            G.ball_y = 135.0;
            G.vx = 0.16;
            G.vy = 0.10;
        }
        if G.ball_x > W as f64 {
            G.score1 += 1;
            G.ball_x = 240.0;
            G.ball_y = 135.0;
            G.vx = -0.16;
            G.vy = 0.10;
        }

        let _ = prev_bx;
    }
}

#[no_mangle]
pub extern "C" fn ball_x() -> i32 {
    unsafe { G.ball_x.round() as i32 }
}

#[no_mangle]
pub extern "C" fn ball_y() -> i32 {
    unsafe { G.ball_y.round() as i32 }
}

#[no_mangle]
pub extern "C" fn paddle1_y() -> i32 {
    unsafe { G.p1_y.round() as i32 }
}

#[no_mangle]
pub extern "C" fn paddle2_y() -> i32 {
    unsafe { G.p2_y.round() as i32 }
}

#[no_mangle]
pub extern "C" fn score1() -> i32 {
    unsafe { G.score1 }
}

#[no_mangle]
pub extern "C" fn score2() -> i32 {
    unsafe { G.score2 }
}
