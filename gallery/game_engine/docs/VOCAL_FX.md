# Vocal effects (`game_vocal_fx.rgr`)

Predefined **vocal** sound effects for the game engine — laughter, sighs,
gasps, coughs and more — that a game triggers through the engine ABI.

## No dependency on Voicebox

This module does **not** link to, bundle, or call
[Voicebox](https://github.com/jamiepine/voicebox) (or any external app) at
build or run time. It is self-contained Ranger:

- It **generates the audio itself** with a small procedural vocal synth
  (`render()` → PCM `buffer`), so every effect works headless / SDL / WASM
  with nothing installed.
- The only touchpoints with Voicebox are (1) a borrowed *naming convention*
  for the paralinguistic tags (`[laugh]`, `[sigh]`, `[gasp]`, `[cough]`), and
  (2) an **optional** WAV-asset hook: you can author a nicer render in the
  Voicebox app, export a 16-bit mono WAV, and register it as a `voice`
  resource — the engine then plays that file instead of the synth. That is
  just reading a `.wav` from disk; nothing requires Voicebox.

So the intended workflow is: *optionally* create assets with Voicebox (or any
tool), drop them in, and the engine plays them by id — otherwise the built-in
synth covers the same ids.

## Catalogue

| id        | tag       | source           |
| --------- | --------- | ---------------- |
| `laugh`   | `[laugh]` | Voicebox tag     |
| `giggle`  | `[laugh]` | Voicebox tag     |
| `chuckle` | `[laugh]` | Voicebox tag     |
| `sigh`    | `[sigh]`  | Voicebox tag     |
| `gasp`    | `[gasp]`  | Voicebox tag     |
| `cough`   | `[cough]` | Voicebox tag     |
| `cheer`   | `[cheer]` | engine extension |
| `boo`     | `[boo]`   | engine extension |
| `hmm`     | `[hmm]`   | engine extension |
| `huh`     | `[huh]`   | engine extension |
| `yawn`    | `[yawn]`  | engine extension |

The first six correspond to real Voicebox paralinguistic tags
(`GameVocalFx.isNative(id)` returns `true`); the rest are engine-only
extensions rendered by the same synth.

## Two ways to call it through the ABI

### 1. Event route (works in every host, static or interpreted)

```tsx
function update(props) {
  let ev = [];
  if (props.action) ev = [{ kind: "playVoice", id: "laugh" }];
  return { entities: { face: { x: 60, y: 70 } }, events: ev };
}
```

`GameHost` drains the `playVoice` event and renders it through `GameVocalFx`.

### 2. Native route (direct function call)

Wire `GameVocalFxBridge` as the engine's native bridge and a script may call
the effect by name:

```tsx
function update(props) {
  if (props.up) cheer();       // or: voice("cheer")
  if (props.down) boo();
  return { entities: { face: { x: 60, y: 70 } } };
}
```

```ranger
def bridge:GameVocalFxBridge (new GameVocalFxBridge)
bridge.wire(runner.hostRef())
runner.setNativeBridge(bridge)
```

Both routes share the same synth, the same optional WAV overrides, and the
same audio sink.

## Overriding the synth with a real (e.g. Voicebox) render

Export a **16-bit mono WAV** and declare it as a `voice` resource; the host
loads it and uses it instead of the synth:

```tsx
function resources() {
  return [{ kind: "voice", id: "laugh", path: "laugh.wav" }];
}
```

Then call `host.loadVoiceAsset("laugh")` after the game dir is set (or register
programmatically with `GameVocalFx.registerAssetWav(id, dir, file)`).

## Demo

- A launchable game lives at `../games/comedy_club/` ("Comedy Club") — it shows
  up in the SDL launcher and maps controls to effects
  (`space`=laugh, `up`=cheer, `down`=boo, `left`=gasp, `right`=sigh).
- `vocal_fx_demo.game.tsx` (here in `scripting/`) is the same game as a **Ranger
  test fixture**; `vocal_fx_runner_demo.rgr` drives it headless, exercises both
  ABI routes, and writes an audible `vocal_fx_demo.wav`.

```bash
npm run engine:vocalfx            # build + run, writes vocal_fx_demo.wav
npm run engine:vocalfx:selftest   # render every effect, print catalogue info
```

## Files

| file                          | role                                                    |
| ----------------------------- | ------------------------------------------------------- |
| `game_vocal_fx.rgr`           | catalogue + procedural vocal synth + WAV overrides      |
| `game_vocal_fx_bridge.rgr`    | native ABI bridge (`laugh()`, `voice("sigh")`, …)       |
| `../../ts_to_ranger/game_host.rgr` | routes `playVoice` events, registers `voice` resources |
| `vocal_fx_demo.game.tsx`      | demo game (Ranger test fixture)                         |
| `vocal_fx_runner_demo.rgr`    | headless runner + WAV capture                           |
| `../games/comedy_club/`       | the launchable version that appears in the menu         |

## How the synth works

Each effect is a `VoiceSpec`: a glottal pitch glide (`basePitchHz` →
`endPitchHz`), a vowel colour (a few weighted formant harmonics: `ah`, `oo`,
`ee`, `uh`, `mm`), a breath-noise mix, optional vibrato, and a burst pattern
(`bursts` × `burstMs` with `gapMs` gaps) shaped by an envelope
(`pluck` / `swell` / `rise` / `fall`). It is not speech, but "ha-ha-ha", a
breathy sigh, a sharp gasp and a cough are all clearly recognisable.
