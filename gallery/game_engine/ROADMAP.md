# Ranger Game Engine — roadmap

> **Päivitetty:** heinäkuu 2026 (WASM Path C, host/Cannon-fysiikka, GPU sheet-spritet)  
> **Tarkoitus:** yhteenveto nykytilasta, puutteista ja jatkokehityksen prioriteeteista.  
> **Liittyvät dokumentit:** [`README.md`](./README.md), [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md), [`RENDERING_EVG.md`](./RENDERING_EVG.md), [`scripting/GAME_ENGINE_DESIGN.md`](./scripting/GAME_ENGINE_DESIGN.md), [`LLVM_BUGS.md`](./LLVM_BUGS.md)

---

## Tiivistelmä

Ranger Game Engine on **ohut, portable 2D-pelimoottorin pohja** Ranger-kääntäjäprojektin
`gallery/game_engine/`-hakemistossa. Se ei ole erillinen kaupallinen moottori (Unity/Godot),
vaan **portability-demonstraatio ja kehitysalusta** tavoitteella:

> Kirjoita pelilogiikka kerran → iteroi Macilla (Node / TSX / WASM) → aja sama logiikka
> natiivina binäärinä Raspberry Pi:llä HDMI-televisioon.

**Nykyinen kypsyys:** PoC laajentunut merkittävästi — TSX-skriptaus, host-fysiikka, Cannon-pinball,
WASM Path C (Rust Pong + Autopeli), synth-äänet, gamepad, sheet-spritet ja GLES2 GPU-overlay.
Tuotantopeli (esim. Koodisampo Pi:llä) vaatii vielä EVG-integraatiota, täyttä GPU-pinoa ja
Pi-deployment-kovennusta.

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
| **WASM Path C** | `wasm/rust_*`, `wasm_game_runner.rgr`, `wasm_physics_runner.rgr` | ✅ PoC (Pong + Autopeli) |
| **Host-fysiikka** | `game_physics.rgr`, `physics_core.rgr` | ✅ Phase 1 |
| **Cannon-fysiikka** | `physics/src/cannon_*.rgr`, `game_cannon_physics.rgr` | ✅ Pinball + sandbox |

### Demo-pelit

| Peli | Polku | Huomio |
|------|-------|--------|
| Pong | TSX | Minimal-malli, ~250 FPS dummy SDL |
| Breakout | TSX | Multi-screen, JSX HUD, split screen |
| Pac-Man | TSX | Split screen + autoscale |
| Invaders | TSX | Stressitesti (~487 entityä, rect-moodi) |
| Pomppija (ylos2) | TSX | Platformer, LPC-sheet, soundscore-musiikki |
| Flipperitorni (pinpall) | TSX + Cannon | Pystypinball, split screen |
| Physics Sandbox | TSX + Cannon | Flipperit, pegs, sheet-animaatiot |
| Autopeli Physics | TSX + host physics | Top-down racer, jaettu maailma |
| Rust Pong | WASM (getter ABI) | Path C PoC |
| Rust Autopeli | WASM (linear ABI) | Fysiikka + host rendering + eventit |

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
| TS→Ranger staattinen käännös | `game_native_runtime.rgr` | ⚠️ P0–P6; invaders/pong/pacman/ylos2 natiivi käännös vihreä — jäljellä: [`NATIVE_PATH_REMAINING.md`](../ts_to_ranger/NATIVE_PATH_REMAINING.md) · [`AGENT_NATIVE_REPAIR.md`](../ts_to_ranger/AGENT_NATIVE_REPAIR.md) |
| Host physics (2D top-down) | `game_physics.rgr` | ✅ Ajoneuvot, kontaktit, shared world |
| Cannon physics | `game_cannon_physics.rgr` | ✅ Pinball, sandbox |
| WASM Path C | `wasm_game_runner.rgr`, `wasm_physics_runner.rgr` | ✅ Getter + RGW1 linear ABI |
| Partikkelit | `game_particles.rgr` | ✅ CPU + GPU overlay |
| Ääni (synth) | `game_audio.rgr` | ✅ Built-in id:t + soundscore |
| Ääni (samplet) | — | ❌ Ei tiedostopohjaista |
| EVG full-frame natiivissa | `RENDERING_EVG.md` | ❌ Suunniteltu |
| GPU (täysi EVG-pino) | `RENDERING_EVG.md` | ❌ Sheet-overlay PoC valmis |

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
| 1c.6 | Toinen kieli (C/C++ → wasm32) | ❌ |
| 1c.7 | WASM CI-smoke kaikille wasm-peleille | ⚠️ demo-skriptit, ei Vitest |

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

## Suunnittelusäännöt (uusille peleille)

Noudatettava malli ([`scripting/GAME_ENGINE_DESIGN.md`](./scripting/GAME_ENGINE_DESIGN.md)):

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
| [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md) | Arkkitehtuuri, HDMI/gamepad, debuggaus |
| [`RENDERING_EVG.md`](./RENDERING_EVG.md) | EVG renderer, GPU-polku |
| [`scripting/GAME_SCRIPTING.md`](./scripting/GAME_SCRIPTING.md) | TSX-skriptaus-API |
| [`scripting/GAME_ENGINE_DESIGN.md`](./scripting/GAME_ENGINE_DESIGN.md) | Retained-mode, ongelmat, prioriteetit |
| [`games/rust_pong/README.md`](./games/rust_pong/README.md) | WASM Path C PoC |
| [`LLVM_BUGS.md`](./LLVM_BUGS.md) | Native build -bugit ja workaroundit |
