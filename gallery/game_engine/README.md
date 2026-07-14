# Ranger Game Engine

Ohut, portable 2D-pelimoottorin pohja Ranger-kääntäjäprojektin `gallery/game_engine/`-hakemistossa.

Tavoite on yksinkertainen: **pelilogiikka kirjoitetaan kerran**, kehitys tapahtuu Macilla tai työpöydällä, ja sama logiikka voidaan ajaa natiivina binäärinä (esim. Raspberry Pi + HDMI). Moottori ei ole erillinen tuotantovalmis Unity/Godot-korvike, vaan kehitysalusta ja portability-demonstraatio.

Tarkempi suunnitelma: [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md). Nykytila ja jatkokehitys: [`ROADMAP.md`](./ROADMAP.md).

## Hakemistorakenne

```
gallery/game_engine/
├── games/              # Launcher-skannattavat pelit (index.tsx tai logic.wasm)
├── menu/               # Käynnistysvalikko (index.tsx)
├── scripting/          # Moottorin runtime + TSX-tyypit + vanhat *.game.tsx-demot
├── physics/            # Cannon.js -portti (pinball, sandbox)
├── wasm/               # Rust → WASM -moduulit (Path C) + RGW1 ABI
├── lpc/                # LPC-spritesheet-compositor (erillinen työkalu)
├── pong_*.rgr          # Käännetty Pong-viite (terminaali + SDL2)
├── framebuffer.rgr     # SoftCanvas (RGBA8888)
├── gfx_sdl.rgr         # SDL2-shim (C++ polyfill, GLES2 GPU-present)
└── scripts/            # build-skriptit (SDL, native, Pi, LPC, WASM, …)
```

## Kehityspolut

| Polku | Milloin | Tiedostot |
|-------|---------|-----------|
| **TSX-skriptaus** (pääpolku) | Uudet pelit, nopea iterointi, valikko, ääni, tallennus | `games/*/index.tsx`, `scripting/game_runtime.rgr`, `scripting/game_sdl_runner.rgr` |
| **Käännetty Ranger-ydin** | Matalan tason viite, LLVM/terminaali-Pi | `pong_core.rgr`, `pong.rgr`, `pong_sdl.rgr` |
| **WASM (Path C)** | Logiikka Rust/C → `.wasm`, host hoitaa piirron ja fysiikan | `wasm/rust_*`, `games/*/logic.wasm`, `scripting/wasm_game_runner.rgr` |
| **Host-fysiikka** | Ajoneuvot, törmäykset TSX:ssä tai WASM-ABI:n kautta | `scripting/game_physics.rgr`, `scripting/physics_core.rgr` |
| **Cannon-fysiikka** | Pinball, flipperit, painovoima | `physics/src/cannon_*.rgr`, `scripting/game_cannon_physics.rgr` |

Useimmat demot ja uudet pelit käyttävät TSX-polkuja. Käännetty Pong on edelleen hyvä esimerkki siitä, miten pelilogiikka erotetaan alustasta (katso [Käännetty Pong-viite](#käännetty-pong-viite) alempana). WASM-polku (`engine=wasm` `game.info`:ssa) on uudempi portability-vaihtoehto: logiikka wasm3-tulkissa, host renderöi spritet ja hoitaa fysiikan tarvittaessa.

## Arkkitehtuuri

```
┌─────────────────────────────────────────────────────────────┐
│  Platform-backend                                            │
│  game_sdl_runner.rgr (SDL2 + launcher + WASM)  |  pong_sdl  │
│  pong.rgr (terminaali)                                       │
└───────────────────────────┬─────────────────────────────────┘
                            │ input, timing, present
┌───────────────────────────▼─────────────────────────────────┐
│  Pelilogiikka — pure, portable                               │
│  TSX: initState / update / sprites / hud                     │
│  Ranger: pong_core.rgr — Pong.step(Buttons)                  │
│  WASM: logic.wasm — init / update (RGW1 linear ABI)          │
└───────────────────────────┬─────────────────────────────────┘
                            │ tila (+ physics ABI / contacts)
┌───────────────────────────▼─────────────────────────────────┐
│  Fysiikka (opt-in)                                           │
│  game_physics.rgr (2D top-down)  |  game_cannon_physics.rgr  │
└───────────────────────────┬─────────────────────────────────┘
                            │ worldEntities, contacts
┌───────────────────────────▼─────────────────────────────────┐
│  Piirtokerros — portable (+ GPU sheet overlay)               │
│  game_sprite.rgr, game_hud.rgr, game_particles.rgr           │
└───────────────────────────┬─────────────────────────────────┘
                            │ RGBA8888 (+ GPU textured quads)
┌───────────────────────────▼─────────────────────────────────┐
│  framebuffer.rgr — SoftCanvas                                │
└───────────────────────────┬─────────────────────────────────┘
                            │ (SDL-polku)
┌───────────────────────────▼─────────────────────────────────┐
│  gfx_sdl.rgr — SDL2-ikkuna, gamepad, ääni, GLES2 present     │
└─────────────────────────────────────────────────────────────┘
```

**Raja:** jos tiedosto kutsuu `write`, `poll_keypress` tai `gfx_present`, se on backend. Kaikki muu on portable.

TSX-pelien yksityiskohtainen malli (reducer-tyyli, retained spritet, JSX HUD): [`scripting/GAME_SCRIPTING.md`](./scripting/GAME_SCRIPTING.md) ja [`scripting/GAME_ENGINE_DESIGN.md`](./scripting/GAME_ENGINE_DESIGN.md).

## Käynnistäminen

Vaatimukset SDL-ikkunalle: C++17-kääntäjä ja SDL2 (`brew install sdl2` / `libsdl2-dev`).

```bash
npm install

# Käynnistysvalikko (skannaa games/, palaa valikkoon Q/Esc)
npm run engine:game-sdl:launcher

# Yksittäinen peli suoraan
npm run engine:game-sdl:run:pong
npm run engine:game-sdl:run:breakout
npm run engine:game-sdl:run:pacman
npm run engine:game-sdl:run:invaders
npm run engine:game-sdl:run:ylos2
npm run engine:game-sdl:run:physics_sandbox

# WASM-pelit (Rust → logic.wasm)
npm run engine:game-sdl:run:rust-pong
npm run engine:game-sdl:run:rust-autopeli

# Kehitys: hot reload (TSX-muutokset latautuvat lennossa)
npm run engine:game:watch:pong
npm run engine:game:watch:breakout
```

Yleiset näppäimet SDL-hostissa: **W/S** tai nuolinäppäimet, **F11** fullscreen, **Q/Esc** poistu (pelistä takaisin valikkoon, valikosta sulkee sovelluksen). Gamepad-tuki on käytössä (`scripting/game_input.rgr`): SDL GameController, split-tilassa gamepad 0 vasemmalle ja gamepad 1 oikealle ruudulle.

Headless / CI: binääri hyväksyy valinnaisen frameluvun ja `SDL_VIDEODRIVER=dummy`:

```bash
npm run engine:game-sdl:smoke:pong           # 300 framea dummy-ajossa
npm run engine:game-sdl:smoke:rust-pong      # WASM Pong
npm run engine:game-sdl:smoke:rust-autopeli  # WASM autopeli + fysiikka
```

Käännetty terminaali-Pong (Node):

```bash
npm run engine:compile && npm run engine:run
# W/S liiku, D debug-HUD, Q lopeta
```

## Demo-pelit (`games/`)

| Peli | Polku | Huomio |
|------|-------|--------|
| Pong | TSX | Minimal-malli, suositeltu pohja |
| Breakout | TSX | Multi-screen, JSX HUD, split screen |
| Pac-Man | TSX | Split screen + autoscale |
| Invaders | TSX | Stressitesti (paljon rect-spritejä) |
| Pomppija (ylos2) | TSX | Platformer, LPC-sheet-spritet, musiikki |
| Flipperitorni (pinpall) | TSX + Cannon | Pystypinball, split screen |
| Physics Sandbox | TSX + Cannon | Flipperit, pegs, sheet-animaatiot |
| Autopeli Physics | TSX + host physics | Top-down racer, jaettu fysiikkamaailma |
| Rust Pong | WASM | Path C PoC, getter-ABI |
| Rust Autopeli | WASM + physics | RGW1 linear ABI, host rendering |
| Pyörretris | .as (`render=sprites`) | Tetris; guest-driven rotatable sprites over the ABI, no physics |

## Pelivalikko ja `games/`-hakemisto

`game_sdl_runner.rgr` käynnistää oletuksena [`menu/index.tsx`](./menu/index.tsx)-valikon. Host skannaa `gallery/game_engine/games/`-kansion (tai `--games-dir=...`) ja injektoi listan `gameCatalog`-globaalina.

Launcher-polku:

1. Valikko latautuu → näyttää löydetyt pelit.
2. Nuoli ylös/alas valitsee, **Space/Enter** käynnistää pelin.
3. Pelissä **Q/Esc** → takaisin valikkoon.
4. Valikossa **Q/Esc** → sulkee sovelluksen.

Pelin voi ajaa myös suoraan ilman valikkoa:

```bash
./tmp/game-sdl/game_sdl gallery/game_engine/games/pong/index.tsx
```

Katalogi päivittyy ajon aikana (oletus ~10 s välein); uusi `games/mygame/index.tsx` ilmestyy listaan ilman uudelleenkäännöstä.

### `game.info`-kentät

```ini
name=My Game
icon=icon.png
splitScreen=auto          # auto | always | never
autoscale=true            # host skaalaa 480×270 → paneeliin
soloScript=index.tsx      # split-tilan yksinpeliskripti
engine=wasm               # tsx (oletus) | wasm | as | ui
render=sprites            # (engine=as) guest-driven rotatable spritet, ei fysiikkaa
module=logic.wasm         # WASM-moduulin tiedosto
abi=linear                # getter (oletus) | linear (RGW1 shared memory)
physics=true              # host GamePhysics + WASM/TSX I/O
assets=assets             # resurssikansio (WASM)
```

## Uuden pelin lisääminen

### 1. Luo kansio

```
gallery/game_engine/games/mygame/
├── index.tsx       # pakollinen — pelin pääskripti (tai logic.wasm WASM-pelille)
├── game.info
├── gamedata.json       # luodaan saveGameData-kutsulla
├── level2.tsx          # valinnainen — erillinen ruututiedosto (pushGame)
├── win.tsx             # valinnainen — voittoruutu (loadGame)
└── assets/             # taustakuvat (resources)
```

`game.info`-esimerkki:

```ini
name=My Game
```

Ilman `name=`-kenttää käytetään kansion nimeä.

### 2. Kirjoita `index.tsx`

Aloita olemassa olevasta pelistä (esim. [`games/pong/index.tsx`](./games/pong/index.tsx) — yksinkertainen; [`games/breakout/index.tsx`](./games/breakout/index.tsx) — multi-screen + JSX HUD).

Tyypitykset:

```tsx
/// <reference path="../../scripting/game.d.ts" />
```

Pakolliset / tyypilliset funktiot (`GameRunner`):

| Funktio | Kutsutaan | Tehtävä |
|---------|-----------|---------|
| `sprites()` tai `sprites({ screen })` | kerran per ruutu | retained-objektit (`rect`, `circle`, `bitmap`, `sheet`, …) |
| `initState()` | käynnistyksessä | alkutila |
| `update(props)` | jokainen frame | palauttaa **uuden** tilan (`props.dt`, `props.input`, näppäimet) |
| `hud(props)` | jokainen frame (valinnainen) | JSX-overlay (`View`, `Label`) |
| `resources()` | kerran (valinnainen) | taustakuvat, äänet |
| `screens()` | dokumentaatio (valinnainen) | multi-screen-pelien ruutunimet |
| `config()` | kerran (valinnainen) | `physics`, `world`, kamera |
| `physicsBounds()` | kerran (valinnainen) | seinät/segmentit host-fysiikalle tai Cannonille |

Perussilmukka:

```tsx
function sprites() {
  return [{ id: "ball", kind: "circle", rad: 6, r: 245, g: 245, b: 130 }];
}

function initState() {
  return { entities: { ball: { x: 240, y: 135 } }, vx: 0.16, vy: 0.10 };
}

function update(props) {
  const s = props.state;
  let { x, y } = s.entities.ball;
  x = x + s.vx * props.dt;
  y = y + s.vy * props.dt;
  return { ...s, entities: { ball: { x, y } } };
}
```

Jaetut apurit: [`scripting/game_helpers.tsx`](./scripting/game_helpers.tsx) (`getScreen`, `soundEvent`, …). Jaetut moduulit: `import { foo } from "./utils"` (polku suhteessa pelikansioon).

### 3. Aja ja testaa

```bash
npm run engine:game-sdl:run:mygame   # lisää vastaava rivi package.json:iin tai:
npm run engine:game-sdl -- --run gallery/game_engine/games/mygame/index.tsx
npm run engine:game:watch:mygame   # jos watch-skripti lisätty
```

Valikosta peli näkyy automaattisesti, kun `index.tsx` on paikallaan.

### 4. Valinnaiset ominaisuudet

| Ominaisuus | Miten |
|------------|-------|
| **Ääni** | `import { soundEvent } from "../../scripting/game_helpers"` → `events: [soundEvent("bounce")]` `update()`-palautuksessa; synth-äänet `game_audio.rgr`, musiikki `game_soundscore.rgr` |
| **Ääniefektit (Voicebox)** | Ennalta määritellyt vokaaliefektit (nauru, huokaus, haukotus…): `events: [{ kind: "playVoice", id: "laugh" }]` tai suora ABI-kutsu `laugh()` / `voice("sigh")`. Katso [`scripting/VOICEBOX.md`](./scripting/VOICEBOX.md), demo `voicebox_demo.game.tsx` (`npm run engine:voicebox`) |
| **Partikkelit** | `events: [{ kind: "particles", id: "sparkle", x, y }]` — CPU- tai GPU-overlay |
| **Taustakuva** | `resources()` + `backgroundImage()` — katso [`scripting/background_demo.game.tsx`](./scripting/background_demo.game.tsx) |
| **Tallennus** | `loadGameData()` / `saveGameData(obj)` → `gamedata.json` pelikansiossa |
| **Ruututiedostot** | `loadGame` / `pushGame` / `popGame` — erilliset `.tsx`-ruudut samassa pelikansiossa |
| **Multi-screen (yksi tiedosto)** | `state.screen` + `state.screens[name]`; apurit `getScreen`, `isActiveScreen` — katso Breakout |
| **Useampi pelaaja** | `state.playerSlots` + `props.input.players[]` |
| **Split screen (kaksi lasta)** | `game.info`: `splitScreen=auto` — katso alla |
| **Host-fysiikka** | `config().physics.enabled`, `state.physics` + `state.physicsContacts` — katso autopeli_physics |
| **Cannon-fysiikka** | `config().physics.cannon`, entity `physics: { radius, mass, … }` — katso pinpall / physics_sandbox |
| **Sheet-spritet** | `kind: "sheet"` + PNG-polku; GPU-overlay latausajassa (`game_sprite.rgr`) |

### Split screen (kaksi itsenäistä pelitilaa)

Kun `game.info`:ssa on `splitScreen=auto` tai `always`, SDL-host käynnistää **split screen -tilan**: vasen ja oikea puoli (240×270) ajavat erillistä yksinpelitilaa omalla ohjaimellaan.

| `game.info` | Merkitys |
|-------------|----------|
| `splitScreen=auto` | Split oletuksena |
| `splitScreen=always` | Aina split |
| `splitScreen=never` | Ei koskaan split (tai rivi puuttuu) |
| `autoscale=true` | Host renderöi 480×270-bitmappiin ja skaalaa paneeliin (oletus) |
| `autoscale=false` | Paneeli = 240×270; peli skaalaa itse (`bgWidth`) |
| `soloScript=index.tsx` | Valinnainen eri skripti split-ruuduille |

**Autoscale (bitmap):** peli piirtää normaalisti täysleveään framebufferiin (`bgWidth=480`). Host kopioi valmiin RGBA-bitmappin puolikkaaseen leveyteen `copyRectScaledFrom`-blitillä tai GPU-split-presentillä. Toimii kaikilla piirtotavoilla: spritet, `createStaticBg`, HUD, suora canvas.

**Ilman autoscalea:** peli saa `bgWidth=240` ja vastaa itse layoutista (esim. Ylos).

**Ohjaus split-tilassa:** vasen ruutu = WASD + gamepad 0, oikea = nuolet + gamepad 1.

**Dual-player -tila:** molemmat painavat **Start** samalla framella → jaettu ruutu (esim. Ylos kahdella pelaajalla).

Esimerkit: Pac-Man, Breakout, Invaders, Flipperitorni (`splitScreen=auto`); Pomppija (`autoscale=false`).

Tiedostopohjaiset ruudut (`level2.tsx`, `win.tsx`), taustakuvat ja `gamedata.json`: **[`scripting/GAME_SCREENS_AND_STORAGE.md`](./scripting/GAME_SCREENS_AND_STORAGE.md)**.

Täydet tyypit: [`scripting/engine.d.ts`](./scripting/engine.d.ts). TS-tarkistus:

```bash
cd gallery/game_engine/scripting && npx tsc --noEmit
```

## WASM-pelit (Path C)

WASM-pelit ladataan wasm3-tulkilla SDL-hostiin. Katalogi tunnistaa `engine=wasm` + `module=logic.wasm` `game.info`:sta.

| ABI | Kuvaus | Esimerkki |
|-----|--------|-----------|
| **getter** | WASM exportit `ball_x()`, `update(dt, …)` | Rust Pong |
| **linear (RGW1)** | Jaettu muistilohko (2560 B): input, kontaktit, eventit | Rust Autopeli |

Rust-lähdekoodi: [`wasm/rust_pong/`](./wasm/rust_pong/), [`wasm/rust_autopeli/`](./wasm/rust_autopeli/). ABI-määrittely: [`wasm/wasm_game_abi.h`](./wasm/wasm_game_abi.h).

```bash
# Rakenna WASM-moduulit
npm run engine:wasm:build:rust-pong
npm run engine:wasm:build:rust-autopeli
npm run engine:wasm:assets:autopeli   # kopioi PNG-resurssit

# Headless-integraatiotestit
npm run engine:wasm:demo:pong
npm run engine:wasm:demo:autopeli

# SDL-ajot
npm run engine:game-sdl:run:rust-pong
npm run engine:game-sdl:run:rust-autopeli
```

Linear-ABI-pelissä host hoitaa fysiikan (`GamePhysics`), piirron (procedural road + PNG-spritet) ja event-drainin (ääni, partikkelit, rumble). Moduuli voi rekisteröidä resurssit host-importeilla (`rg_host_register_sheet`).

Lisätietoa Rust Pong -PoC:sta: [`games/rust_pong/README.md`](./games/rust_pong/README.md).

## Fysiikka

Kaksi opt-in-fysiikkakerrosta:

| Kerros | Käyttö | API |
|--------|--------|-----|
| **Host physics** (`game_physics.rgr`) | Top-down racer, ajoneuvot, segmenttiseinät | `config().physics`, `state.physics`, `physicsContacts` |
| **Cannon** (`game_cannon_physics.rgr`) | Pinball, painovoima, flipperit | `config().physics.cannon`, entity `physics: { … }` |

Cannon.js -portti: [`physics/src/`](./physics/src/). Headless-testit:

```bash
npm run engine:physics:test
```

## Käännetty Pong-viite

Alkuperäinen portability-PoC: pelilogiikka kerran [`pong_core.rgr`](./pong_core.rgr):ssä, kaksi backendia.

| Kerros | Tiedosto | I/O? |
|--------|----------|------|
| Logiikka | `pong_core.rgr` | Ei |
| Piirto | `framebuffer.rgr` + `pong_render.rgr` | Ei (RGBA-puskuri) |
| Terminaali | `pong.rgr` | Kyllä (ANSI + näppäimistö) |
| SDL2 | `pong_sdl.rgr` + `gfx_sdl.rgr` | Kyllä (ikkuna) |

`Pong.step(input:Buttons)` on puhdas: kokonaisluku-Bresenham-liike, ei floatteja simulaatiossa. Piirto voi käyttää render-only subpixel-offsettia (`PongRenderer`).

```bash
npm run engine:sdl:run          # SDL2-ikkuna
npm run engine:build:native     # LLVM → terminaalibinääri
npm run build:raspberry         # Pi 5 aarch64 -paketti (terminaali-Pong)
```

LLVM-ongelmat ja korjaukset: [`LLVM_BUGS.md`](./LLVM_BUGS.md).

### Build-targetit (Pong, terminaali)

| Target | Pi-native? | Huomio |
|--------|:----------:|--------|
| ES6 / Node | ✅ (tarvitsee Node) | Nopein dev |
| LLVM + C runtime | ✅ | Pienin binääri, suositus Pi:lle (terminaali) |
| C++ | ✅ | SDL2-polku |
| Rust | ✅ | Iso binääri |
| Go | ❌ | Näppäimistöpolyfill vain Windows |

## Raspberry Pi

**SSH deploy (TSX + WASM launcher, recommended):**

```bash
bash gallery/game_engine/scripts/deploy-pi.sh pelit
```

Rsyncs repo → Pi, compiles `game_sdl` (SDL2 + GLES2 + wasm3) on device, wires `~/start.sh` autostart. WASM games use committed `logic.wasm` (no Rust needed to deploy). Rebuild wasm locally first only when needed:

```bash
RANGER_WASM_BUILD=1 bash gallery/game_engine/scripts/deploy-pi.sh pelit
```

Fast game sync only (no host rebuild):

```bash
SYNC_WASM_BUILD=1 bash gallery/game_engine/scripts/sync-pi-games.sh pelit
```

**Offline bundle (terminaali-Pong, no SDL):**

```bash
npm run build:raspberry
# → dist/raspberry-pi5/ (pong + games/menu/scripting + lib + compiler + DEPLOY.md)
```

Kopioi `pong` Pi:lle ja aja HDMI-konsolissa. SDL-pelit (`engine:game-sdl`) vaativat Pi:llä `libsdl2-dev` ja käännöksen laitteella tai vastaavan cross-buildin. GPU-present (GLES2) on oletus SDL-hostissa; sheet-spritet voidaan renderöidä GPU-overlayna.

## LPC-spritesheet-compositor

[`lpc/`](./lpc/) on erillinen Ranger-pohjainen työkalu LPC-hahmospritesheettien generointiin. Se ei ole pakollinen pelien ajamiseen. Dokumentaatio: [`lpc/README.md`](./lpc/README.md), [`LPC_HEADLESS_SPRITESHEET.md`](./LPC_HEADLESS_SPRITESHEET.md).

```bash
npm run engine:lpc:build
npm run engine:lpc:run
```

## Testit

| Testi | Mitä kattaa |
|-------|-------------|
| [`tests/game-engine-render.test.ts`](../../tests/game-engine-render.test.ts) | SoftCanvas / Pong-renderöinti |
| [`tests/game-runner.test.ts`](../../tests/game-runner.test.ts) | GameRunner + TSX, ääni, fysiikka, Ylos |
| [`tests/game-scripting.test.ts`](../../tests/game-scripting.test.ts) | ComponentEngine-skriptaus |
| [`tests/physics-cannon.test.ts`](../../tests/physics-cannon.test.ts) | Cannon.js -portti |

## Dokumentaatio ja tiedostot

| Tiedosto | Sisältö |
|----------|---------|
| [`ROADMAP.md`](./ROADMAP.md) | Nykytila, puutteet, prioriteetit |
| [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md) | Arkkitehtuuri, HDMI, gamepad-suunnitelma |
| [`RENDERING_EVG.md`](./RENDERING_EVG.md) | EVG/vektori-renderöinnin integraatio (tuleva) |
| [`scripting/GAME_SCRIPTING.md`](./scripting/GAME_SCRIPTING.md) | TSX-skriptaus, GameRunner, importit |
| [`scripting/GAME_SCREENS_AND_STORAGE.md`](./scripting/GAME_SCREENS_AND_STORAGE.md) | Ruutujen lataus (`loadGame`/`pushGame`) ja `gamedata.json` |
| [`scripting/GAME_ENGINE_DESIGN.md`](./scripting/GAME_ENGINE_DESIGN.md) | Retained mode + JSX HUD -malli |
| [`scripting/TSX_ENGINE_ISSUES.md`](./scripting/TSX_ENGINE_ISSUES.md) | Tunnetut evaluator-rajoitukset |
| [`LLVM_BUGS.md`](./LLVM_BUGS.md) | LLVM-backendin bugit |
| [`games/rust_pong/README.md`](./games/rust_pong/README.md) | WASM Path C PoC |
| `scripting/game_runtime.rgr` | GameRunner (sprites, update, hud, ääni, fysiikka) |
| `scripting/game_sdl_runner.rgr` | SDL2-host + launcher + hot reload + WASM |
| `scripting/wasm_game_runner.rgr` | WASM getter-ABI (Pong) |
| `scripting/wasm_physics_runner.rgr` | WASM linear ABI + host physics (Autopeli) |
| `scripting/game_catalog.rgr` | `games/`-hakemiston skannaus |
| `scripting/game_persistence.rgr` | `gamedata.json` tallennus |
| `scripts/build-game-sdl.sh` | TSX- ja WASM-pelien SDL-binääri |
| `scripts/build-sdl.sh` | Käännetty Pong SDL |
| `scripts/build-native.sh` | LLVM Pong |
| `scripts/build-raspberry.sh` | Pi 5 aarch64 -paketti (pong + runtime-assetit) |
| `scripts/sync-game-engine-runtime.sh` | Kopioi games/menu/scripting/lib deploy-hakemistoon |
