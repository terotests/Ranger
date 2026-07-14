/// <reference path="../../scripting/game.d.ts" />
//
// Comedy Club — a tiny stage whose performer triggers predefined VOCAL effects
// through the engine's audio ABI (game_vocal_fx.rgr). The effects are rendered
// by the engine's own vocal synth (no external dependency); the first four map
// to Voicebox paralinguistic tags ([laugh]/[sigh]/[gasp]/[cough]).
//
// Controls:  space = laugh   up = cheer   down = boo   left = gasp   right = sigh
// Idle: the crowd auto-reacts every ~110 frames (well past the longest clip so
// the SDL audio queue never piles up), cycling the whole catalogue.
//
// Written in the interpreter-safe subset (no `%`, no dynamic array indexing) so
// it loads identically under the JS and the C++/SDL ComponentEngine — see
// pong.game.tsx for the same discipline. Coordinates are a 480x270 buffer.

function sprites() {
  return [
    { id: "stage", kind: "rect", w: 420, h: 8, r: 90, g: 70, b: 110 },
    { id: "perf", kind: "circle", rad: 16, r: 255, g: 210, b: 90 },
    { id: "a0", kind: "circle", rad: 7, r: 120, g: 150, b: 210 },
    { id: "a1", kind: "circle", rad: 7, r: 130, g: 160, b: 220 },
    { id: "a2", kind: "circle", rad: 7, r: 120, g: 150, b: 210 },
    { id: "a3", kind: "circle", rad: 7, r: 130, g: 160, b: 220 },
    { id: "a4", kind: "circle", rad: 7, r: 120, g: 150, b: 210 }
  ];
}

function initState() {
  return {
    playerSlots: 1,
    entities: {
      stage: { x: 240, y: 210 },
      perf: { x: 240, y: 150 },
      a0: { x: 80, y: 244 },
      a1: { x: 160, y: 244 },
      a2: { x: 240, y: 244 },
      a3: { x: 320, y: 244 },
      a4: { x: 400, y: 244 }
    },
    t: 0,
    phase: 0,
    since: 0,
    bob: 0,
    bobDir: 1,
    reactions: 0
  };
}

function pickEffect(phase) {
  if (phase == 0) { return "laugh"; }
  if (phase == 1) { return "giggle"; }
  if (phase == 2) { return "chuckle"; }
  if (phase == 3) { return "sigh"; }
  if (phase == 4) { return "gasp"; }
  if (phase == 5) { return "cough"; }
  if (phase == 6) { return "cheer"; }
  if (phase == 7) { return "boo"; }
  if (phase == 8) { return "hmm"; }
  if (phase == 9) { return "huh"; }
  return "yawn";
}

function update(props) {
  const s = props.state;
  const t = s.t + 1;

  // Performer bobs left/right (no modulo — bounce a counter between limits).
  let bob = s.bob + s.bobDir * 2;
  let bobDir = s.bobDir;
  if (bob > 40) { bob = 40; bobDir = -1; }
  if (bob < -40) { bob = -40; bobDir = 1; }
  const perfX = 240 + bob;

  // Interactive triggers (any press wins over the ambient timer).
  let picked = "";
  if (props.action) { picked = "laugh"; }
  if (props.up) { picked = "cheer"; }
  if (props.down) { picked = "boo"; }
  if (props.left) { picked = "gasp"; }
  if (props.right) { picked = "sigh"; }

  // Ambient: one effect every ~110 frames, cycling the catalogue via a counter.
  let phase = s.phase;
  let since = s.since + 1;
  if (picked == "") {
    if (since >= 110) {
      since = 0;
      picked = pickEffect(phase);
      phase = phase + 1;
      if (phase > 10) { phase = 0; }
    }
  } else {
    since = 0;
  }

  let ev = [];
  let reactions = s.reactions;
  if (picked != "") {
    ev = [{ kind: "playVoice", id: picked }];
    reactions = reactions + 1;
  }

  return {
    playerSlots: 1,
    entities: {
      stage: { x: 240, y: 210 },
      perf: { x: perfX, y: 150 },
      a0: { x: 80, y: 244 },
      a1: { x: 160, y: 244 },
      a2: { x: 240, y: 244 },
      a3: { x: 320, y: 244 },
      a4: { x: 400, y: 244 }
    },
    t: t,
    phase: phase,
    since: since,
    bob: bob,
    bobDir: bobDir,
    reactions: reactions,
    events: ev
  };
}
