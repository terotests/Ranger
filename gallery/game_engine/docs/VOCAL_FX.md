# Vocal effects (`game_vocal_fx.rgr`)

Predefined **vocal** sound effects — laughter, sighs, gasps, coughs and more —
that a game triggers through the engine ABI.

Self-contained: the module **generates the audio itself** with a small
procedural vocal synth (works headless / SDL / WASM, nothing installed).
Voicebox (https://github.com/jamiepine/voicebox) is only an inspiration for the
paralinguistic tag names (`[laugh]`, `[sigh]`, `[gasp]`, `[cough]`); you may
optionally drop in a nicer WAV render (see below), but nothing requires it.

## Catalogue

| id | tag | native? |
| --- | --- | --- |
| `laugh` `giggle` `chuckle` | `[laugh]` | yes |
| `sigh` | `[sigh]` | yes |
| `gasp` | `[gasp]` | yes |
| `cough` | `[cough]` | yes |
| `cheer` `boo` `hmm` `huh` `yawn` | engine extension | no |

`GameVocalFx.isNative(id)` returns `true` for the first group (real Voicebox
tags); the rest are engine-only, rendered by the same synth.

## Calling it through the ABI

**Event route** (works in every host):

```tsx
function update(props) {
  let ev = [];
  if (props.action) ev = [{ kind: "playVoice", id: "laugh" }];
  return { entities: { face: { x: 60, y: 70 } }, events: ev };
}
```

`GameHost` drains the `playVoice` event and renders it through `GameVocalFx`.

**Native route** — wire `GameVocalFxBridge` as the native bridge, then a script
calls the effect by name (`cheer()`, `boo()`, or `voice("cheer")`):

```ranger
def bridge:GameVocalFxBridge (new GameVocalFxBridge)
bridge.wire(runner.hostRef())
runner.setNativeBridge(bridge)
```

Both routes share the same synth, WAV overrides, and audio sink.

## Overriding the synth with a real WAV

Export a **16-bit mono WAV** and declare it as a `voice` resource; the host
loads it instead of the synth:

```tsx
function resources() {
  return [{ kind: "voice", id: "laugh", path: "laugh.wav" }];
}
```

Then call `host.loadVoiceAsset("laugh")` after the game dir is set (or register
programmatically with `GameVocalFx.registerAssetWav(id, dir, file)`).

## Demo

- [`../games/comedy_club/`](../games/comedy_club/) ("Comedy Club") appears in the
  SDL launcher; controls: `space`=laugh, `up`=cheer, `down`=boo, `left`=gasp,
  `right`=sigh.
- `vocal_fx_demo.game.tsx` is the same game as a Ranger test fixture;
  `vocal_fx_runner_demo.rgr` drives it headless and writes `vocal_fx_demo.wav`.

```bash
npm run engine:vocalfx            # build + run, writes vocal_fx_demo.wav
npm run engine:vocalfx:selftest   # render every effect, print catalogue info
```

## Files

| file | role |
| --- | --- |
| `game_vocal_fx.rgr` | catalogue + procedural synth + WAV overrides |
| `game_vocal_fx_bridge.rgr` | native ABI bridge (`laugh()`, `voice("sigh")`, …) |
| `../../ts_to_ranger/game_host.rgr` | routes `playVoice`, registers `voice` resources |
| `vocal_fx_demo.game.tsx` | demo game (Ranger test fixture) |
| `vocal_fx_runner_demo.rgr` | headless runner + WAV capture |
| `../games/comedy_club/` | the launchable version in the menu |

Each effect is a `VoiceSpec`: a glottal pitch glide, a vowel colour (weighted
formant harmonics), breath-noise mix, optional vibrato, and a burst pattern
shaped by an envelope. Not speech, but "ha-ha-ha", a sigh, a gasp and a cough
are clearly recognisable.
