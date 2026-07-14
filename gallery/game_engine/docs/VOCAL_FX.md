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

## Getting genuinely human-sounding voices (real WAV overrides)

The built-in synth is a placeholder — formants + breath + jitter. It is
recognisably "ha-ha", but it is **not** a human voice. For human-sounding
laughter you drop in real recordings; the engine then plays the file instead of
the synth, per effect id.

1. **Generate** on your own machine (paralinguistic audio needs a model that
   interprets the tags, e.g. [Voicebox](https://github.com/jamiepine/voicebox)
   Chatterbox Turbo: `[laugh] [chuckle] [gasp] [cough] [sigh] [groan] …`). Any
   source works — a Voicebox render, a recording, or a CC0 clip.
2. **Convert** to **16-bit mono PCM WAV @ 44100 Hz** (the device rate; stereo is
   auto-downmixed, other rates play at the wrong speed):
   `ffmpeg -i in.wav -ac 1 -ar 44100 -sample_fmt s16 voices/laugh.wav`
3. **Declare** it — `setupResources` auto-loads it (missing files fall back to
   the synth, so nothing crashes):

```tsx
function resources() {
  return [{ kind: "voice", id: "laugh", path: "voices/laugh.wav" }];
}
```

The WAV loader walks the RIFF chunks, so real files (with `LIST`/`fact`/…
chunks before `data`) load fine. Programmatic API:
`GameVocalFx.registerAssetWav(id, dir, file)` / `host.loadVoiceAsset(id)`.
Any effect id without a WAV keeps the synth, so you can replace one at a time.

## Demo

- `vocal_fx_demo.game.tsx` is the vocal-fx demo game as a Ranger test fixture;
  `vocal_fx_runner_demo.rgr` drives it headless and writes `vocal_fx_demo.wav`.
  Controls: `space`=laugh, `up`=cheer, `down`=boo, `left`=gasp, `right`=sigh.

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

Each effect is a `VoiceSpec`: a glottal pitch glide, a vowel colour (weighted
formant harmonics), breath-noise mix, optional vibrato, and a burst pattern
shaped by an envelope. Not speech, but "ha-ha-ha", a sigh, a gasp and a cough
are clearly recognisable.
