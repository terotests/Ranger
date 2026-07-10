# Ranger Game Engine

Ohut, portable 2D-pelimoottorin pohja Ranger-kääntäjäprojektin `gallery/game_engine/`-hakemistossa.

Tavoite on yksinkertainen: **pelilogiikka kirjoitetaan kerran**, kehitys tapahtuu Macilla tai työpöydällä, ja sama logiikka voidaan ajaa natiivina binäärinä (esim. Raspberry Pi + HDMI). Moottori ei ole erillinen tuotantovalmis Unity/Godot-korvike, vaan kehitysalusta ja portability-demonstraatio.

Tarkempi suunnitelma: [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md). Nykytila ja jatkokehitys: [`ROADMAP.md`](./ROADMAP.md).

## Hakemistorakenne

```
gallery/game_engine/
├── games/              # Launcher-skannattavat pelit (index.tsx per kansio)
├── menu/               # Käynnistysvalikko (index.tsx)
├── scripting/          # Moottorin runtime + TSX-tyypit + vanhat *.game.tsx-demot
├── lpc/                # LPC-spritesheet-compositor (erillinen työkalu)
├── pong_*.rgr          # Käännetty Pong-viite (terminaali + SDL2)
├── framebuffer.rgr     # SoftCanvas (RGBA8888)
├── gfx_sdl.rgr         # SDL2-shim (C++ polyfill)
└── scripts/            # build-skriptit (SDL, native, Pi, LPC, …)
```

## Kaksi kehityspolkua

| Polku | Milloin | Tiedostot |
|-------|---------|-----------|
| **TSX-skriptaus** (pääpolku) | Uudet pelit, nopea iterointi, valikko, ääni, tallennus | `games/*/index.tsx`, `scripting/game_runtime.rgr`, `scripting/game_sdl_runner.rgr` |
| **Käännetty Ranger-ydin** | Matalan tason viite, LLVM/terminaali-Pi | `pong_core.rgr`, `pong.rgr`, `pong_sdl.rgr` |

Useimmat demot ja uudet pelit käyttävät TSX-polkuja. Käännetty Pong on edelleen hyvä esimerkki siitä, miten pelilogiikka erotetaan alustasta (katso [Käännetty Pong-viite](#käännetty-pong-viite) alempana).

## Arkkitehtuuri

```
┌─────────────────────────────────────────────────────────────┐
│  Platform-backend                                            │
│  game_sdl_runner.rgr (SDL2 + launcher)  |  pong_sdl.rgr     │
│  pong.rgr (terminaali)                                       │
└───────────────────────────┬─────────────────────────────────┘
                            │ input, timing, present
┌───────────────────────────▼─────────────────────────────────┐
│  Pelilogiikka — pure, portable                               │
│  TSX: initState / update / sprites / hud                     │
│  Ranger: pong_core.rgr — Pong.step(Buttons)                  │
└───────────────────────────┬─────────────────────────────────┘
                            │ tila
┌───────────────────────────▼─────────────────────────────────┐
│  Piirtokerros — portable                                     │
│  game_sprite.rgr, game_hud.rgr  |  pong_render.rgr           │
└───────────────────────────┬─────────────────────────────────┘
                            │ RGBA8888
┌───────────────────────────▼─────────────────────────────────┐
│  framebuffer.rgr — SoftCanvas                                │
└───────────────────────────┬─────────────────────────────────┘
                            │ (SDL-polku)
┌───────────────────────────▼─────────────────────────────────┐
│  gfx_sdl.rgr — SDL2-ikkuna, gamepad, ääni                    │
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

# Kehitys: hot reload (TSX-muutokset latautuvat lennossa)
npm run engine:game:watch:pong
npm run engine:game:watch:breakout
```

Yleiset näppäimet SDL-hostissa: **W/S** tai nuolinäppäimet, **F11** fullscreen, **Q/Esc** poistu (pelistä takaisin valikkoon, valikosta sulkee sovelluksen). Gamepad-tuki on käytössä (`scripting/game_input.rgr`).

Headless / CI: binääri hyväksyy valinnaisen frameluvun ja `SDL_VIDEODRIVER=dummy`:

```bash
npm run engine:game-sdl:smoke:pong    # 300 framea dummy-ajossa
```

Käännetty terminaali-Pong (Node):

```bash
npm run engine:compile && npm run engine:run
# W/S liiku, D debug-HUD, Q lopeta
```

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

## Uuden pelin lisääminen

### 1. Luo kansio

```
gallery/game_engine/games/mygame/
├── index.tsx       # pakollinen — pelin pääskripti
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
| `sprites()` tai `sprites({ screen })` | kerran per ruutu | retained-objektit (`rect`, `circle`, `bitmap`, …) |
| `initState()` | käynnistyksessä | alkutila |
| `update(props)` | jokainen frame | palauttaa **uuden** tilan (`props.dt`, `props.input`, näppäimet) |
| `hud(props)` | jokainen frame (valinnainen) | JSX-overlay (`View`, `Label`) |
| `resources()` | kerran (valinnainen) | taustakuvat, äänet |
| `screens()` | dokumentaatio (valinnainen) | multi-screen-pelien ruutunimet |

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
| **Ääni** | `import { soundEvent } from "../../scripting/game_helpers"` → `events: [soundEvent("bounce")]` `update()`-palautuksessa |
| **Taustakuva** | `resources()` + `backgroundImage()` — katso [`scripting/background_demo.game.tsx`](./scripting/background_demo.game.tsx) |
| **Tallennus** | `loadGameData()` / `saveGameData(obj)` → `gamedata.json` pelikansiossa |
| **Ruututiedostot** | `loadGame` / `pushGame` / `popGame` — erilliset `.tsx`-ruudut samassa pelikansiossa |
| **Multi-screen (yksi tiedosto)** | `state.screen` + `state.screens[name]`; apurit `getScreen`, `isActiveScreen` — katso Breakout |
| **Useampi pelaaja** | `state.playerSlots` + `props.input.players[]` |
| **Split screen (kaksi lasta)** | `game.info`: `splitScreen=auto` + `soloScript=…/index.tsx` — katso alla |

### Split screen (kaksi itsenäistä pelitilaa)

Kun pelissä on `soloScript`-polku `game.info`:ssa, SDL-host käynnistää oletuksena **split screen -tilan**: vasen ja oikea puoli (240×270 kumpikin) ajavat erillistä yksinpelitilaa omalla ohjaimellaan. Kukin lapsi etenee omaan tahtiinsa.

| `game.info` | Merkitys |
|-------------|----------|
| `splitScreen=auto` | Split oletuksena kun `soloScript` on määritelty |
| `splitScreen=always` | Aina split (vaatii `soloScript`) |
| `splitScreen=never` | Ei koskaan split (esim. solo-variantti listassa) |
| `soloScript=ylos_solo/index.tsx` | Yksinpeliversio split-ruuduille (suhteessa `games/`) |

**Ohjaus split-tilassa:** vasen ruutu = WASD + gamepad 0, oikea = nuolet + gamepad 1.

**Dual-player -tila:** molemmat painavat **Start** samalla framella → jaettu ruutu (esim. Ylos! kahdella pelaajalla samalla kentällä).

Esimerkki: [`games/ylos/game.info`](./games/ylos/game.info) + [`games/ylos_solo/`](./games/ylos_solo/).

Tiedostopohjaiset ruudut (`level2.tsx`, `win.tsx`), taustakuvat ja `gamedata.json`: **[`scripting/GAME_SCREENS_AND_STORAGE.md`](./scripting/GAME_SCREENS_AND_STORAGE.md)**.

Täydet tyypit: [`scripting/engine.d.ts`](./scripting/engine.d.ts). TS-tarkistus:

```bash
cd gallery/game_engine/scripting && npx tsc --noEmit
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

**Terminaali-Pong** (ei SDL-riippuvuuksia, vain libc):

```bash
npm run build:raspberry
# → dist/raspberry-pi5/ (pong + games/menu/scripting + lib + compiler + DEPLOY.md)
```

Kopioi `pong` Pi:lle ja aja HDMI-konsolissa. SDL-pelit (`engine:game-sdl`) vaativat Pi:llä `libsdl2-dev` ja käännöksen laitteella tai vastaavan cross-buildin.

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
| [`tests/game-runner.test.ts`](../../tests/game-runner.test.ts) | GameRunner + TSX |
| [`tests/game-scripting.test.ts`](../../tests/game-scripting.test.ts) | ComponentEngine-skriptaus |

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
| `scripting/game_runtime.rgr` | GameRunner (sprites, update, hud, ääni, tausta) |
| `scripting/game_sdl_runner.rgr` | SDL2-host + launcher + hot reload |
| `scripting/game_catalog.rgr` | `games/`-hakemiston skannaus |
| `scripting/game_persistence.rgr` | `gamedata.json` tallennus |
| `scripts/build-game-sdl.sh` | TSX-pelien SDL-binääri |
| `scripts/build-sdl.sh` | Käännetty Pong SDL |
| `scripts/build-native.sh` | LLVM Pong |
| `scripts/build-raspberry.sh` | Pi 5 aarch64 -paketti (pong + runtime-assetit) |
| `scripts/sync-game-engine-runtime.sh` | Kopioi games/menu/scripting/lib deploy-hakemistoon |
