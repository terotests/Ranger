# ranger_core/audio

Clip / source / voice primitives, plus higher-level **vocal FX** and **music
score** facades required by ylos2-class ports (CODE_CLEANUP D-MODULES).

**Plan phase:** 8,10 — see [`CODE_CLEANUP_PLAN.md`](../../../../CODE_CLEANUP_PLAN.md).

## Binding decisions

- D-MODULES, D-OWN, D-LIFE, D-ASYNC

## To implement

- `createSource`, listener attach, mixer buses
- `runtime.audio.vocal.play(cue)` — short expressive one-shots
- `runtime.audio.music.play` / `stop` — scored / procedural music
- Both facades lower to clip/source/voice ownership rules (not a parallel lifetime model)

## Unit / contract tests that gate this folder

- audio_api_smoke_headless
- vocal_cue_playOneShot_no_leak
- music_start_stop_releases_or_stops_voices
- ylos2_port_not_blocked_on_missing_facade (contract presence)

---

*Scaffold; facades are contract-required, not optional demos.*
