# Ranger Game Engine

Ohut, portable 2D-pelimoottorin pohja Ranger-kääntäjäprojektin `gallery/game_engine/`-hakemistossa.

Tavoite on yksinkertainen: **pelilogiikka kirjoitetaan kerran**, kehitys tapahtuu Macilla tai työpöydällä, ja sama logiikka voidaan ajaa natiivina binäärinä (esim. Raspberry Pi + HDMI). Moottori ei ole erillinen tuotantovalmis Unity/Godot-korvike, vaan kehitysalusta ja portability-demonstraatio.

Tarkempi suunnitelma: [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md). Nykytila ja jatkokehitys: [`ROADMAP.md`](./ROADMAP.md).

## Hakemistorakenne

```
gallery/game_engine/
├── games/              # LADATTAVAT pelit (index.tsx tai logic.wasm) — host ajaa runtimessa
├── ranger_games/       # RANGER-PELIT: staattinen Ranger-lähdekoodi → natiivi binääri
│                       #   (käännetty Pong, sprite_char, streaming_world + AOT-natiivipelit)
├── menu/               # Käynnistysvalikko (index.tsx)
├── ui/                 # EVG-pohjainen interaktiivinen UI-kerros (RGU1, valikot, widgetit)
├── scripting/          # MOOTTORIN YDIN: runtime, host, fysiikka, WASM/TSX-runnerit, TSX-tyypit
├── physics/            # Cannon.js -portti (pinball, sandbox)
├── wasm/               # WASM-guestit: Rust (`rust_*`) + AssemblyScript (`as_*`) + jaetut ABI-headerit
├── lib/                # Jaetut guest-kirjastot: .as-helperit (abi.as, ui.as) + Rust `ranger_game` -crate
├── pose/               # Pose-input (RGP1): natiivi provider + MediaPipe-PoC
├── lpc/                # LPC-spritesheet-compositor (erillinen työkalu)
├── tests/              # Peli-testirunnerit (headless *_runner_demo.rgr) + interp/
├── framebuffer.rgr     # SoftCanvas (RGBA8888) — moottorin ydin
├── gfx_sdl.rgr         # SDL2-shim (C++ polyfill, GLES2 GPU-present) — moottorin ydin
└── scripts/            # build-skriptit (SDL, native, Pi, LPC, WASM, …)
```

**Kolme selkeästi eri asiaa** (älä sekoita niitä):

| Käsite | Hakemisto | Mitä |
|--------|-----------|------|
| **Ladattavat pelit** | [`games/`](./games/) | Wasm-/TSX-/`.as`-pelit, jotka host lataa ajon aikana |
| **Ranger-pelit (alusta)** | [`ranger_games/`](./ranger_games/) | Pelit, joiden logiikka on Ranger-lähdekoodia, käännettynä omaksi natiivibinääriksi |
| **Moottorin ydin** | [`scripting/`](./scripting/), `framebuffer.rgr`, `gfx_sdl.rgr` | Alusta, jonka päällä ladattavat pelit pyörivät — ei itse peli |

"Ranger alustana" tarkoittaa `ranger_games/`-hakemistoa: peli **on** käännetty
ohjelma, ei tulkattua guestia. Uudet ladattavat pelit menevät `games/`-hakemistoon,
uudet käännetyt Ranger-pelit `ranger_games/`-hakemistoon. Ks. [`ranger_games/README.md`](./ranger_games/README.md).

## Kehityspolut

| Polku | Milloin | Tiedostot |
|-------|---------|-----------|
| **TSX-skriptaus** (pääpolku) | Uudet pelit, nopea iterointi, valikko, ääni, tallennus | `games/*/index.tsx`, `scripting/game_runtime.rgr`, `scripting/game_sdl_runner.rgr` |
| **Käännetty Ranger-ydin** | Matalan tason viite, LLVM/terminaali-Pi | `ranger_games/pong_core.rgr`, `ranger_games/pong.rgr`, `ranger_games/pong_sdl.rgr` |
| **AOT-natiivipeli** | Sama peli kuin `games/`, käännettynä ennakkoon natiiviksi (ei TSX-latausta) | `ranger_games/*_native_game.rgr`, `ranger_games/*_native_sdl_runner.rgr` |
| **WASM (Path C)** | Logiikka Rust tai AssemblyScript → `.wasm`, host hoitaa piirron ja fysiikan | `wasm/rust_*`, `wasm/as_*`, `games/*/logic.wasm`, `scripting/wasm_game_runner.rgr` |
| **`.as` (tulkittu)** | Sama ABI kuin WASM, mutta guest ajetaan tulkattuna (`engine=as`) — ei käännösvaihetta | `scripting/as_abi_bridge.rgr`, `scripting/as_source_runner.rgr` |
| **EVG UI** | Interaktiiviset valikot/widgetit retained-mode RGU1-dokumenttina (`engine=ui`) | `ui/`, `scripting/wasm_ui_io.rgr` |
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

TSX-pelien yksityiskohtainen malli (reducer-tyyli, retained spritet, JSX HUD): [`docs/GAME_SCRIPTING.md`](./docs/GAME_SCRIPTING.md) ja [`docs/GAME_ENGINE_DESIGN.md`](./docs/GAME_ENGINE_DESIGN.md).

## Käynnistäminen

Vaatimukset SDL-ikkunalle: C++17-kääntäjä ja SDL2 (`brew install sdl2` / `libsdl2-dev`).

```bash
npm install

# Käynnistysvalikko (skannaa games/, palaa valikkoon Q/Esc)
npm run engine:game-sdl:launcher

# Yksittäinen peli suoraan (valmiit run-skriptit)
npm run engine:game-sdl:run:pong
npm run engine:game-sdl:run:breakout
npm run engine:game-sdl:run:invaders
npm run engine:game-sdl:run:ylos2
npm run engine:game-sdl:run:physics_sandbox

# Peli, jolla ei ole omaa run-skriptiä (esim. pacman) — suoralla polulla:
npm run engine:game-sdl -- --run gallery/game_engine/games/pacman/index.tsx

# WASM-pelit (Rust/AS → logic.wasm)
npm run engine:game-sdl:run:rust-pong
npm run engine:game-sdl:run:rust-autopeli   # games/autopeli_wasm (linear RGW1 + host physics)

# Kehitys: hot reload (TSX-muutokset latautuvat lennossa)
npm run engine:game:watch:pong
npm run engine:game:watch:breakout
npm run engine:game:watch:invaders
npm run engine:game:watch:pacman
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

| Peli | Kansio | Polku | Huomio |
|------|--------|-------|--------|
| Pong | `pong` | TSX | Minimal-malli, suositeltu pohja |
| Breakout | `breakout` | TSX | Multi-screen, JSX HUD, split screen |
| Pac-Man | `pacman` | TSX | Split screen + autoscale |
| Space Invaders | `invaders` | TSX | Stressitesti (paljon rect-spritejä) |
| Pomppija | `ylos2` | TSX | Platformer, LPC-sheet-spritet, musiikki |
| Flipperitorni | `pinpall` | TSX + Cannon | Pystypinball, split screen |
| Physics Sandbox | `physics_sandbox` | TSX + Cannon | Flipperit, pegs, sheet-animaatiot |
| Autopeli Physics | `autopeli_physics` | TSX + host physics | Top-down racer, jaettu fysiikkamaailma |
| Rust Pong | `rust_pong` | WASM | Path C PoC, getter-ABI |
| Autot2 (Rust Autopeli) | `autopeli_wasm` | WASM + physics | RGW1 linear ABI, host rendering |
| Autopeli (AS) | `autopeli_as` | WASM (AssemblyScript) | Sama peli AS-guestina |
| Autopeli (`.as`) | `autopeli_as_src` | `.as` tulkittu | Sama guest tulkattuna, ei käännösvaihetta |
| Pyörretris | `pyorretris` | `.as` (`render=sprites`) | Tetris; guest-driven kääntyvät spritet ABI:n yli, ei fysiikkaa |
| Pyörretris 2P | `pyorretris2p` | `.as` (`render=sprites`, `players=2`) | Kaksinpeli-Tetris: kaksi kenttää heti; P1 = WASD (OFF_INPUT), P2 = nuolet (OFF_INPUT2) |
| Sprite Test | `sprite_char` | WASM (`abi=sprite`) | Valmis hahmosetti (RGSP1): valinta + kävely/hyppy |
| Pose Demo | `pose_demo` | `.as` + pose | Pose-input (RGP1) -demo |
| Streaming World | `streaming_world` | `engine=streaming` | Resurssien striimaus kameran mukaan (RGX1/RGLD) |
| EVG Effects | `ui_effects` | `engine=ui` | EVG glow/pulse-efektit |
| EVG UI Menu | `ui_menu` / `ui_menu_as` | `engine=ui` | Interaktiivinen RGU1-valikko (WASM + `.as`) |

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
icon=assets/image.png     # launcherin ikonikuva (ks. ikonien generointi alla)
iconFrames=120            # kuinka monta headless-framea ennen ikoniscreenshotia
splitScreen=auto          # auto | always | never (jaetaanko ruutu)
splitWorld=shared         # shared | separate (jaetun maailman malli, ks. alla)
autoscale=true            # host skaalaa 480×270 → paneeliin
soloScript=index.tsx      # split-tilan yksinpeliskripti
engine=wasm               # tsx (oletus) | wasm | as | ui | streaming
render=sprites            # (engine=as) guest-driven rotatable spritet, ei fysiikkaa
players=2                  # (render=sprites) kaksinpeli: P1 = WASD → OFF_INPUT, P2 = nuolet → OFF_INPUT2
module=logic.wasm         # WASM-moduulin tiedosto
abi=linear                # getter (oletus) | linear (RGW1 shared memory) | sprite (RGSP1)
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

### Launcher-ikonit (screenshotit)

Launcherin pelitiilet näyttävät pelin oman kuvan (`icon=` `game.info`:ssa,
konventiona `assets/image.png`). Puuttuvat ikonit generoidaan ajamalla peli
headlessinä ja nappaamalla ruutukaappaus:

```bash
npm run engine:game:icons                  # kaikki pelit joilta ikoni puuttuu
node .../game_icon_shots_demo.js --force pong   # yhden pelin uudelleenotto
```

Työkalu ([`scripting/game_icon_shots_demo.rgr`](./scripting/game_icon_shots_demo.rgr))
tukee `tsx`- ja `as`-pelejä, kirjoittaa kuvan pelin kansioon ja lisää `icon=`-
rivin `game.info`:on. Olemassa olevaa kuvaa ei koskaan ylikirjoiteta ilman
`--force`-lippua, ja jos `assets/image.png` on pelin oma asset (esim.
invadersin taustakuva), ikoni tallentuu nimellä `assets/icon.png`. `iconFrames=`
säätää monenko framen jälkeen kaappaus otetaan (esim. Breakout kaatuu nopeasti
game overiin, joten se käyttää arvoa 120).

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

#### Mitä engine lukee palautetusta tilasta — ja mitä ei

`update()` palauttaa pelin **koko tilan**: se on reducerin akku, joka syötetään
takaisin `props.state`-kenttänä seuraavalla framella. Engine ei omista tilan
muotoa — se prosessoi siitä vain pienen joukon **sovittuja avaimia**:

| Avain | Enginen käyttö |
|-------|----------------|
| `entities` | `{ id: { x, y } }` → siirtää `sprites()`-listan retained-objektit |
| `cameraY` | vierittää `createStaticBg()`-taustaa |
| `score1` / `score2` | HUD |
| `events` | äänet, partikkelit, vokaaliefektit ym. (drainataan framen jälkeen) |
| `collisionEvents`, `playerCount` / `playerSlots`, `screens` | törmäykset, pelaajamäärä, moniruutuisuus |
| `physics` / `world` / `impulses` / `steer` | **vain** jos peli ottaa host-fysiikan käyttöön `config().physics`-kentällä |

**Kaikki muut avaimet ovat pelin omaa työmuistia — engine ei lue eikä tulkitse
niitä.** Esimerkiksi Ylos 2:n palauttamassa tilassa `diamonds`, `fruits`,
`bullets`, `enemies`, `movingPlatforms`, `fireCd1` jne. ovat pelkkää pelilogiikkaa:
engine tallettaa tilaobjektin sellaisenaan ja antaa sen muuttumattomana takaisin
seuraavalle `update()`-kutsulle. Vain projektiokenttä `entities` — jonka peli
tyypillisesti laskee domain-tilastaan joka framella (esim. ylos2:n
`placeEntities(...)`) — sitoo pelin tilan enginen spriteihin.

Miksi näin: peli omistaa tilansa muodon täysin ja engine pysyy geneerisenä
(lukee `entities` + em. sovitut kentät, sivuuttaa loput). Tämä on myös se syy,
miksi hot-reload säilyttää tilan — palautettu tila on pelkkää dataa, joka elää
`update()`-rungon vaihdon yli, koska engine ei ole kytkeytynyt sen pelikohtaisiin
kenttiin.

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
| **Vokaaliefektit** | Ennalta määritellyt vokaaliefektit (nauru, huokaus, haukotus…): `events: [{ kind: "playVoice", id: "laugh" }]` tai suora ABI-kutsu `laugh()` / `voice("sigh")`. Enginen oma syntetisaattori (`game_vocal_fx.rgr`), ei riippuvuutta Voiceboxiin — halutessa korvaa efektin Voiceboxilla renderöidyllä WAV-assetilla. Demo: `scripting/vocal_fx_demo.game.tsx`. Katso [`docs/VOCAL_FX.md`](./docs/VOCAL_FX.md) (`npm run engine:vocalfx`) |
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

### Split screen

Kun `game.info`:ssa on `splitScreen=auto` tai `always`, **engine** jakaa ruudun kahtia — peli on kirjoitettu yhden pelaajan näkökulmasta, eikä sen tarvitse tehdä mitään. Vasen ja oikea puoli (240×270) saavat oman ohjaimensa ja kameransa.

Jako on kaksi erillistä akselia:

**1. Jaetaanko ruutu** (`splitScreen`):

| `game.info` | Merkitys |
|-------------|----------|
| `splitScreen=auto` | Engine jakaa yksinpelin kahteen ruutuun (oletusarvoinen split) |
| `splitScreen=always` | Sama kuin `auto` (alias) |
| `splitScreen=never` | Ei koskaan split (tai rivi puuttuu) |

**2. Jaetun maailman malli** (`splitWorld`) — mitä ruutujen takana on:

| `game.info` | Merkitys |
|-------------|----------|
| `splitWorld=separate` | Kaksi **itsenäistä pelisessiota**, yksi per ruutu (esim. flipperi: kaksi eri lautaa). TSX-pelien oletus. |
| `splitWorld=shared` | **Yksi jaettu maailma/fysiikka**, kaksi kameraa eri pelaajille (esim. autopeli: yksi rata, kaksi näkymää). WASM+fysiikka-pelien oletus. |
| *(puuttuu)* | Host päättelee backendistä: `shared` wasm+physics-peleille, muuten `separate`. Nykykäytös säilyy; eksplisiittinen arvo irrottaa valinnan backendistä. |

Muut kentät:

| `game.info` | Merkitys |
|-------------|----------|
| `autoscale=true` | Host renderöi 480×270-bitmappiin ja skaalaa paneeliin (oletus) |
| `autoscale=false` | Paneeli = 240×270; peli skaalaa itse (`bgWidth`) |
| `soloScript=index.tsx` | Valinnainen eri skripti split-ruuduille |

**Autoscale (bitmap):** peli piirtää normaalisti täysleveään framebufferiin (`bgWidth=480`). Host kopioi valmiin RGBA-bitmappin puolikkaaseen leveyteen `copyRectScaledFrom`-blitillä tai GPU-split-presentillä. Toimii kaikilla piirtotavoilla: spritet, `createStaticBg`, HUD, suora canvas.

**Ilman autoscalea:** peli saa `bgWidth=240` ja vastaa itse layoutista (esim. Ylos).

**Ohjaus split-tilassa:** vasen ruutu = WASD + gamepad 0, oikea = nuolet + gamepad 1.

**Dual-player -tila:** molemmat painavat **Start** samalla framella → jaettu ruutu (esim. Ylos kahdella pelaajalla).

Esimerkit: Pac-Man, Breakout, Invaders, Flipperitorni (`splitScreen=auto`); Pomppija (`autoscale=false`).

Tiedostopohjaiset ruudut (`level2.tsx`, `win.tsx`), taustakuvat ja `gamedata.json`: **[`docs/GAME_SCREENS_AND_STORAGE.md`](./docs/GAME_SCREENS_AND_STORAGE.md)**.

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
| **sprite (RGSP1)** | Valmis hahmosetti: guest kirjoittaa slotit, host piirtää | Sprite Test |

Guestit kirjoitetaan **Rustilla** (`wasm/rust_*`) tai **AssemblyScriptilla** (`wasm/as_*`);
sama guest voidaan ajaa myös tulkattuna (`engine=as`). Lähdekoodi: [`games/rust_pong/src/`](./games/rust_pong/src/),
[`games/autopeli_wasm/src/`](./games/autopeli_wasm/src/), [`games/autopeli_as/src/`](./games/autopeli_as/src/).
ABI-määrittely: [`wasm/wasm_game_abi.h`](./wasm/wasm_game_abi.h) (RGW1),
[`wasm/wasm_sprite_abi.h`](./wasm/wasm_sprite_abi.h) (RGSP1),
[`wasm/wasm_ui_abi.h`](./wasm/wasm_ui_abi.h) (RGU1). Kokonaiskuva: [`IDEAL_API.md`](./IDEAL_API.md).

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

## WASM-guest Rangerilla (kirjoita peli Ranger-kielellä)

WASM-guestin voi kirjoittaa myös **Rangerilla** — sama kieli jolla kääntäjä
itse on tehty. Koska Ranger-kääntäjä ajaa selaimessa, peli voidaan periaatteessa
kirjoittaa, kääntää **ja** ajaa kokonaan selaimessa.

Kokonainen peli-esimerkki: [`games/ranger_autopeli/src/`](./games/ranger_autopeli/src/)
(kaksinpelin top-down-racer, RGW1-linear + RGU1-UI, fixed-point + f64).
Ohjelmointimallien (luokat, RC, kokoelmat, mapit, merkkijonot) leikatut ja
testatut esimerkit ovat runtime-demoissa [`runtime/wasm/*_demo.rgr`](../../runtime/wasm/)
+ niiden `*_test.mjs`-ajurit.

### Käännösputki

Ranger → WAT-teksti → `.wasm`. Backend on LLVM-generaattorin WAT-moodi
(ei libc:tä, freestanding):

```bash
# 1) Ranger -> WAT  (backend kirjoittaa .wat.ll-päätteellä)
RANGER_LIB="compiler/Lang.rgr:lib/stdops.rgr" \
  node bin/output.js -l=llvm -wat -freestanding [-wasmrc] \
  peli.rgr -nodecli -d=tmp/out -o=peli.wat
# 2) WAT -> wasm
node_modules/.bin/wat2wasm tmp/out/peli.wat.ll -o logic.wasm
```

Enginen ABI odottaa paljaita export-nimiä (`init`, `update`, …), mutta Ranger
mangloi metodit muotoon `Luokka_metodi`. Valmis peli `sed`-uudelleennimeää
exportit `build.sh`:ssä — katso [`games/ranger_autopeli/src/build.sh`](./games/ranger_autopeli/src/build.sh).
(Vaihtoehto: nimeä luokka niin että mangattu nimi osuu suoraan.)

### Kaksi tilaa: bump vai `-wasmrc`

* **Ilman `-wasmrc`** WAT-backend käyttää *vuotavaa* bump-allokaattoria. Tämä
  riittää peleille jotka **eivät varaa muistia** ajon aikana — pelkkää
  fixed-point-laskentaa kiinteissä linear-memory-slotissa (kuten
  ranger_autopeli). Pienin ja yksinkertaisin.
* **`-wasmrc`** kytkee **viittauslaskuri-runtimen**: free-list-keko,
  automaattinen objektien / merkkijonojen / kokoelmien vapautus. Tarvitaan jos
  peli varaa muistia joka framessa (`new`, merkkijonot, listat). Importtaa
  runtime ja kutsu `Heap_init()` kerran hostissa:

```ranger
; polku on suhteellinen lähdetiedostoon nähden (repo-juuren runtime/wasm/)
Import "polku/runtime/wasm/ranger_obj.rgr"   ; tuo keko + objekti/str/kokoelma-RC
```

Runtime: [`runtime/wasm/ranger_heap.rgr`](../../runtime/wasm/ranger_heap.rgr) (allokaattori)
ja [`runtime/wasm/ranger_obj.rgr`](../../runtime/wasm/ranger_obj.rgr) (RC + string- ja
kokoelma-runtime). Muistimallin koko suunnitelma: [`PLAN_WASM_MEMORY.md`](../../PLAN_WASM_MEMORY.md).

### Mitä kieliominaisuuksia backend tukee

| Ominaisuus | Tuki | Huom |
|------------|:----:|------|
| `int` (i32) | ✅ | |
| `f64` (double) | ✅ | fadd/fsub/fmul/fdiv, vertailut, sitofp/fptosi |
| `boolean` | ✅ | i32-slot |
| `string` | ✅ (`-wasmrc`) | UTF-8 char*, literaalit data-segmentissä |
| Luokat + `new`, instanssikentät | ✅ (`-wasmrc`) | RC + kenttien rekursiivinen vapautus |
| `sfn` (staattinen) / `fn` (instanssi) | ✅ | |
| `if` / `else`, `while`, `for` | ✅ | |
| `[int]`, `[T]`, `[string]`, `[int:int]` | ✅ (`-wasmrc`) | free-list-keolla, kasvavat |
| `Mem.loadI32/storeI32/loadU8/storeU8` | ✅ | suora linear-memory-pääsy |
| `Mem.memSize` / `Mem.memGrow` | ✅ | `memory.size` / `memory.grow` |

Operaattorit (LLVM/WAT-target):

* Aritmetiikka: prefix `(+ a b)` `(- a b)` `(* a b)` tai infix `(a + b)`.
* **Kokonaislukujako on `(idiv a b)`** — EI `/`, joka on liukulukujako
  (`int / int -> f64`).
* Modulo `(% a b)`.
* Bittioperaatiot **täysin sulutettuina**: `(bit_and x y)`, `(bit_or x y)`,
  `(bit_xor x y)`, `(bit_shl x n)`, `(bit_shr x n)`, `(bit_not x)`.
* Vertailut `< > <= >= == !=`, ehdot `&&` `||`.
* Merkkijonot: `(+ "HP " n)` (concat), `to_string`, `strlen`, `==`/`!=`,
  `charAt`, `substring`, `strfromcode`, `rawbytechar`.

### Ohjelmointimallit (mikä toimii, mikä ei)

Kaikki alla oleva on **testattu** WASM-käännöksellä (`runtime/wasm/*_test.mjs`):

| Malli | Tuki | Esimerkki |
|-------|:----:|-----------|
| Luokat: instanssikentät (int/f64/bool/string), metodit `fn`/`sfn`, `new` | ✅ | `class Ent { def hp:int 0 }` |
| Olio välitetään viittauksena kutsuketjussa | ✅ | `SG.apply(e)` |
| Olio **omistaa kokoelmakentän** (`[int]`/`[T]`/`[string]`) | ✅ | `class P { def scores:[int] }` |
| Merkkijonokenttä (dup + rekursiivinen vapautus) | ✅ | `class P { def name:string "" }` |
| Listat `[int]`, `[T]`, `[string]` — push/itemAt/array_length/for | ✅ | |
| **Hash-taulut** `[int:int]` — `set`/`get`, kasvavat | ✅ | `def m:[int:int]` |
| Suora `Mem`-slotti-tila (staattiset metodit, ei varausta) | ✅ | ranger_autopeli |
| **Sisäkkäiset oliot**: kentän-kentän luku/kirjoitus `a.b.c` (mielivaltainen syvyys) | ✅ | `o.mid.inner.v = 99` |
| **Olio-kenttä** (`def v:Vec (new Vec)`) rekursiivinen vapautus + jako | ✅ | RC: retain/move + release |
| **Singletonit** (`@singleton(true)`) — jaettu tila framejen yli | ✅ | `World.__singleton()` |
| **Lambdat / sulkeumat** (`(fn:… (){})`) — kutsu + callback | ✅ (`-wasmrc`) | wasm-taulu + `call_indirect` |
| Lambda **nappaa arvon/merkkijonon/olion** (vain luku) | ✅ (`-wasmrc`) | sulkeuma = RC-olio, napatut retainataan |
| Lambda **mutatoi napattua oliota** (event handler) | ✅ (`-wasmrc`) | jaettu viittaus, RC estää ennenaikaisen vapautuksen |
| Lambda **mutatoi napattua arvoa** (jaettu laskuri) | ✅ (`-wasmrc`) | arvo laatikoidaan jaettuun keko-soluun |

**Singletonit ja globaali tila.** `@singleton(true)` toimii: `__singleton()`
rakentaa instanssin laiskasti mutable-wasm-globaaliin ja palauttaa saman olion
jatkossa, joten tila säilyy `update()`-kutsujen (framejen) välillä — luonteva
tapa pitää pelin globaali tila OO-tyylissä. Kutsu paikallisen kautta:

```ranger
class World @singleton(true) {
    def frame:int 0
    def enemies:[int]
    fn tick:void () {
        frame = (+ frame 1)
        push enemies frame
    }
}
class G {
    sfn update:void () {
        def w (World.__singleton())   ; sama instanssi joka framessa
        w.tick()
    }
}
```

Vaihtoehtoina toki myös (a) staattiset metodit + kiinteät linear-memory-slotit
(`Mem.storeI32`/`loadI32`, kuten ranger_autopeli) tai (b) oliot langoitettuna
kutsuketjun läpi. (Huom: kutsu `(World.__singleton()).metodi()` suoraan ketjuna
sekoittaa tyypintarkistuksen — talleta ensin `def w (World.__singleton())`.)

**Sisäkkäiset oliot.** Olio-kentät toimivat: kentän-kentän luku ja kirjoitus
mielivaltaisella syvyydellä (`o.mid.inner.v = 99`) osuu oikeaan slottiin, ja
olio-kentät ovat **viittauslaskettuja** — tuore `new` siirretään (move),
lainattu jaettu viittaus retainataan, ja vanha vapautetaan ylikirjoituksessa.
Näin jaettu lapsi (sama olio kahdessa kentässä) vapautuu **täsmälleen kerran**.
Ainoa raja: **syklit** (`a.next = b; b.next = a`) vuotavat — RC:n luontainen
rajoitus — mutta eivät kaadu eivätkä korruptoi muistia. Vältä sykliset
olio-graafit, tai katkaise ne (aseta kenttä nulliksi) ennen kuin päästät irti.

**Lambdat ja sulkeumat.** Lambda-arvot ja callbackit toimivat (`-wasmrc`):
jokainen lambda-runko nostetaan omaksi top-level-funktioksi wasm-funktiotauluun,
ja kutsu menee `call_indirect`in läpi. Lambda-arvo on **sulkeuma-tietue = RC-olio**
`[ fn_index | napatut kentät ]`, joten sen elinkaari hoituu samalla
viittauslaskennalla kuin muidenkin olioiden.

```ranger
class SG {
    ; korkeamman kertaluvun funktio: ottaa lambdan ja kutsuu sitä
    sfn apply:int (cb:(fn:int (x:int)) v:int) {
        return (cb(v))
    }
    sfn demo:int () {
        def k 3
        ; nappaa paikallisen k:n (vain luku) — kopioidaan sulkeuman ympäristöön
        return (SG.apply((fn:int (x:int) { return (* x k) }) 5))   ; 15
    }
}
```

Kolme nappaustasoa, kaikki tuettu:

- **Vain luku** — lambda lukee ulomman muuttujan (`k` yllä). Arvot ja
  merkkijonot **kopioidaan** sulkeuman ympäristöön (merkkijono dupataan), oliot
  **retainataan**. Sulkeuman typedesc vapauttaa ne kun tietue tuhoutuu.
- **Napatun olion mutatointi** (event-handler-kuvio) — lambda kirjoittaa
  napatun olion kenttään (`entity.hp = 0`), ja kirjoitus näkyy ulkona, koska
  sulkeuma pitää **saman viittauksen**. Käyttäjän esiin nostama vaara — olio
  vapautuu ennenaikaisesti vaikka lambda vielä viittaa siihen — ei toteudu:
  ympäristö retainaa olion, joten se elää niin kauan kuin **joko** ulompi skooppi
  **tai** sulkeuma pitää siitä kiinni, ja vapautuu täsmälleen kerran.
- **Napatun arvon mutatointi** (jaettu laskuri, `count = count + 1`) — arvo
  **laatikoidaan** jaettuun keko-soluun, jota sekä ulompi skooppi että sulkeuma
  osoittavat, joten muutos on molemminpuolinen. Yksisäikeinen WASM ⇒ ei
  lukituksia.

Rajat: napattu `f64`-arvo ja `this`-nappaus (`this.kenttä` lambdan sisällä)
eivät vielä laatikoidu — kierrä tallettamalla arvo paikalliseen int-muuttujaan
tai olioon ennen lambdaa. Sykliset sulkeumat (sulkeuma nappaa olion, joka
viittaa takaisin sulkeumaan) vuotavat — sama RC:n raja kuin olio-graafeilla.

### Sudenkuopat

* **`sfn` on staattinen — ei `this`.** Kutsu `Luokka.metodi(...)`. `fn` on
  instanssimetodi (tarvitsee vastaanottajan).
* **Yksi lause per rivi** — kaksi lausetta samalla rivillä (esim.
  `set m i x  i = (+ i 1)`) sekoittaa jäsentäjän.
* **Ei heksaliteraaleja** joka polulla — käytä desimaaleja (esim. RGW1-magic
  `827803474`, ei `0x31574752`).
* **Map `get` palauttaa optionaalin** — pakota int-kontekstiin (`(+ 0 (get m k))`)
  tai talleta tyypitettyyn lokaaliin.
* Puuttuva avain mapissa palauttaa `-1`; `-1` on varattu tyhjän paikan
  merkiksi eikä kelpaa avaimeksi.

### Muistinhallinta `-wasmrc`:llä (leak-free)

* **Objektit** (`new`) lasketaan viittauksilla ja vapautetaan scopen lopussa /
  kun rc → 0, mukaan lukien omistetut string- ja objekti-kentät (typedescit).
* **Merkkijonot**: per-scope- ja per-frame-väliaikaiset vapautetaan (omistetut
  lokaalit + lause-arena). HUD-jonot kuten `("SCORE " + n)` eivät vuoda.
* **Kokoelmat** `[int]`/`[T]`/`[string]`/`[K:V]`: varataan free-list-keolta,
  kasvavat ja vapautuvat scopen lopussa (element-RC missä omistettu). Mapit
  kasvavat (tuplaus + uudelleenhajautus).
* **Keko kasvaa** `memory.grow`illa yli alun 64 KiB:n. Host kutsuu `Heap_init()`
  kerran; framen väliaikaiset kierrätetään.

Kattavuus: 102 runtime-testiä ([`runtime/wasm/*_test.mjs`](../../runtime/wasm/)):
heko, objektit, merkkijonot, kentät, kaikki kokoelmat + mapit.

### Testaus (headless, V8)

Node-host ajaa guestin V8:n WebAssemblyllä — sama rajapinta kuin selaimessa:

```bash
# koko peli end-to-end (rakenna + aja headless RGW1-protokolla)
bash gallery/game_engine/games/ranger_autopeli/src/build.sh
node gallery/game_engine/games/ranger_autopeli/src/node_host.mjs   # -> PASS
```

`node_host.mjs` toteuttaa saman RGW1-per-frame-protokollan kuin oikea host.
Ohjelmointimallien testit (käännä `.rgr`-demo → wasm, aja `.mjs`; ks. kunkin
`*_test.mjs`-tiedoston yläkommentti buildkomennoista):
[`coll_rc_test.mjs`](../../runtime/wasm/coll_rc_test.mjs) (listat + olio-taulukot),
[`map_rc_test.mjs`](../../runtime/wasm/map_rc_test.mjs) (hash-taulut),
[`str_rc_test.mjs`](../../runtime/wasm/str_rc_test.mjs) (merkkijonot).

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

Alkuperäinen portability-PoC (kaikki [`ranger_games/`](./ranger_games/):ssä):
pelilogiikka kerran [`ranger_games/pong_core.rgr`](./ranger_games/pong_core.rgr):ssä, kaksi backendia.

| Kerros | Tiedosto | I/O? |
|--------|----------|------|
| Logiikka | `ranger_games/pong_core.rgr` | Ei |
| Piirto | `framebuffer.rgr` + `ranger_games/pong_render.rgr` | Ei (RGBA-puskuri) |
| Terminaali | `ranger_games/pong.rgr` | Kyllä (ANSI + näppäimistö) |
| SDL2 | `ranger_games/pong_sdl.rgr` + `gfx_sdl.rgr` | Kyllä (ikkuna) |

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

## Valmis hahmosetti (sprite-ABI)

Pelit — myös **WASM-guestit** — voivat käyttää valmista hahmojoukkoa **numeerisella
id:llä**, täsmälleen kuten ne soittavat ääntä `RG_WASM_SOUND_*`-id:llä. Guest ei kuljeta
taidetta eikä animaatiokoodia: se valitsee hahmon katalogista, asettaa animaation +
suunnan + sijainnin, ja **host** resolvoi id → spritesheet → animaatioframe ja piirtää.

| Osa | Tiedosto |
|-----|----------|
| ABI-blokki (`RGSP1`) | [`wasm/wasm_sprite_abi.h`](./wasm/wasm_sprite_abi.h) |
| Host-silta (id → arkki, frame, suunta, jump-hop) | [`scripting/wasm_sprite_runner.rgr`](./scripting/wasm_sprite_runner.rgr) |
| Valmis katalogi (totuuslähde) | [`lpc/src/lpc_char_catalog.rgr`](./lpc/src/lpc_char_catalog.rgr) |
| Baketut arkit + attribuutio | [`lpc/pack/characters/`](./lpc/pack/characters/) (`catalog.json`, `<slug>/walk.png`, `<slug>/credits.json`) |
| WASM-guest (Rust) | [`games/sprite_char/src/`](./games/sprite_char/src/) |

Setissä on nyt **4 hahmoa**: `hero` (Ranger), `knight`, `mage`, `rogue` — kaikki
baketaan yhdestä upotetusta walk-arkista värjäämällä housut/kengät/hiukset. Animaatiot:
`walk` (oikea), `run`/`jump` varaavat oikeat LPC-rivit ja fallbackaavat walkiin
(jump saa hostin synteettisen hypyn) kunnes laajennettu taide baketaan mukaan.

```bash
npm run engine:chars:bake    # bake 4 hahmoa -> lpc/pack/characters/<slug>/walk.png (+ credits)
npm run engine:chars:demo    # host-silta päästä päähän, assertit + lpc/output/characters_demo.png
npm run engine:chars:guest   # Rust-guest -> games/sprite_char/sprite_char.wasm (vaatii wasm-targetin)
```

### Testipeli (WASM): hahmon valinta + ohjaimella kävely/hyppy

[`games/sprite_char/`](./games/sprite_char/) on **oikea WASM-peli** launcherin **Tests**-
ryhmässä: **valikko** hahmon valintaan, sitten **ohjaimella** kävely/kääntyminen/hyppy.
Guest (`sprite_char.wasm`) omistaa koko pelin ja kirjoittaa RGSP1-blokin; host
([`scripting/sprite_wasm_runner.rgr`](./scripting/sprite_wasm_runner.rgr), kytketty
`game_sdl_runner`iin `abi=sprite`-reittinä) syöttää inputin ja piirtää slotit arkeista.

```bash
npm run engine:chars:guest         # rakenna sprite_char.wasm (vaatii wasm32-targetin)
npm run engine:chars:verify        # aja guest Noden WebAssemblyssa, assertoi RGSP1-blokki
npm run engine:game-sdl:run:sprite # käännä + käynnistä SDL-launcher suoraan tähän peliin
```

Ohjaus — valikko: vasen/oikea valitsee, A/Space vahvistaa. Peli: nuolet/D-pad kävelee ja
kääntää, A/Space hyppää, Q/Esc takaisin launcheriin.

Host-sillan logiikan voi ajaa myös ilman wasm-toolchainia headless (renderöinti +
assertit, dumppaa `lpc/output/poc_*.png`): `npm run engine:chars:poc`.

### Uusien hahmojen generointi

**A) Uusi väri­variantti olemassa olevasta taiteesta** (nopein, toimii ilman ulkoista LPC-taidetta):

1. Lisää id + nimi + slug [`lpc/src/lpc_char_catalog.rgr`](./lpc/src/lpc_char_catalog.rgr):
   kasvata `charCount`, lisää haara `nameOf`/`slugOf`, ja `applyProfile`-lohko jossa
   annat `legs`/`feet`/`hair`-ryhmille colorize-tintit (`setGroup "legs" 1 R G B`).
   `body`/`head` pidetään tunnisteella `0` (identity → iho & kasvot säilyvät).
2. Peilaa sama id [`wasm/wasm_sprite_abi.h`](./wasm/wasm_sprite_abi.h) (`RG_SPR_CHAR_*`,
   `RG_SPR_CHAR_COUNT`), [`lpc/pack/characters/catalog.json`](./lpc/pack/characters/catalog.json)
   (`characters`-lista) ja tarvittaessa host-sillan `SpriteHost`.
3. Lisää slug bake-listaan [`scripts/bake-characters.sh`](./scripts/bake-characters.sh),
   sitten `npm run engine:chars:bake`. Uusi `walk.png` + `credits.json` syntyy pakettiin.
4. `npm run engine:chars:demo` tarkistaa että host resolvoi id:n oikein.

**B) Rikkaampi hahmo koko LPC-generaattorista** (vaatii Universal-LPC-taiteen):

1. Kloonaa [Universal-LPC-Spritesheet-Character-Generator](https://github.com/liberatedpixelcup/Universal-LPC-Spritesheet-Character-Generator)
   sisar­hakemistoksi tai osoita siihen `LPC_ROOT`-ympäristömuuttujalla.
2. Kirjoita valinnat `lpc/fixtures/selections-<slug>.json`-muotoon (`bodyType` +
   `selections` per layer, kuten olemassa olevat `selections-super.json`). Presetit
   `hero`/`knight`/`mage`/`rogue` ovat jo mukana lähtökohdaksi.
3. Lisää preset-luokka `lpc/src/lpc_demo_<slug>.rgr` (mallina `lpc_demo_super.rgr`) ja
   reititä se `lpc/src/lpc_draw.rgr:buildCalls`-metodissa; `npm run engine:lpc:run -- <slug> <out.png>`.
4. Lisenssit: aja `credits.json` aina pelin mukana (attribuutio pakollinen). Yksityiskohdat
   ja `licenseFilter`-malli: [`LPC_HEADLESS_SPRITESHEET.md`](./LPC_HEADLESS_SPRITESHEET.md).

Kummassakaan tapauksessa **guest-koodia ei tarvitse muuttaa** — uusi hahmo on vain uusi id.

## Testit

| Testi | Mitä kattaa |
|-------|-------------|
| [`tests/game-engine-render.test.ts`](../../tests/game-engine-render.test.ts) | SoftCanvas / Pong-renderöinti |
| [`tests/game-runner.test.ts`](../../tests/game-runner.test.ts) | GameRunner + TSX, ääni, fysiikka, Ylos |
| [`tests/game-scripting.test.ts`](../../tests/game-scripting.test.ts) | ComponentEngine-skriptaus |
| [`tests/physics-cannon.test.ts`](../../tests/physics-cannon.test.ts) | Cannon.js -portti |

Peli-testirunnerit (headless per-peli `*_runner_demo.rgr`, ajaa em.
`.test.ts`-tiedostot) elävät hakemistossa [`tests/`](./tests/) — ks.
[`tests/README.md`](./tests/README.md). Moottorin ydinkomponenttien self-testit
(`scripting/*_demo.rgr`) jäävät `scripting/`-hakemistoon runtimen viereen (alla).

### Headless self-testit (`scripting/*_demo.rgr`)

IDEAL-työn ja Phase R -korjausten komponentit kääntyvät Ranger-kääntäjällä ja
ajetaan nodella — **ilman SDL/WASM-buildia**. Kukin ajaa self-testin ja tulostaa
`RESULT: N passed, 0 failed`. Aja yksi:

```bash
RANGER_LIB=compiler/Lang.rgr:lib/stdops.rgr node bin/output.js -es6 \
  gallery/game_engine/scripting/<nimi>_demo.rgr \
  -d=gallery/game_engine/scripting -o=<nimi>_demo.js -nodecli \
  && node gallery/game_engine/scripting/<nimi>_demo.js
```

| Demo | Kattaa |
|------|--------|
| `wasm_cap_gate_demo` | Capability gate (§6): ver/caps-hylkäys |
| `wasm_block_validator_demo` | Blokki-validointi (magic/version/size/clamp) |
| `game_provider_demo` | Provider-rekisteri: advertised caps = OR(capBit) |
| `game_env_resolver_demo` | RGCQ-ympäristövastaukset (§1.2) |
| `game_scene_provider_demo` | Scene-provider-seam: toinen peli samalla rajapinnalla |
| `game_sound_palette_demo` | Äänipaletti-rekisteri (§4) |
| `game_fixed_step_demo` | Fixed-step-plannerin invariantit (R.1) |
| `game_split_world_demo` | `splitWorld` shared/separate -resolvointi (R.7) |
| `game_script_contract_demo` | Skriptien paluuarvojen validointi (R.8) |
| `game_runner_mode_demo` | RunnerMode-luokittelu + laittomat tilat (R.6) |

Integraatiotesti oikealla pelillä: [`tests/breakout_runner_demo.rgr`](./tests/breakout_runner_demo.rgr)
ajaa `breakout.game.tsx`:n koko runtimen läpi (fixed-step, entities, contract) nodella.

## Dokumentaatio ja tiedostot

| Tiedosto | Sisältö |
|----------|---------|
| [`ROADMAP.md`](./ROADMAP.md) | Nykytila, puutteet, prioriteetit |
| [`IDEAL.md`](./IDEAL.md) | Tavoiteltu ABI/rajapintasuunnittelu — miksi kukin rajapinta on kuten on, nykytila vs. ideaali |
| [`IDEAL_API.md`](./IDEAL_API.md) | Koko ABI yhtenä referenssinä: blokki-layoutit, host-importit, eventit, capability-bitit |
| [`IDEAL_TODO.md`](./IDEAL_TODO.md) | Vaiheistettu toteutuspolku IDEAL→koodi: mikä on tehty, mikä kesken, verifiointitapa, Phase R runtime-korjaukset |
| [`wasm/README.md`](./wasm/README.md) | ABI-blokki-indeksi (RGW1/RGSP1/RGU1/RGP1/RGIN): magic/versio/koko/suunta |
| [`PLAN_GAME_ENGINE.md`](./PLAN_GAME_ENGINE.md) | Arkkitehtuuri, HDMI, gamepad-suunnitelma |
| [`RENDERING_EVG.md`](./RENDERING_EVG.md) | EVG/vektori-renderöinnin integraatio (tuleva) |
| [`docs/GAME_SCRIPTING.md`](./docs/GAME_SCRIPTING.md) | TSX-skriptaus, GameRunner, importit |
| [`docs/GAME_SCREENS_AND_STORAGE.md`](./docs/GAME_SCREENS_AND_STORAGE.md) | Ruutujen lataus (`loadGame`/`pushGame`) ja `gamedata.json` |
| [`docs/GAME_ENGINE_DESIGN.md`](./docs/GAME_ENGINE_DESIGN.md) | Retained mode + JSX HUD -malli |
| [`docs/TSX_ENGINE_ISSUES.md`](./docs/TSX_ENGINE_ISSUES.md) | Tunnetut evaluator-rajoitukset |
| [`LLVM_BUGS.md`](./LLVM_BUGS.md) | LLVM-backendin bugit |
| [`games/rust_pong/README.md`](./games/rust_pong/README.md) | WASM Path C PoC |
| `scripting/game_runtime.rgr` | GameRunner (sprites, update, hud, ääni, fysiikka) |
| `scripting/game_sdl_runner.rgr` | SDL2-host + launcher + hot reload + WASM |
| `scripting/wasm_game_runner.rgr` | WASM getter-ABI (Pong) |
| `scripting/wasm_physics_runner.rgr` | WASM linear ABI + host physics (Autopeli) |
| `scripting/wasm_sprite_runner.rgr` | Valmiin hahmosetin sprite-ABI (`RGSP1`): id → arkki, frame, suunta, jump |
| `lpc/src/lpc_char_catalog.rgr` | Hahmokatalogi (id, nimi, recolor-profiili) — valmiin setin totuuslähde |
| `lpc/pack/characters/` | Baketut hahmoarkit + `catalog.json` + per-hahmo `credits.json` |
| `games/sprite_char/src/` | WASM-guest joka ohjaa hahmoja sprite-ABI:n yli |
| `games/sprite_char/` | WASM-testipeli (Tests): hahmon valinta + ohjaimella kävely/hyppy |
| `scripting/sprite_wasm_runner.rgr` | Host: ajaa sprite_char.wasmin, syöttää inputin, piirtää slotit (`abi=sprite`) |
| `scripting/sprite_char_poc.rgr` | Host-sillan headless-testiydin (gfx-vapaa, ei wasmia) |
| `scripting/game_catalog.rgr` | `games/`-hakemiston skannaus |
| `scripting/game_persistence.rgr` | `gamedata.json` tallennus |
| `scripts/build-game-sdl.sh` | TSX- ja WASM-pelien SDL-binääri |
| `scripts/build-sdl.sh` | Käännetty Pong SDL |
| `scripts/build-native.sh` | LLVM Pong |
| `scripts/build-raspberry.sh` | Pi 5 aarch64 -paketti (pong + runtime-assetit) |
| `scripts/sync-game-engine-runtime.sh` | Kopioi games/menu/scripting/lib deploy-hakemistoon |
