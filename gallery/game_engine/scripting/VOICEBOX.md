# Voicebox vocal effects

Predefined **vocal** sound effects for the game engine — laughter, sighs,
gasps, coughs and more — that a game triggers through the engine ABI.

Inspired by [Voicebox](https://github.com/jamiepine/voicebox), whose
*Chatterbox Turbo* TTS interprets paralinguistic tags like `[laugh]`,
`[sigh]`, `[gasp]` and `[cough]`. This module gives the engine a small
catalogue of *named* effects mapped to those tags, rendered by a built-in
procedural vocal synth so they work everywhere (headless tests, SDL, WASM)
with no desktop app — and each one can be swapped for a real Voicebox WAV.

## Catalogue

| id        | Voicebox tag | source            |
| --------- | ------------ | ----------------- |
| `laugh`   | `[laugh]`    | Voicebox tag      |
| `giggle`  | `[laugh]`    | Voicebox tag      |
| `chuckle` | `[laugh]`    | Voicebox tag      |
| `sigh`    | `[sigh]`     | Voicebox tag      |
| `gasp`    | `[gasp]`     | Voicebox tag      |
| `cough`   | `[cough]`    | Voicebox tag      |
| `cheer`   | `[cheer]`    | engine extension  |
| `boo`     | `[boo]`      | engine extension  |
| `hmm`     | `[hmm]`      | engine extension  |
| `huh`     | `[huh]`      | engine extension  |
| `yawn`    | `[yawn]`     | engine extension  |

The first six correspond to real Voicebox paralinguistic tags
(`GameVoicebox.isNative(id)` returns `true`); the rest are engine-only
extensions rendered by the same synth.

## Two ways to call it through the ABI

### 1. Event route (works in every host, static or interpreted)

`update()` returns a `playVoice` event; `GameHost` renders it:

```tsx
function update(props) {
  let ev = [];
  if (props.action) ev = [{ kind: "playVoice", id: "laugh" }];
  return { entities: { face: { x: 60, y: 70 } }, events: ev };
}
```

### 2. Native route (direct function call)

Wire `GameVoiceboxBridge` as the engine's native bridge and a script may call
the effect by name:

```tsx
function update(props) {
  if (props.up) cheer();       // or: voice("cheer")
  if (props.down) boo();
  return { entities: { face: { x: 60, y: 70 } } };
}
```

```ranger
def bridge:GameVoiceboxBridge (new GameVoiceboxBridge)
bridge.wire(runner.hostRef())
runner.setNativeBridge(bridge)
```

Both routes share the same synth, the same optional WAV overrides, and the
same audio sink.

## Overriding the synth with a real Voicebox render

Render an effect in the Voicebox app, export a **16-bit mono WAV**, and declare
it as a `voice` resource; the host loads it and uses it instead of the synth:

```tsx
function resources() {
  return [{ kind: "voice", id: "laugh", path: "laugh.wav" }];
}
```

Then call `host.loadVoiceAsset("laugh")` after the game dir is set (or register
programmatically with `GameVoicebox.registerAssetWav(id, dir, file)`).

## Demo

- `voicebox_demo.game.tsx` — a "Comedy Club" mini-game that cycles the whole
  catalogue on a timer and maps controls to effects
  (`space`=laugh, `up`=cheer, `down`=boo, `left`=gasp, `right`=sigh).
- `voicebox_runner_demo.rgr` — drives the game headless, exercises **both** ABI
  routes, and writes an audible `voicebox_demo.wav` (mono, 44.1 kHz) so you can
  hear every effect.

```bash
npm run engine:voicebox            # build + run, writes voicebox_demo.wav
npm run engine:voicebox:selftest   # render every effect, print catalogue info
```

## Files

| file                       | role                                                    |
| -------------------------- | ------------------------------------------------------- |
| `game_voicebox.rgr`        | catalogue + procedural vocal synth + WAV overrides      |
| `game_voicebox_bridge.rgr` | native ABI bridge (`laugh()`, `voice("sigh")`, …)       |
| `../../ts_to_ranger/game_host.rgr` | routes `playVoice` events, registers `voice` resources |
| `voicebox_demo.game.tsx`   | demo game                                               |
| `voicebox_runner_demo.rgr` | headless runner + WAV capture                           |

## How the synth works

Each effect is a `VoiceSpec`: a glottal pitch glide (`basePitchHz` →
`endPitchHz`), a vowel colour (a few weighted formant harmonics: `ah`, `oo`,
`ee`, `uh`, `mm`), a breath-noise mix, optional vibrato, and a burst pattern
(`bursts` × `burstMs` with `gapMs` gaps) shaped by an envelope
(`pluck` / `swell` / `rise` / `fall`). It is not speech, but "ha-ha-ha", a
breathy sigh, a sharp gasp and a cough are all clearly recognisable.
