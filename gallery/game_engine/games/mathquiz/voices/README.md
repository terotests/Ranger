# Spoken voice assets for Laskupeli

Drop **real** spoken recordings here to give the quiz a human voice. Until you
do, the game just plays the built-in synth cheer/sigh — everything still works.

## Convention: `<id>[-<lang>].wav` + a sibling `<id>[-<lang>].info`

- `good-fi.wav` — the audio (played when the answer is right).
- `good-fi.info` — key=value metadata:
  ```
  lang=fi
  text=Hyvä!
  ```

The engine auto-loads the WAV (declared in `index.tsx` `resources()`) and reads
the `.info` (`GameVocalFx.textFor(id)` → subtitle / accessibility / future TTS
or language switching — `lang=` is stored now, though there is no runtime
language switch yet).

## Needed for this game

| id         | says (fi)            | when              |
| ---------- | -------------------- | ----------------- |
| `good-fi`  | "Hyvä!"              | correct answer    |
| `wrong-fi` | "Yritä uudelleen"    | wrong answer      |

(English versions would be `good-en.wav` + `good-en.info` with `lang=en`,
`text=Well done!` — the game would need to pick the id per its language.)

## Audio format

**16-bit mono PCM WAV @ 44100 Hz.** Stereo is auto-downmixed; other rates play
at the wrong speed. Convert anything with:

```bash
ffmpeg -i recording.wav -ac 1 -ar 44100 -sample_fmt s16 good-fi.wav
```

You can record these yourself, or generate them (e.g. with the Voicebox app /
any TTS) on a machine with the models available.
