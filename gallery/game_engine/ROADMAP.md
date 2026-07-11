# Ranger Game Engine — roadmap

> **Päivitetty:** heinäkuu 2026  
> **Tarkoitus:** yhteenveto nykytilasta, puutteista ja jatkokehityksen prioriteeteista.  
> **Liittyvät dokumentit:** [`README.md`](./README.md), [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md), [`RENDERING_EVG.md`](./RENDERING_EVG.md), [`MOBILE_PORTING.md`](./MOBILE_PORTING.md), [`scripting/GAME_ENGINE_DESIGN.md`](./scripting/GAME_ENGINE_DESIGN.md), [`LLVM_BUGS.md`](./LLVM_BUGS.md)

---

## Tiivistelmä

Ranger Game Engine on **ohut, portable 2D-pelimoottorin pohja** Ranger-kääntäjäprojektin
`gallery/game_engine/`-hakemistossa. Se ei ole erillinen kaupallinen moottori (Unity/Godot),
vaan **portability-demonstraatio ja kehitysalusta** tavoitteella:

> Kirjoita pelilogiikka kerran → iteroi Macilla (Node / TSX) → aja sama logiikka
> natiivina binäärinä Raspberry Pi:llä HDMI-televisioon.

**Nykyinen kypsyys:** PoC valmis ja laajentunut TSX-skriptauskerroksella. Tuotantopeli
(esim. Koodisampo Pi:llä) vaatii vielä suorituskyky-, ääni-, gamepad- ja EVG-integraatiota.

---

## Nykytila

### Arkkitehtuuri

```
┌─────────────────────────────────────────────────────────────┐
│  Platform-backend (valitse yksi)                             │
│  pong.rgr (terminaali)  |  pong_sdl.rgr (SDL2)               │
│  game_sdl_runner.rgr + *.game.tsx (skriptattu peli)          │
└───────────────────────────┬─────────────────────────────────┘
                            │ Buttons-snapshot, step/draw
┌───────────────────────────▼─────────────────────────────────┐
│  Pelilogiikka — pure, portable                               │
│  pong_core.rgr  |  initState/update/sprites (TSX)            │
└───────────────────────────┬─────────────────────────────────┘
                            │ tila (kokonaisluvut, booleanit)
┌───────────────────────────▼─────────────────────────────────┐
│  Piirtokerros — portable                                     │
│  pong_render.rgr  |  game_sprite.rgr  |  game_hud.rgr      │
└───────────────────────────┬─────────────────────────────────┘
                            │ RGBA8888-pikselit
┌───────────────────────────▼─────────────────────────────────┐
│  framebuffer.rgr — SoftCanvas                                │
└───────────────────────────┬─────────────────────────────────┘
                            │ (SDL-polku)
┌───────────────────────────▼─────────────────────────────────┐
│  gfx_sdl.rgr — SDL2-shim (C++ polyfill)                      │
└─────────────────────────────────────────────────────────────┘
```

**Kova raja:** jos tiedosto kutsuu `write`, `poll_keypress` tai `gfx_present`, se on
backend. Kaikki muu on portable.

### Kolme kehityspolkua

| Polku | Tiedostot | Tila |
|-------|-----------|------|
| **Käännetty Ranger-ydin** | `pong_core.rgr`, `pong.rgr`, `pong_sdl.rgr` | ✅ PoC valmis |
| **SDL2-native ikkuna** | `framebuffer.rgr`, `gfx_sdl.rgr`, `pong_sdl.rgr` | ✅ PoC valmis |
| **TSX-skriptaus** | `scripting/*.game.tsx`, `game_runtime.rgr` | ✅ Merkittävä |

### Demo-pelit (TSX)

| Peli | Entityjä | FPS (dummy SDL) | Huomio |
|------|----------|-----------------|--------|
| Pong | 3 | ~250 | Minimal-malli, suositeltu pohja |
| Breakout | 52 | ~150+ | JSX `hud()`, multi-screen |
| Pacman | — | — | Skriptattu demo |
| Invaders | ~487 | ~8 | **Stressitesti** — ei tuotantomalli |

### Build-targetit (Pong-viite)

| Target | Pi-native? | Binäärikoko | Huomio |
|--------|:----------:|-------------|--------|
| ES6 / Node | ✅ (tarvitsee Node) | — | Nopein dev-iterointi |
| LLVM + C runtime | ✅ | ~22 KB | **Suositus Pi:lle** |
| C++ | ✅ | ~137 KB | Luonnollinen SDL2-polku |
| Rust | ✅ | ~4.1 MB | Toimii, iso binääri |
| Go | ❌ | — | Keyboard-polyfill vain Windows |

---

## Kypsyysmatriisi

| Moduuli | Sijainti | Tila |
|---------|----------|------|
| Pure game logic | `pong_core.rgr` | ✅ PoC-taso |
| Input-abstraktio (`Buttons`) | `pong_core.rgr` | ✅ Valmis |
| SoftCanvas (RGBA8888) | `framebuffer.rgr` | ✅ Valmis + golden-frame testit |
| Portable renderer | `pong_render.rgr`, `game_sprite.rgr` | ✅ rect/circle/wedge |
| Terminaali-backend + debug HUD | `pong.rgr` | ✅ Valmis |
| SDL2-backend | `pong_sdl.rgr`, `gfx_sdl.rgr` | ✅ PoC valmis |
| LLVM-native build | `scripts/build-native.sh` | ✅ Toimii |
| TSX GameRunner | `game_runtime.rgr` | ✅ Retained sprites, reducer |
| Multi-screen flow | `breakout.game.tsx` | ✅ Valmis |
| JSX HUD (kevyt) | `game_hud.rgr` | ⚠️ View/Label, ei täyttä EVG:ä |
| Host bridge (resources/events) | `gallery/ts_to_ranger/game_host.rgr` | ⚠️ Data-kerros, ei toistoa |
| TS→Ranger staattinen käännös | `game_native_runtime.rgr` | ⚠️ Kokeellinen |
| EVG full-frame natiivissa | `RENDERING_EVG.md` | ❌ Suunniteltu |
| Ääni | `GameHost.playSound` | ❌ Stub (event only) |
| Gamepad | `PLAN_GAME_ENGINE.md` §6 | ❌ Suunniteltu |
| GPU (WebGL/GLES2) | `RENDERING_EVG.md` | ❌ Tulevaisuus |

---

## Vahvuudet (mitä hyödyntää)

1. **Todellinen write-once-portability** — sama logiikka Node:ssa, LLVM-natiivissa ja SDL2:ssa.
2. **Deterministinen simulaatio** — kokonaisluvut, golden-frame-testit, input-replay mahdollinen.
3. **Nopea desktop-iterointi** — TSX-skriptit ilman Ranger-uudelleenkääntöä.
4. **Retained-mode + reducer** — `sprites()` kerran, `update()` palauttaa uuden tilan.
5. **EVG-ekosysteemi valmiina** — vektorit, TTF, flexbox, JSX (`gallery/pdf_writer`).
6. **Kaksisuuntainen skriptaus** — tulkattu (ComponentEngine) ja staattinen (ts_to_ranger).
7. **Testipohja** — Vitest: render, runner, native parity, headless SDL smoke.
8. **Selkeä Pi-polku** — LLVM ~22 KB tai C++ + SDL2 HDMI:lle.

---

## Puutteet (tarkoitukselliset ja toteuttamattomat)

### Tarkoitukselliset non-goals (base)

- Scene graph
- Fysiikkamoottori
- Asset pipeline (kuvat, äänet, kartat) — LPC bake suunniteltu: [`LPC_HEADLESS_SPRITESHEET.md`](./LPC_HEADLESS_SPRITESHEET.md)

Nämä ovat tulevia kerroksia tai pelikohtaisia ratkaisuja, ei base-moottorin osia.

### Toteuttamattomat / osittaiset

| Puute | Vaikutus |
|-------|----------|
| Ohjelmistorasterointi (`SoftCanvas.fillRect`) | Invaders ~8 FPS (480 rectiä) |
| Kiinteä `dt = 16` ms SDL-hostissa | Simulaatio sidottu framerateen |
| EVG ei natiivissa | Rich UI vain ES6-polulla |
| Ääni stub | `playSound`-eventit, ei toistoa |
| Gamepad puuttuu | `Buttons` valmis, backend ei |
| Sprite atlas / blit | Ei bitmap-spritejä |
| LLVM workarounds | `to_int`, field-less struct |
| Go Pi-target | POSIX keyboard puuttuu |
| Record/replay-työkalu | Suunniteltu, ei paketoitu |
| systemd kiosk-resepti | Dokumentoitu, ei toimitettu |

---

## Roadmap

### Vaihe 0 — Valmis (heinäkuu 2026)

- [x] Portable Pong-ydin (`pong_core.rgr`) + terminaali-backend
- [x] SDL2 PoC (`pong_sdl.rgr`, `gfx_sdl.rgr`)
- [x] LLVM-native polku (~22 KB) + boolean-field bugi korjattu
- [x] SoftCanvas + golden-frame render-testit
- [x] TSX GameRunner: retained `sprites()`, reducer `update()`, `syncFromState`
- [x] Geneerinen sprite-protokolla (`game_sprite.rgr`: rect/circle/wedge)
- [x] Off-screen / `visible` culling
- [x] Kevyt JSX `hud()` (`game_hud.rgr`)
- [x] Multi-screen (Breakout: play → gameOver)
- [x] Demo-pelit: Pong, Invaders, Breakout, Pacman, menu, spawner
- [x] TS→Ranger native runner (kokeellinen)
- [x] Host bridge: resources + events (data-kerros)

---

### Vaihe 1 — Suorituskyky ja oikeellisuus (lyhyt aikaväli)

**Tavoite:** skriptatut pelit skaalautuvat 60 FPS:iin; simulaatio riippumaton frameratesta.

| # | Tehtävä | Tiedostot | Prioriteetti |
|---|---------|-----------|:------------:|
| 1.1 | Todellinen delta-time SDL-loopissa | `game_sdl_runner.rgr` — `gfx_ticks_ms()` | 🔴 Korkea |
| 1.2 | Sprite atlas + bitmap blit | `framebuffer.rgr`, `game_sprite.rgr` | 🔴 Korkea |
| 1.3 | SoftCanvas optimointi: span-fill / rivikohtainen täyttö | `framebuffer.rgr` | 🟡 Keskitaso |
| 1.4 | Invaders-refaktorointi: 1 sprite/alien (ei pixel-per-rect) | `invaders.game.tsx` | 🟡 Keskitaso |
| 1.5 | Dirty rectangle -seuranta (backend-optimointi) | `framebuffer.rgr`, backends | 🟢 Matala |
| 1.6 | LPC headless spritesheet bake + `kind: "sheet"` | [`lpc/`](./lpc/), `game_sprite.rgr`, [`LPC_HEADLESS_SPRITESHEET.md`](./LPC_HEADLESS_SPRITESHEET.md) | 🟡 Keskitaso |

**Onnistumiskriteerit:**

- Invaders ≥ 60 FPS dummy SDL:llä (tai ≥ 30 FPS 480 entityllä rect-moodissa)
- `update({ dt })` saa mitatun `dt`:n, ei kiinteää 16 ms
- Uusi peli voi käyttää `kind: "bitmap"` ilman satoja rect-spritejä

---

### Vaihe 2 — Platform-API ja Pi-deployment (keskipitkä aikaväli)

**Tavoite:** keskitetty gfx/pad-API, gamepad-tuki, natiivi Pi-kokemus.

| # | Tehtävä | Tiedostot | Prioriteetti |
|---|---------|-----------|:------------:|
| 2.1 | `gfx_*` / `pad_*` operaattorit `Lang.rgr`:ään | `compiler/Lang.rgr` | 🔴 Korkea |
| 2.2 | `runtime/ranger_gfx.c` (SDL2 shim) | `runtime/` | 🔴 Korkea |
| 2.3 | SDL GameController → `Buttons`-mapping | `pong_sdl.rgr`, uusi pad-backend | 🔴 Korkea |
| 2.4 | Äänimoottori: `playSound` → SDL_mixer / miniaudio | `game_host.rgr`, SDL runner | 🔴 Korkea |
| 2.5 | LLVM: `to_int`-template | `compiler/ng_LowIR*.rgr` | 🟡 Keskitaso |
| 2.6 | LLVM: field-less class struct -emissio | `compiler/` | 🟡 Keskitaso |
| 2.7 | Go POSIX keyboard polyfill | `lib/stdops.rgr` / polyfill | 🟡 Keskitaso |
| 2.8 | TV safe-area + integer scale backendissa | SDL backend | 🟡 Keskitaso |
| 2.9 | Input record/replay -työkalu | uusi `tools/` tai `scripting/` | 🟢 Matala |
| 2.10 | systemd autostart -resepti Pi kioskille | `scripts/`, docs | 🟢 Matala |

**Onnistumiskriteerit:**

- USB/Bluetooth gamepad toimii Pi:llä ilman pelilogiikan muutosta
- `playSound("blip")` kuuluu SDL-ikkunassa
- Yksi `npm run`-komento tuottaa Pi-valmiin binäärin

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
2. `world()` JSX + retained spritet päälle
3. Täysi EVG-frame GameRunnerissa
4. GPU-backend (vaihe 4)

---

### Vaihe 4 — GPU ja tuotantopeli (pitkä aikaväli)

**Tavoite:** 720p@60fps Pi:llä; ensimmäinen oikea tuotantopeli.

| # | Tehtävä | Kuvaus |
|---|---------|--------|
| 4.1 | WebGL/GLES2 backend Pi:lle | EVG → GPU texture upload |
| 4.2 | Asset pipeline | Sprite sheetit, äänipankit, collision mapit |
| 4.3 | Collision-työkalut | Pelikohtaiset tai kevyt tile-map -kerros |
| 4.4 | Tuotantopeli: Koodisampo Pi:llä | README:n mainitsema seuraava oikea peli |
| 4.5 | `<canvas>` ES6 dev-backend | Selain-kiosk debug |

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

> **Yhteenveto:** Sprites kerran alussa, sijainnit reducerilla joka framella, JSX vain HUD:iin.

---

## Testaus ja CI

### Nykyinen kattavuus

| Testi | Mitä testaa |
|-------|-------------|
| `tests/game-engine-render.test.ts` | SoftCanvas pikselit, SDL headless |
| `tests/game-runner.test.ts` | Pong, Invaders, Breakout, Pacman frame-count |
| `tests/game-scripting.test.ts` | Global injection, reducer dispatch |
| `tests/tsx-engine.test.ts` | ComponentEngine korjaukset |
| `tests/ts-to-ranger-native.test.ts` | Staattinen TS→Ranger parity |
| `tests/ts-to-ranger-host.test.ts` | Resource/event bridge |

### Roadmap-testit (lisättävät)

- [ ] Delta-time regressio (`dt`-riippuvainen liike)
- [ ] Bitmap blit golden-frame
- [ ] Äänitapahtuman mock-toisto
- [ ] Gamepad input mapping (simuloitu)
- [ ] Cross-target determinismi (ES6 vs native hash)

---

## Viitteet ja komennot

```bash
# Terminaali-Pong
npm run engine:run

# SDL2-ikkuna
npm run engine:sdl:run

# TSX-pelit
npm run engine:game-sdl:run:breakout
npm run engine:game-sdl:smoke:invaders

# LLVM-native (~22 KB)
npm run engine:build:native

# Testit
npm test -- game-engine game-runner game-scripting
```

| Dokumentti | Sisältö |
|------------|---------|
| [`README.md`](./README.md) | Quick start, layer stack, build-targetit |
| [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md) | Arkkitehtuuri, HDMI/gamepad, debuggaus |
| [`RENDERING_EVG.md`](./RENDERING_EVG.md) | EVG renderer, GPU-polku |
| [`scripting/GAME_SCRIPTING.md`](./scripting/GAME_SCRIPTING.md) | TSX-skriptaus-API |
| [`scripting/GAME_ENGINE_DESIGN.md`](./scripting/GAME_ENGINE_DESIGN.md) | Retained-mode, ongelmat, prioriteetit |
| [`LLVM_BUGS.md`](./LLVM_BUGS.md) | Native build -bugit ja workaroundit |
