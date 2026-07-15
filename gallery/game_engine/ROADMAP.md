# Ranger Game Engine — roadmap

> **Päivitetty:** heinäkuu 2026 (WASM Path C + AssemblyScript/`.as`-guestit, RGSP1 sprite-ABI, RGU1 EVG-UI, pose-input, streaming-maailma, host/Cannon-fysiikka, GPU sheet-spritet)  
> **Tarkoitus:** yhteenveto nykytilasta, puutteista ja jatkokehityksen prioriteeteista.  
> **Liittyvät dokumentit:** [`README.md`](./README.md), [`IDEAL.md`](./IDEAL.md), [`IDEAL_API.md`](./IDEAL_API.md), [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md), [`RENDERING_EVG.md`](./RENDERING_EVG.md), [`docs/GAME_ENGINE_DESIGN.md`](./docs/GAME_ENGINE_DESIGN.md), [`LLVM_BUGS.md`](./LLVM_BUGS.md)

---

## Tiivistelmä

Ranger Game Engine on **ohut, portable 2D-pelimoottorin pohja** Ranger-kääntäjäprojektin
`gallery/game_engine/`-hakemistossa. Se ei ole erillinen kaupallinen moottori (Unity/Godot),
vaan **portability-demonstraatio ja kehitysalusta** tavoitteella:

> Kirjoita pelilogiikka kerran → iteroi Macilla (Node / TSX / WASM) → aja sama logiikka
> natiivina binäärinä Raspberry Pi:llä HDMI-televisioon.

**Nykyinen kypsyys:** PoC laajentunut merkittävästi — TSX-skriptaus, host-fysiikka, Cannon-pinball,
WASM Path C (Rust **ja** AssemblyScript -guestit, sekä tulkittu `.as`-polku), RGSP1-sprite-ABI
(valmis hahmosetti), RGU1 EVG-UI-kerros, pose-input (RGP1), striimaava resurssimaailma
(RGX1/RGLD), synth-äänet + soundscore, gamepad, sheet-spritet ja GLES2 GPU-overlay.

ABI on nyt myös **dokumentoitu tavoitespesifikaationa**: [`IDEAL.md`](./IDEAL.md) (miksi kukin
rajapinta on kuten on) ja [`IDEAL_API.md`](./IDEAL_API.md) (koko blokki-/import-/event-referenssi).
Suurin avoin arkkitehtuurityö on **ytimen geneerisyys** — pelikohtaisen sanaston (autopeli) poisto
jaetuista headereista, provider-rekisteri ja capability-portin aktivointi. Tuotantopeli
(esim. Koodisampo Pi:llä) vaatii vielä EVG-integraation viimeistelyn, täyden GPU-pinon ja
Pi-deployment-kovennuksen.

---

## Nykytila

### Arkkitehtuuri

```
┌─────────────────────────────────────────────────────────────┐
│  Platform-backend (valitse yksi tai yhdistelmä)              │
│  pong.rgr (terminaali)  |  pong_sdl.rgr (SDL2)               │
│  game_sdl_runner.rgr (TSX + WASM + launcher + GLES2)         │
└───────────────────────────┬─────────────────────────────────┘
                            │ Buttons-snapshot, dt, present
┌───────────────────────────▼─────────────────────────────────┐
│  Pelilogiikka — pure, portable                               │
│  pong_core.rgr  |  initState/update/sprites (TSX)            │
│  logic.wasm (getter tai RGW1 linear ABI)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │ tila (+ physics I/O)
┌───────────────────────────▼─────────────────────────────────┐
│  Fysiikka (opt-in)                                           │
│  game_physics.rgr  |  game_cannon_physics.rgr                │
└───────────────────────────┬─────────────────────────────────┘
                            │ worldEntities, contacts
┌───────────────────────────▼─────────────────────────────────┐
│  Piirtokerros — portable (+ GPU sheet overlay)               │
│  game_sprite.rgr  |  game_hud.rgr  |  game_particles.rgr     │
└───────────────────────────┬─────────────────────────────────┘
                            │ RGBA8888 + GPU textured quads
┌───────────────────────────▼─────────────────────────────────┐
│  framebuffer.rgr — SoftCanvas                                │
└───────────────────────────┬─────────────────────────────────┘
                            │ (SDL-polku)
┌───────────────────────────▼─────────────────────────────────┐
│  gfx_sdl.rgr — SDL2-shim (C++ polyfill, GLES2 present)      │
└─────────────────────────────────────────────────────────────┘
```

**Kova raja:** jos tiedosto kutsuu `write`, `poll_keypress` tai `gfx_present`, se on
backend. Kaikki muu on portable.

### Kehityspolut

| Polku | Tiedostot | Tila |
|-------|-----------|------|
| **Käännetty Ranger-ydin** | `pong_core.rgr`, `pong.rgr`, `pong_sdl.rgr` | ✅ PoC valmis |
| **SDL2-native ikkuna** | `framebuffer.rgr`, `gfx_sdl.rgr`, `pong_sdl.rgr` | ✅ PoC valmis + GLES2 |
| **TSX-skriptaus** | `games/*/index.tsx`, `game_runtime.rgr` | ✅ Tuotantokelpoinen demoihin |
| **WASM Path C** | `wasm/rust_*`, `wasm/as_*`, `wasm_game_runner.rgr`, `wasm_physics_runner.rgr` | ✅ PoC (Rust + AssemblyScript) |
| **`.as` (tulkittu)** | `scripting/as_abi_bridge.rgr`, `scripting/as_source_runner.rgr` | ✅ Sama ABI ilman käännösvaihetta |
| **Sprite-ABI (RGSP1)** | `wasm/wasm_sprite_abi.h`, `wasm_sprite_runner.rgr` | ✅ Valmis hahmosetti, `abi=sprite` |
| **EVG-UI (RGU1)** | `ui/`, `wasm_ui_io.rgr`, `wasm/as_ui_*` | ✅ Interaktiivinen valikko/widget-kerros |
| **Pose-input (RGP1)** | `pose/`, `game_pose_provider.rgr` | ⚠️ PoC (natiivi + MediaPipe) |
| **Streaming (RGX1/RGLD)** | `wasm/rust_worker`, `wasm/as_resource_loader`, `streaming_world_runner.rgr` | ⚠️ PoC (mock-handlet) |
| **Host-fysiikka** | `game_physics.rgr`, `physics_core.rgr` | ✅ Phase 1 |
| **Cannon-fysiikka** | `physics/src/cannon_*.rgr`, `game_cannon_physics.rgr` | ✅ Pinball + sandbox |

### Demo-pelit

| Peli | Kansio | Polku | Huomio |
|------|--------|-------|--------|
| Pong | `pong` | TSX | Minimal-malli, ~250 FPS dummy SDL |
| Breakout | `breakout` | TSX | Multi-screen, JSX HUD, split screen |
| Pac-Man | `pacman` | TSX | Split screen + autoscale |
| Invaders | `invaders` | TSX | Stressitesti (~487 entityä, rect-moodi) |
| Pomppija | `ylos2` | TSX | Platformer, LPC-sheet, soundscore-musiikki |
| Flipperitorni | `pinpall` | TSX + Cannon | Pystypinball, split screen |
| Physics Sandbox | `physics_sandbox` | TSX + Cannon | Flipperit, pegs, sheet-animaatiot |
| Autopeli Physics | `autopeli_physics` | TSX + host physics | Top-down racer, jaettu maailma |
| Rust Pong | `rust_pong` | WASM (getter ABI) | Path C PoC |
| Autot2 (Autopeli) | `autopeli_wasm` | WASM (linear RGW1) | Fysiikka + host rendering + eventit |
| Autopeli (AS / `.as`) | `autopeli_as`, `autopeli_as_src` | WASM (AssemblyScript) + tulkittu | Sama peli AS-guestina ja tulkattuna |
| Pyörretris | `pyorretris` | `.as` (`render=sprites`) | Guest-driven kääntyvät spritet |
| Sprite Test | `sprite_char` | WASM (`abi=sprite`) | Valmis hahmosetti (RGSP1): valinta + kävely/hyppy |
| Pose Demo | `pose_demo` | `.as` + pose | Pose-input (RGP1) -demo |
| Streaming World | `streaming_world` | `engine=streaming` | Resurssistriimaus kameran mukaan (RGX1/RGLD) |
| EVG Effects / UI Menu | `ui_effects`, `ui_menu`, `ui_menu_as` | `engine=ui` | RGU1-valikot ja glow/pulse-efektit (WASM + `.as`) |

### Build-targetit (Pong-viite)

| Target | Pi-native? | Binäärikoko | Huomio |
|--------|:----------:|-------------|--------|
| ES6 / Node | ✅ (tarvitsee Node) | — | Nopein dev-iterointi |
| LLVM + C runtime | ✅ | ~22 KB | **Suositus Pi:lle** (terminaali) |
| C++ | ✅ | ~137 KB | Luonnollinen SDL2-polku |
| Rust | ✅ | ~4.1 MB | Toimii, iso binääri |
| Go | ❌ | — | Keyboard-polyfill vain Windows |
| WASM (wasm3) | ✅ (SDL-host) | moduuli ~KB–MB | Path C, ei erillistä VM:ää selaimessa |

---

## Kypsyysmatriisi

| Moduuli | Sijainti | Tila |
|---------|----------|------|
| Pure game logic | `pong_core.rgr` | ✅ PoC-taso |
| Input-abstraktio (`Buttons`) | `pong_core.rgr`, `game_input.rgr` | ✅ Valmis |
| Gamepad (SDL GameController) | `game_input.rgr`, `gfx_sdl.rgr` | ✅ 1–8 pelaajaa, split-tuki |
| SoftCanvas (RGBA8888) | `framebuffer.rgr` | ✅ Valmis + golden-frame testit |
| Portable renderer | `pong_render.rgr`, `game_sprite.rgr` | ✅ rect/circle/wedge/bitmap/sheet |
| GPU sheet overlay (GLES2) | `gfx_sdl.rgr`, `game_sprite.rgr` | ⚠️ PoC — load-time bake, split-pane |
| Terminaali-backend + debug HUD | `pong.rgr` | ✅ Valmis |
| SDL2-backend | `pong_sdl.rgr`, `gfx_sdl.rgr` | ✅ PoC + GPU present |
| Delta-time SDL-loopissa | `game_sdl_runner.rgr` | ✅ `gfx_ticks_ms()` clampattu |
| LLVM-native build | `scripts/build-native.sh` | ✅ Toimii |
| TSX GameRunner | `game_runtime.rgr` | ✅ Retained sprites, reducer, fysiikka |
| Multi-screen flow | Breakout, Invaders | ✅ Valmis |
| Split screen (2 pane) | `game_split_screen.rgr` | ✅ auto/always/never, GPU split present |
| JSX HUD (kevyt) | `game_hud.rgr` | ⚠️ View/Label, ei täyttä EVG:ä |
| Host bridge (resources/events) | `game_host.rgr` | ⚠️ Data-kerros, ääni/partikkelit toimii |
| TS→Ranger staattinen käännös | `game_native_runtime.rgr` | ⚠️ P0–P6; invaders/pong/pacman/ylos2 natiivi käännös vihreä — [`ts_to_ranger/AGENT_NATIVE_REPAIR.md`](../ts_to_ranger/AGENT_NATIVE_REPAIR.md) |
| Host physics (2D top-down) | `game_physics.rgr` | ✅ Ajoneuvot, kontaktit, shared world |
| Cannon physics | `game_cannon_physics.rgr` | ✅ Pinball, sandbox |
| WASM Path C | `wasm_game_runner.rgr`, `wasm_physics_runner.rgr` | ✅ Getter + RGW1 linear ABI |
| AssemblyScript-guestit | `wasm/as_*` | ✅ Sama ABI kuin Rust-guestit |
| `.as` tulkittu polku | `as_abi_bridge.rgr`, `as_source_runner.rgr` | ✅ Ei käännösvaihetta |
| Sprite-ABI (RGSP1) | `wasm_sprite_runner.rgr`, `wasm_sprite_abi.h` | ✅ Valmis hahmosetti (4 hahmoa) |
| EVG-UI (RGU1) | `ui/`, `wasm_ui_io.rgr` | ✅ Interaktiivinen valikko/widget-kerros |
| Pose-input (RGP1) | `pose/`, `game_pose_provider.rgr` | ⚠️ PoC — headeriton, hostit eri layouteilla |
| Streaming-resurssit (RGX1/RGLD) | `streaming_world_runner.rgr`, `wasm/rust_worker` | ⚠️ PoC — mock-handlet, ei jaettuja headereita |
| Capability-handshake / RGCQ | `wasm_game_abi.h` | ❌ Määritelty, host ei neuvottele |
| Partikkelit | `game_particles.rgr` | ✅ CPU + GPU overlay |
| Ääni (synth) | `game_audio.rgr` | ✅ Built-in id:t + soundscore |
| Ääni (samplet) | — | ❌ Ei tiedostopohjaista (vain voice-WAV-override) |
| EVG full-frame natiivissa | `RENDERING_EVG.md` | ❌ Suunniteltu |
| GPU (täysi EVG-pino) | `RENDERING_EVG.md` | ❌ Sheet-overlay PoC valmis |
| ABI-tavoitespesifikaatio | `IDEAL.md`, `IDEAL_API.md` | ✅ Dokumentoitu; toteutus kesken |

---

## Vahvuudet (mitä hyödyntää)

1. **Todellinen write-once-portability** — sama logiikka Node:ssa, LLVM-natiivissa, SDL2:ssa ja WASM:ssa.
2. **Deterministinen simulaatio** — kokonaisluvut (Pong), golden-frame-testit, input-replay mahdollinen.
3. **Nopea desktop-iterointi** — TSX-skriptit ilman Ranger-uudelleenkääntöä; WASM Rust-build erillisellä komennolla.
4. **Retained-mode + reducer** — `sprites()` kerran, `update()` palauttaa uuden tilan.
5. **Fysiikka opt-in** — host top-down (Autopeli) tai Cannon (pinball); WASM linear ABI jakaa kontaktit.
6. **GPU sheet-spritet** — load-time atlas bake + GLES2 textured quads split-tilassa.
7. **Synth-äänet + soundscore** — ei ulkoisia asset-paketteja perusdemoon.
8. **Gamepad + split screen** — SDL GameController, kaksi paneelia, dual-player Start-yhdistelmä.
9. **EVG-ekosysteemi valmiina** — vektorit, TTF, flexbox, JSX (`gallery/pdf_writer`).
10. **Testipohja** — Vitest: render, runner, Cannon, ääni, fysiikka, headless SDL smoke.

---

## Puutteet (tarkoitukselliset ja toteuttamattomat)

### Tarkoitukselliset non-goals (base)

- Scene graph
- Täysi asset pipeline (kuvat, äänipankit, kartat) — LPC bake osittain: [`LPC_HEADLESS_SPRITESHEET.md`](./LPC_HEADLESS_SPRITESHEET.md)
- Yksi universaali fysiikkamoottori — kaksi erillistä kerrosta (host + Cannon) tarkoituksella

Nämä ovat tulevia kerroksia tai pelikohtaisia ratkaisuja, ei base-moottorin osia.

### Toteuttamattomat / osittaiset

| Puute | Vaikutus |
|-------|----------|
| Invaders suorituskyky rect-moodissa | Stressitesti — sheet/GPU auttaa, refaktorointi avoin |
| SoftCanvas span-fill optimointi | Suuri rect-määrä hidastaa CPU-polku |
| EVG ei natiivissa | Rich UI vain ES6/TSX-polulla |
| Sample-pohjainen ääni | Vain synth-id:t ja soundscore |
| Täysi GPU-renderöinti (EVG → texture) | Vain sheet/base blit + partikkelit |
| WASM tuotantovalmius | PoC — ei hot reload, rajoitettu debug |
| LLVM workarounds | `to_int`, field-less struct |
| Go Pi-target | POSIX keyboard puuttuu |
| Record/replay-työkalu | Suunniteltu, ei paketoitu |
| systemd kiosk-resepti | Dokumentoitu, ei toimitettu |
| Dirty rectangle -seuranta | Backend-optimointi avoin |

---

## Roadmap

### Vaihe 0 — Valmis (heinäkuu 2026)

- [x] Portable Pong-ydin (`pong_core.rgr`) + terminaali-backend
- [x] SDL2 PoC (`pong_sdl.rgr`, `gfx_sdl.rgr`)
- [x] LLVM-native polku (~22 KB) + boolean-field bugi korjattu
- [x] SoftCanvas + golden-frame render-testit
- [x] TSX GameRunner: retained `sprites()`, reducer `update()`, `syncFromState`
- [x] Geneerinen sprite-protokolla (`game_sprite.rgr`: rect/circle/wedge/bitmap/sheet)
- [x] Off-screen / `visible` culling
- [x] Kevyt JSX `hud()` (`game_hud.rgr`)
- [x] Multi-screen (Breakout: play → gameOver)
- [x] Demo-pelit: Pong, Invaders, Breakout, Pacman, Ylos2, Pinpall, Physics Sandbox
- [x] TS→Ranger native runner (kokeellinen)
- [x] Host bridge: resources + events (data-kerros)
- [x] Delta-time SDL-loopissa (`gfx_ticks_ms`, clamp)
- [x] Bitmap + sheet-spritet (PNG blit, load-time bake)
- [x] Synth-äänet (`game_audio.rgr`) + soundscore (`game_soundscore.rgr`)
- [x] Gamepad (SDL GameController, split-pane mapping)
- [x] Split screen (auto/always/never, autoscale, soloScript)
- [x] GPU present (GLES2) + sheet overlay + split-pane present
- [x] Partikkelit (CPU + GPU overlay)
- [x] Host physics Phase 1 (`game_physics.rgr`, Autopeli Physics)
- [x] Cannon physics (`game_cannon_physics.rgr`, Pinpall, Sandbox)
- [x] WASM Path C PoC (Rust Pong getter ABI)
- [x] WASM linear ABI RGW1 (Rust Autopeli: contacts, events, host rendering)

---

### Vaihe 1b — Entity-kerros ja kamera (heinäkuu 2026)

**Tavoite:** yhtenäinen world-entity store; kamera engineen; fixed timestep.
Taaksepäin yhteensopiva vanhan `state.entities`-polun kanssa.

| # | Tehtävä | Tila |
|---|---------|------|
| 1b.1 | `entities()` spawn + `state.worldEntities` | ✅ |
| 1b.2 | Engine-kamera (`camera()`, follow, smoothing, bounds) | ✅ |
| 1b.3 | Automaattinen world→screen + culling | ✅ |
| 1b.4 | `config().physics.fixedStep` fixed timestep | ✅ |
| 1b.5 | body/collider/trigger-komponentit (geneerinen) | ⚠️ Cannon + host physics erikseen |
| 1b.6 | Valmiit controllerit (platformer, top-down, …) | ❌ Vaihe 3 |

---

### Vaihe 1 — Suorituskyky ja oikeellisuus (lyhyt aikaväli)

**Tavoite:** skriptatut pelit skaalautuvat 60 FPS:iin; CPU-polku optimoitu.

| # | Tehtävä | Tiedostot | Prioriteetti | Tila |
|---|---------|-----------|:------------:|:----:|
| 1.1 | Todellinen delta-time SDL-loopissa | `game_sdl_runner.rgr` | 🔴 Korkea | ✅ |
| 1.2 | Sprite atlas + bitmap/sheet blit | `framebuffer.rgr`, `game_sprite.rgr` | 🔴 Korkea | ✅ |
| 1.3 | SoftCanvas optimointi: span-fill / rivikohtainen täyttö | `framebuffer.rgr` | 🟡 Keskitaso | ❌ |
| 1.4 | Invaders-refaktorointi: 1 sprite/alien (ei pixel-per-rect) | `invaders.game.tsx` | 🟡 Keskitaso | ❌ |
| 1.5 | Dirty rectangle -seuranta (backend-optimointi) | `framebuffer.rgr`, backends | 🟢 Matala | ❌ |
| 1.6 | LPC headless spritesheet bake + `kind: "sheet"` | [`lpc/`](./lpc/), `game_sprite.rgr` | 🟡 Keskitaso | ⚠️ sheet toimii, LPC bake osittain |
| 1.7 | GPU sheet overlay laajennus (kaikki pelit, ARM-tuning) | `gfx_sdl.rgr`, `game_sprite.rgr` | 🟡 Keskitaso | ⚠️ PoC |

**Onnistumiskriteerit:**

- Invaders ≥ 30 FPS 480 entityllä (sheet/GPU-polulla) tai refaktoroitu sprite-malli
- `update({ dt })` saa mitatun `dt`:n ✅
- Uusi peli voi käyttää `kind: "bitmap"` / `kind: "sheet"` ✅

---

### Vaihe 1c — WASM Path C laajennus (rinnakkainen)

**Tavoite:** WASM tuotantokelpoisemmaksi portability-polkuksi.

| # | Tehtävä | Tila |
|---|---------|------|
| 1c.1 | Getter ABI (Rust Pong) | ✅ |
| 1c.2 | RGW1 linear ABI (input, contacts, events) | ✅ |
| 1c.3 | Host resource imports (`rg_host_register_*`) | ✅ |
| 1c.4 | Host rendering bridge (Autopeli road + sprites) | ✅ |
| 1c.5 | WASM hot reload / dev loop | ❌ |
| 1c.6 | Toinen guest-kieli | ✅ AssemblyScript (`wasm/as_*`) + tulkittu `.as`-polku; C/C++ vielä auki |
| 1c.7 | WASM CI-smoke kaikille wasm-peleille | ⚠️ demo-skriptit, ei Vitest |
| 1c.8 | RGSP1-sprite-ABI (valmis hahmosetti) | ✅ `sprite_char` + `wasm_sprite_runner.rgr` |
| 1c.9 | RGU1 EVG-UI-ABI (retained-mode valikot) | ✅ `ui_menu` / `ui_effects` + `wasm_ui_io.rgr` |
| 1c.10 | Pose-input-ABI (RGP1) | ⚠️ PoC — ei jaettua headeria, hostit eri layouteilla |

---

### Vaihe 2 — Platform-API ja Pi-deployment (keskipitkä aikaväli)

**Tavoite:** keskitetty gfx/pad-API, täysi ääni, natiivi Pi-kokemus.

| # | Tehtävä | Tiedostot | Prioriteetti | Tila |
|---|---------|-----------|:------------:|:----:|
| 2.1 | `gfx_*` / `pad_*` operaattorit `Lang.rgr`:ään | `compiler/Lang.rgr` | 🔴 Korkea | ❌ |
| 2.2 | `runtime/ranger_gfx.c` (SDL2 shim) | `runtime/` | 🔴 Korkea | ❌ |
| 2.3 | SDL GameController → `Buttons`-mapping | `game_input.rgr` | 🔴 Korkea | ✅ |
| 2.4 | Sample-ääni: WAV/OGG `resources()`-rekisteristä | `game_audio.rgr` | 🔴 Korkea | ❌ |
| 2.5 | LLVM: `to_int`-template | `compiler/ng_LowIR*.rgr` | 🟡 Keskitaso | ❌ |
| 2.6 | LLVM: field-less class struct -emissio | `compiler/` | 🟡 Keskitaso | ❌ |
| 2.7 | Go POSIX keyboard polyfill | `lib/stdops.rgr` / polyfill | 🟡 Keskitaso | ❌ |
| 2.8 | TV safe-area + integer scale backendissa | SDL backend | 🟡 Keskitaso | ❌ |
| 2.9 | Input record/replay -työkalu | uusi `tools/` tai `scripting/` | 🟢 Matala | ❌ |
| 2.10 | systemd autostart -resepti Pi kioskille | `scripts/`, docs | 🟢 Matala | ❌ |

**Onnistumiskriteerit:**

- USB/Bluetooth gamepad toimii Pi:llä ilman pelilogiikan muutosta ✅ (SDL-polku)
- `playSound("blip")` kuuluu SDL-ikkunassa ✅ (synth)
- Yksi `npm run`-komento tuottaa Pi-valmiin SDL-binäärin ❌

---

### Vaihe 3 — EVG-integraatio (keskipitkä aikaväli)

**Tavoite:** rich UI ja grafiikka natiivipeleissä; yhtenäinen render-pino.

| # | Tehtävä | Kuvaus | Prioriteetti |
|---|---------|--------|:------------:|
| 3.1 | `EVGRasterRenderer` HUD:lle | TTF-fontit, varjot, gradientit | 🔴 Korkea |
| 3.2 | C++ backend EVG-korjaukset natiiville | `gallery/pdf_writer` raster | 🔴 Korkea |
| 3.3 | `world()` JSX — staattiset taustaelementit EVG:llä | skriptaus-API | 🟡 Keskitaso |
| 3.4 | Täysi `render({ state })` → koko frame EVG:llä | `game_runtime.rgr` | 🟡 Keskitaso |
| 3.5 | Asset loading: kuvat/fontit `resources()`-rekisteristä | `game_host.rgr` | 🟡 Keskitaso |
| 3.6 | **Interaktiivinen UI-kerros** (napit, tekstikentät, raahattavat laatikot, software-näppäimistö, valinnan korostus, TTF-tekstin rivitys + glyph-cache) | [`ui/UI_LAYER.md`](./ui/UI_LAYER.md) | ✅ Valmis (portable; jäljellä `gfx_mouse_*`-operaattori) |

**Vaiheittainen polku** (ks. [`RENDERING_EVG.md`](./RENDERING_EVG.md)):

1. ✅ `hud()` kevyellä EVGLayout-blitterillä
2. ⚠️ GPU sheet/base blit (PoC, ei täyttä EVG:ä)
3. `world()` JSX + retained spritet päälle
4. Täysi EVG-frame GameRunnerissa
5. GPU-backend (vaihe 4)

---

### Vaihe 4 — GPU ja tuotantopeli (pitkä aikaväli)

**Tavoite:** 720p@60fps Pi:llä; ensimmäinen oikea tuotantopeli.

| # | Tehtävä | Kuvaus | Tila |
|---|---------|--------|:----:|
| 4.1 | WebGL/GLES2 backend Pi:lle | EVG → GPU texture upload | ⚠️ sheet/base PoC |
| 4.1a | Ranger2D GPU-camera (R1b) | ortho-Camera2D 4×4 viewProj-uniformina, [`PLAN_RANGER2D.md`](./PLAN_RANGER2D.md) | ✅ |
| 4.1b | Striimaava spatiaalinen maailma | grid + culling + kamera-prefetch + decode-worker (RGX1/RGLD), [`PLAN_RANGER2D_STREAMING.md`](./PLAN_RANGER2D_STREAMING.md) | ⚠️ PoC — pää­stä­päähän wasm3:lla, mock-handlet + synk. decode |
| 4.2 | Asset pipeline | Sprite sheetit, äänipankit, collision mapit | ❌ |
| 4.3 | Collision-työkalut | Pelikohtaiset tai kevyt tile-map -kerros | ❌ |
| 4.3a | Host physics engine (Phase 1) | `game_physics.rgr` — bodies, bounds, contacts | ✅ |
| 4.3b | Cannon physics | Pinball, flipperit, sandbox | ✅ |
| 4.4 | Tuotantopeli: Koodisampo Pi:llä | README:n mainitsema seuraava oikea peli | ❌ |
| 4.5 | `<canvas>` ES6 dev-backend | Selain-kiosk debug | ❌ |
| 4.6 | WASM Path C tuotantopeli | Rust/C logiikka + host render | ⚠️ Autopeli PoC |

---

### Vaihe 5 — ComponentEngine / skriptaus (rinnakkainen)

Nämä parantavat TSX-skriptauksen ilmaisuvoimaa; eivät estä vaiheita 1–4.

| Tehtävä | Tila |
|---------|------|
| `while`-loopit | ✅ |
| Member assignment | ✅ |
| Nested `callFunction` | ✅ |
| `getGlobal` / `moduleScope` | ✅ |
| `return` loopin sisällä | ❌ |
| Unicode `//`-kommentit natiivissa | ❌ |
| `**` precedenssi | ❌ |

---

### Vaihe 6 — ABI-yhtenäistäminen ja ytimen geneerisyys (IDEAL)

**Tavoite:** ydin ei tunne yhtäkään yksittäistä peliä — sama runner ajaa toisen fysiikkapelin
ilman ydinmuutoksia. Suunta on määritelty: [`IDEAL.md`](./IDEAL.md) (perustelut, nykytila vs.
ideaali) ja [`IDEAL_API.md`](./IDEAL_API.md) (koko ABI-referenssi).

| # | Tehtävä | Tila |
|---|---------|------|
| 6.1 | Pelisanaston (autopeli, steer/throttle, traffic, hero/knight) poisto jaetuista headereista → guest-lähteeseen | ❌ |
| 6.2 | Geneeriset kontrollikanavat (`readControlChannel` steer/throttle/brake/grip tilalle) | ❌ |
| 6.3 | `GameSceneProvider`-sauma: runner ei importtaa `wasm_autopeli_setup/render`ia | ❌ |
| 6.4 | Yksi maailman omistaja: guest julistaa bodyt/rajat/koon declare-once-kanavalla, host-kopio poistetaan | ❌ |
| 6.5 | Capability-handshake + portin aktivointi (`rg_required_caps`/`rg_check_env`/RGCQ) | ❌ |
| 6.6 | Provider-rekisteri (pose/resource/scene) — capability-bitti + suunta + kadenssi | ⚠️ `game_pose_provider.rgr` olemassa, ei rekisteriä |
| 6.7 | Headerit informaaleille blokeille (RGP1, RGS1, RGX1, RGLD) + jaettu validointi | ❌ |
| 6.8 | Path-pariteetti: pose/draw-list/resource-manifest/sound-queue myös käännetylle WASM-polulle | ❌ |
| 6.9 | Leak-guard-grep CI:hin + toinen host-fysiikkapeli regressiofikstuurina | ❌ |

---

## Suunnittelusäännöt (uusille peleille)

Noudatettava malli ([`docs/GAME_ENGINE_DESIGN.md`](./docs/GAME_ENGINE_DESIGN.md)):

1. **`sprites()` kerran alussa** — retained-mode; muoto/väri/koko eivät muutu runtime-aikana.
2. **`update()` palauttaa uuden tilan** — reducer-tyyli; vain muuttuneet sijainnit.
3. **JSX vain HUD:iin** — maailma retained-spriteillä, ei JSX:ää joka frame.
4. **Yksi sprite per objekti** — ei yhtä rectiä per pikseli (Invaders on vain stressitesti).
5. **Kuolleet objektit: `visible: 0`** — runner ohittaa piirron.
6. **Multi-screen: `state.screen` + `state.screens[name]`** — Breakout-malli.
7. **Fysiikka opt-in** — `config().physics` + `state.physics` / Cannon entity-kentät.
8. **Sheet-spritet suurelle määrälle animaatiota** — `kind: "sheet"` GPU-overlayn kanssa.

> **Yhteenveto:** Sprites kerran alussa, sijainnit reducerilla joka framella, JSX vain HUD:iin.

---

## Testaus ja CI

### Nykyinen kattavuus

| Testi | Mitä testaa |
|-------|-------------|
| `tests/game-engine-render.test.ts` | SoftCanvas pikselit, SDL headless |
| `tests/game-runner.test.ts` | Pong, Invaders, Breakout, Pacman, ääni, fysiikka, Ylos |
| `tests/game-scripting.test.ts` | Global injection, reducer dispatch |
| `tests/physics-cannon.test.ts` | Cannon.js -portti |
| `tests/tsx-engine.test.ts` | ComponentEngine korjaukset |
| `tests/ts-to-ranger-native.test.ts` | Staattinen TS→Ranger parity |
| `tests/ts-to-ranger-host.test.ts` | Resource/event bridge |
| `engine:wasm:demo:*` | WASM Pong + Autopeli headless (skriptit) |
| `engine:game-sdl:smoke:*` | SDL dummy-driver smoke (TSX + WASM) |

### Roadmap-testit (lisättävät)

- [x] Delta-time regressio (`dt`-riippuvainen liike) — SDL-loop mittaa dt:n
- [x] Bitmap/sheet blit — demo-pelit + runner-testit
- [x] Äänitapahtuman mock-toisto — `audio_runner_demo`, Vitest
- [ ] Gamepad input mapping (simuloitu)
- [ ] Cross-target determinismi (ES6 vs native hash)
- [ ] WASM Vitest-integraatio (nyt erilliset demo-skriptit)

---

## Viitteet ja komennot

```bash
# Terminaali-Pong
npm run engine:run

# SDL2-ikkuna
npm run engine:sdl:run

# TSX-pelit
npm run engine:game-sdl:launcher
npm run engine:game-sdl:run:breakout
npm run engine:game-sdl:run:ylos2
npm run engine:game-sdl:run:physics_sandbox
npm run engine:game-sdl:smoke:invaders

# WASM-pelit
npm run engine:wasm:demo:pong
npm run engine:wasm:demo:autopeli
npm run engine:game-sdl:run:rust-pong
npm run engine:game-sdl:run:rust-autopeli

# Valmis hahmosetti (RGSP1 sprite-ABI)
npm run engine:chars:bake            # bake 4 hahmoa -> lpc/pack/characters/
npm run engine:game-sdl:run:sprite   # WASM-testipeli: hahmon valinta + kävely/hyppy

# Muut pelit (pose, streaming, EVG UI) launcherista:
npm run engine:game-sdl:launcher

# Fysiikka
npm run engine:physics:test

# LLVM-native (~22 KB)
npm run engine:build:native

# Testit
npm test -- game-engine game-runner game-scripting physics-cannon
```

| Dokumentti | Sisältö |
|------------|---------|
| [`README.md`](./README.md) | Quick start, layer stack, build-targetit, WASM, fysiikka |
| [`IDEAL.md`](./IDEAL.md) | Tavoiteltu ABI-suunnittelu: nykytila vs. ideaali, ytimen geneerisyys |
| [`IDEAL_API.md`](./IDEAL_API.md) | Koko ABI yhtenä referenssinä: blokit, importit, eventit, capability-bitit |
| [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md) | Arkkitehtuuri, HDMI/gamepad, debuggaus |
| [`RENDERING_EVG.md`](./RENDERING_EVG.md) | EVG renderer, GPU-polku |
| [`docs/GAME_SCRIPTING.md`](./docs/GAME_SCRIPTING.md) | TSX-skriptaus-API |
| [`docs/GAME_ENGINE_DESIGN.md`](./docs/GAME_ENGINE_DESIGN.md) | Retained-mode, ongelmat, prioriteetit |
| [`games/rust_pong/README.md`](./games/rust_pong/README.md) | WASM Path C PoC |
| [`LLVM_BUGS.md`](./LLVM_BUGS.md) | Native build -bugit ja workaroundit |
