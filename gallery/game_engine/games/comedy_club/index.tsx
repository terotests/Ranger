/// <reference path="../../scripting/game.d.ts" />
//
// Comedy Club — a tiny stage whose performer triggers predefined VOCAL effects
// through the engine's audio ABI (game_vocal_fx.rgr).
//
// Effects are rendered by the engine's own vocal synth — no external
// dependency. The first four map to Voicebox paralinguistic tags
// ([laugh]/[sigh]/[gasp]/[cough]); the rest are engine extensions. You can
// optionally override any effect with a real 16-bit mono WAV (e.g. rendered in
// the Voicebox app) via a { kind: "voice", id, path } resource.
//
// Controls:  space = laugh   up = cheer   down = boo   left = gasp   right = sigh
// Idle: the crowd auto-reacts on a timer, cycling the whole catalogue.

function sprites() {
  return [
    { id: "face", kind: "circle", rad: 12, r: 255, g: 210, b: 90 }
  ];
}

function initState() {
  return {
    entities: { face: { x: 60, y: 70 } },
    t: 0,
    reactions: 0
  };
}

function update(props) {
  const s = props.state;
  const t = s.t + 1;

  // Bob the performer left/right so the stage has some life.
  let x = 40 + (t % 80);

  // Interactive triggers (any press wins over the ambient timer).
  let picked = "";
  if (props.action) { picked = "laugh"; }
  if (props.up)     { picked = "cheer"; }
  if (props.down)   { picked = "boo"; }
  if (props.left)   { picked = "gasp"; }
  if (props.right)  { picked = "sigh"; }

  // Ambient auto-reactions: cycle the whole catalogue, one every 18 frames.
  const seq = [
    "laugh", "giggle", "chuckle", "sigh", "gasp", "cough",
    "cheer", "boo", "hmm", "huh", "yawn"
  ];
  if (picked == "" && t % 18 == 0) {
    const idx = (t / 18 - 1) % 11;
    picked = seq[idx];
  }

  let ev = [];
  let reactions = s.reactions;
  if (picked != "") {
    ev = [
      { kind: "playSound", id: "blip" },
      { kind: "playVoice", id: picked }
    ];
    reactions = reactions + 1;
  }

  return {
    entities: { face: { x: x, y: 70 } },
    t: t,
    reactions: reactions,
    events: ev
  };
}
