/// <reference path="./game.d.ts" />
//
// RANGER TEST FIXTURE — not a launcher game. The playable version lives in
// gallery/game_engine/games/comedy_club/. This copy exists only to drive the
// headless runner (vocal_fx_runner_demo.rgr). See scripting/AGENTS.md.
//
// Vocal-fx demo — "Comedy Club".
//
// A tiny stage where a performer triggers predefined VOCAL effects through the
// engine's audio ABI. Each effect maps to a Voicebox paralinguistic tag
// (https://github.com/jamiepine/voicebox): [laugh], [sigh], [gasp], [cough],
// plus engine-only extensions (cheer, boo, hmm, huh, yawn, giggle, chuckle).
//
// Two ways to fire an effect, both shown here:
//   * event route  — update() returns { kind: "playVoice", id: "laugh" }
//                    (used below; works in every host, static or interpreted).
//   * native route — a script may instead call laugh() / voice("sigh")
//                    directly when GameVocalFxBridge is wired as the ABI.
//
// Input (SDL host):  space=laugh  up=cheer  down=boo  left=gasp  right=sigh
// With no input (headless runner) the crowd auto-reacts on a timer so every
// effect in the catalogue is exercised.

function resources() {
  return [
    { kind: "image", id: "stage", path: "stage.png" },
    // A pre-rendered Voicebox WAV may override the synth for any effect id.
    // Drop laugh.wav next to this file and the host will use it instead.
    { kind: "voice", id: "laugh", path: "laugh.wav" }
  ];
}

function sprites() {
  return [
    { id: "face", kind: "circle", rad: 10, r: 255, g: 210, b: 90 }
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

  // Bob the performer left/right so there is something moving on stage.
  let x = 40 + (t % 80);

  // Interactive triggers (SDL host). Any press wins over the ambient timer.
  let picked = "";
  if (props.action) { picked = "laugh"; }
  if (props.up)     { picked = "cheer"; }
  if (props.down)   { picked = "boo"; }
  if (props.left)   { picked = "gasp"; }
  if (props.right)  { picked = "sigh"; }

  // Ambient auto-reactions: cycle the whole catalogue, one every 15 frames.
  const seq = [
    "laugh", "giggle", "chuckle", "sigh", "gasp", "cough",
    "cheer", "boo", "hmm", "huh", "yawn"
  ];
  if (picked == "" && t % 15 == 0) {
    const idx = (t / 15 - 1) % 11;
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
