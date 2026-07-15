/// <reference path="../../scripting/game.d.ts" />
//
// Laskupeli — an educational math quiz for young children.
//
//   * Level select: "5v" (add within 5) and "8v" (+, −, × within ~20).
//   * A question and three answer tiles; move with ←/→, pick with Space.
//   * Right  -> cheer + a spoken "Hyvä!"   (games/mathquiz/voices/good-fi.wav)
//   * Wrong  -> sigh  + a spoken "Yritä uudelleen" (voices/wrong-fi.wav)
//
// The vocal effects (cheer/sigh) are the built-in synth, so audio works out of
// the box. The SPOKEN words come from real WAV files under voices/ (auto-loaded
// when present, see voices/*.info); until you drop those in you just hear the
// synth cheer/sigh. Questions are deterministic (a tiny LCG), no Math.random.
//
// Written in the interpreter-safe subset: no array-index writes, own input-edge
// detection so menus don't skip. Coordinates are a 480x270 buffer.

// Spoken feedback overrides — auto-loaded when the WAV exists (see voices/).
// Missing files are ignored, so the game runs on the synth cheer/sigh alone.
function resources() {
  return [
    // The game's own HUD font: Fredoka One is round and chunky, which reads
    // clearly for young children. Rendered as crisp TrueType via the EVG
    // RasterText stack (see game_hud loadFont), not the 3x5 bitmap fallback.
    { kind: "font", id: "Fredoka One", path: "assets/fonts/FredokaOne-Regular.ttf" },
    { kind: "voice", id: "good-fi", path: "voices/good-fi.wav" },
    { kind: "voice", id: "wrong-fi", path: "voices/wrong-fi.wav" }
  ];
}

function sprites() {
  return [
    { id: "bg", kind: "rect", w: 480, h: 270, r: 18, g: 22, b: 40 }
  ];
}

function initState() {
  return {
    screen: "menu",
    level: 1,
    sel: 0,
    seed: 12345,
    a: 0, b: 0, op: "+", ans: 0,
    o0: 0, o1: 0, o2: 0,
    correct: 0,
    qnum: 1,
    total: 6,
    score: 0,
    phase: "ask",
    fb: 0,
    entities: { bg: { x: 240, y: 135 } },
    pUp: 0, pDown: 0, pLeft: 0, pRight: 0, pAct: 0
  };
}

function nextSeed(seed) {
  return (seed * 75 + 74) % 65537;
}

// Build a question for `level` from `seed`; returns the new seed plus the
// question fields and three answer options (correct at index `correct`).
function makeQuestion(level, seed) {
  let s = seed;
  let a = 0;
  let b = 0;
  let op = "+";
  let ans = 0;

  if (level == 1) {
    s = nextSeed(s); a = s % 5;
    s = nextSeed(s); b = s % 5;
    op = "+"; ans = a + b;
  } else {
    s = nextSeed(s);
    let kind = s % 3;
    if (kind == 2) {
      s = nextSeed(s); a = 1 + (s % 5);
      s = nextSeed(s); b = 1 + (s % 5);
      op = "x"; ans = a * b;
    } else {
      if (kind == 1) {
        s = nextSeed(s); a = 5 + (s % 11);
        s = nextSeed(s); b = s % (a + 1);
        op = "-"; ans = a - b;
      } else {
        s = nextSeed(s); a = s % 13;
        s = nextSeed(s); b = s % 13;
        op = "+"; ans = a + b;
      }
    }
  }

  // Two distractors near the answer, kept distinct and non-negative.
  let d1 = ans + 1;
  let d2 = ans - 1;
  if (d2 < 0) { d2 = ans + 2; }
  if (d2 == d1) { d2 = d1 + 1; }

  s = nextSeed(s);
  let slot = s % 3;
  let o0 = d1;
  let o1 = d1;
  let o2 = d1;
  if (slot == 0) { o0 = ans; o1 = d1; o2 = d2; }
  if (slot == 1) { o0 = d1; o1 = ans; o2 = d2; }
  if (slot == 2) { o0 = d1; o1 = d2; o2 = ans; }

  return {
    seed: s, a: a, b: b, op: op, ans: ans,
    o0: o0, o1: o1, o2: o2, correct: slot
  };
}

function update(props) {
  const s = props.state;

  // Rising-edge detection so held keys don't fly through menus/answers.
  const up = props.up && !s.pUp;
  const down = props.down && !s.pDown;
  const left = props.left && !s.pLeft;
  const right = props.right && !s.pRight;
  const act = props.action && !s.pAct;

  let pUp = 0; if (props.up) { pUp = 1; }
  let pDown = 0; if (props.down) { pDown = 1; }
  let pLeft = 0; if (props.left) { pLeft = 1; }
  let pRight = 0; if (props.right) { pRight = 1; }
  let pAct = 0; if (props.action) { pAct = 1; }

  // Carry state forward by default.
  let screen = s.screen;
  let level = s.level;
  let sel = s.sel;
  let seed = s.seed;
  let a = s.a; let b = s.b; let op = s.op; let ans = s.ans;
  let o0 = s.o0; let o1 = s.o1; let o2 = s.o2;
  let correct = s.correct;
  let qnum = s.qnum;
  let score = s.score;
  let phase = s.phase;
  let fb = s.fb;
  let ev = [];

  if (screen == "menu") {
    if (up || down) {
      if (sel == 0) { sel = 1; } else { sel = 0; }
    }
    if (act) {
      level = 1;
      if (sel == 1) { level = 2; }
      const q = makeQuestion(level, nextSeed(seed + level * 7));
      seed = q.seed; a = q.a; b = q.b; op = q.op; ans = q.ans;
      o0 = q.o0; o1 = q.o1; o2 = q.o2; correct = q.correct;
      screen = "play"; phase = "ask"; sel = 0; qnum = 1; score = 0; fb = 0;
    }
  } else {
    if (screen == "play") {
      if (phase == "ask") {
        if (left) { if (sel == 0) { sel = 2; } else { sel = sel - 1; } }
        if (right) { if (sel == 2) { sel = 0; } else { sel = sel + 1; } }
        if (act) {
          if (sel == correct) {
            score = score + 1;
            phase = "right"; fb = 60;
            ev = [
              { kind: "playSound", id: "win" },
              { kind: "playVoice", id: "cheer" },
              { kind: "playVoice", id: "good-fi" }
            ];
          } else {
            phase = "wrong"; fb = 60;
            ev = [
              { kind: "playSound", id: "lose" },
              { kind: "playVoice", id: "sigh" },
              { kind: "playVoice", id: "wrong-fi" }
            ];
          }
        }
      } else {
        // Feedback shown; auto-advance when the timer runs out or on Space.
        fb = fb - 1;
        if (fb <= 0 || act) {
          if (phase == "right") {
            if (qnum >= s.total) {
              screen = "done";
            } else {
              qnum = qnum + 1;
              const q = makeQuestion(level, seed);
              seed = q.seed; a = q.a; b = q.b; op = q.op; ans = q.ans;
              o0 = q.o0; o1 = q.o1; o2 = q.o2; correct = q.correct;
              phase = "ask"; sel = 0;
            }
          } else {
            // Wrong: let them try the same question again.
            phase = "ask";
          }
        }
      }
    } else {
      // done
      if (act) {
        screen = "menu"; sel = 0;
      }
    }
  }

  return {
    screen: screen,
    level: level,
    sel: sel,
    seed: seed,
    a: a, b: b, op: op, ans: ans,
    o0: o0, o1: o1, o2: o2,
    correct: correct,
    qnum: qnum,
    total: s.total,
    score: score,
    phase: phase,
    fb: fb,
    entities: { bg: { x: 240, y: 135 } },
    pUp: pUp, pDown: pDown, pLeft: pLeft, pRight: pRight, pAct: pAct,
    events: ev
  };
}

// A fixed-size answer tile. `active` wraps it in a bright glow ring (an outer
// View whose semi-transparent background peeks past the inner card via padding)
// and inverts the fill — the same highlight the menus use. The card centers its
// label on both axes; fontSize 34px maps to bitmap scale 5, so digits are big.
// Explicit widths/heights everywhere: a background View with no width stretches
// to fill its parent (cross-axis stretch), and an un-sized row wrapper shrink-
// wraps and makes each tile wrap onto its own line. Sized boxes avoid both.
function tile(value, active) {
  let bg = "#26304e";
  let fg = "#cbd6f2";
  let glow = "#00000000";
  if (active == 1) {
    bg = "#ffd23f";
    fg = "#1a1e33";
    glow = "#ffe98acc";
  }
  return (
    <View backgroundColor={glow} width="104px" height="76px" margin="6px" flexDirection="column" alignItems="center" justifyContent="center">
      <View backgroundColor={bg} width="92px" height="64px" flexDirection="column" alignItems="center" justifyContent="center">
        <Label color={fg} fontSize="34px">{value}</Label>
      </View>
    </View>
  );
}

// A framed card: an outer glow ring around an inner dark panel with centered
// text. Used for the big equation so it reads like the menu cards.
function panel(text, color, glow, size) {
  return (
    <View backgroundColor={glow} width="312px" height="80px" margin="6px" flexDirection="column" alignItems="center" justifyContent="center">
      <View backgroundColor="#141a30" width="300px" height="68px" flexDirection="column" alignItems="center" justifyContent="center">
        <Label color={color} fontSize={size}>{text}</Label>
      </View>
    </View>
  );
}

function hud(props) {
  const s = props.state;

  if (s.screen == "menu") {
    let a0 = 0; let a1 = 0;
    if (s.sel == 0) { a0 = 1; } else { a1 = 1; }
    return (
      <View width="100%" height="100%" flexDirection="column" justifyContent="center" alignItems="center">
        <Label color="#8cd3ff" fontSize="44px">LASKUPELI</Label>
        <Label color="#6a8aaa" fontSize="14px">Valitse taso — nuolet + Space</Label>
        <View width="240px" flexDirection="row" justifyContent="center" alignItems="center">
          {tile("5v", a0)}
          {tile("8v", a1)}
        </View>
      </View>
    );
  }

  if (s.screen == "done") {
    return (
      <View width="100%" height="100%" flexDirection="column" justifyContent="center" alignItems="center">
        <Label color="#ffd23f" fontSize="44px">VALMIS</Label>
        {panel(s.score + " / " + s.total, "#ffffff", "#4a90d288", "34px")}
        <Label color="#8cd3ff" fontSize="14px">Space = alkuun</Label>
      </View>
    );
  }

  // Just the task, e.g. "4 + 3 = ?" — no "Kysymys" label, per request.
  const q = s.a + " " + s.op + " " + s.b + " = ?";
  let msg = "";
  let mc = "#8cd3ff";
  if (s.phase == "right") { msg = "Hyvä!"; mc = "#7CFF9B"; }
  if (s.phase == "wrong") { msg = "Yritä uudelleen"; mc = "#ff8899"; }

  let a0 = 0; let a1 = 0; let a2 = 0;
  if (s.phase == "ask") {
    if (s.sel == 0) { a0 = 1; }
    if (s.sel == 1) { a1 = 1; }
    if (s.sel == 2) { a2 = 1; }
  }

  return (
    <View width="100%" height="100%" flexDirection="column" justifyContent="center" alignItems="center">
      <Label color="#6a8aaa" fontSize="14px">{s.qnum} / {s.total}   Pisteet {s.score}</Label>
      {panel(q, "#ffffff", "#4a90d2aa", "44px")}
      <View width="360px" flexDirection="row" justifyContent="center" alignItems="center">
        {tile(s.o0, a0)}
        {tile(s.o1, a1)}
        {tile(s.o2, a2)}
      </View>
      <Label color={mc} fontSize="24px">{msg}</Label>
    </View>
  );
}
