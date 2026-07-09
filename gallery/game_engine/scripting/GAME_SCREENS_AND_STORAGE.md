# Peliruutujen lataus ja pelikohtainen tallennus

> Täydentää [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md) ja [`../README.md`](../README.md).  
> Kuvaa kaksi erillistä mekanismia:
>
> 1. **Tiedostopohjaiset ruudut** — `loadGame` / `pushGame` / `popGame` vaihtaa toiseen `.tsx`-skriptiin samassa pelikansiossa.
> 2. **Pysyvä tallennus** — `loadGameData` / `saveGameData` lukee ja kirjoittaa `gamedata.json`-tiedoston pelikansioon.

Nämä eivät ole sama asia kuin Breakoutin **multi-screen**-malli (`state.screen` + `state.screens` yhdessä tiedostossa). Tiedostoruudut ovat erillisiä skriptejä, joilla on oma `initState`, `sprites`, `hud` jne.

## Milloin käyttää mitä

| Tarve | Ratkaisu |
|-------|----------|
| Pelin sisäinen valikko / game over yhdessä tiedostossa | `state.screen` + `state.screens` (Breakout) |
| Erillinen taso, voittoruutu tai aliruutu omassa tiedostossa | `pushGame` / `loadGame` + erillinen `.tsx` |
| High score, edistyminen, asetukset pelien välillä | `saveGameData` → `gamedata.json` |
| Takaisin launcher-valikkoon | `popGame()` kun pino tyhjä, tai Q/Esc hostissa |

## Tiedostorakenne (esimerkki: Invaders)

```
games/invaders/
├── index.tsx           # taso 1 — launcher käynnistää tämän
├── level2.tsx          # taso 2 — pushGame("level2.tsx")
├── win.tsx             # voittoruutu — loadGame("win.tsx")
├── invaders_shared.tsx # jaettu logiikka (import)
├── game.info
├── gamedata.json       # luodaan saveGameData-kutsulla
└── assets/
    └── image.png       # taustakuva (resources)
```

Jokainen `.tsx`-ruutu on täysi GameRunner-skripti: host lataa tiedoston, kutsuu `setupScene()` ja ajaa normaalin pelisilmukan.

## Ruutujen navigointi

Host toteuttaa navigoinnin [`game_host_native.rgr`](./game_host_native.rgr) + [`game_sdl_runner.rgr`](./game_sdl_runner.rgr). Skripti kutsuu globaaleja funktioita (ei importtia):

| Funktio | Käyttäytyminen |
|---------|----------------|
| `loadGame(path)` | Korvaa nykyisen ruudun. Tyhjentää navigaatiopinon. Kutsuu `initState()` uudessa skriptissä. |
| `pushGame(path)` | Tallentaa nykyisen polun pinoon, avaa uuden ruudun. Paluu `popGame()`:lla. |
| `popGame()` | Lataa edellisen ruudun pinosta. Jos pino tyhjä → host palaa launcher-valikkoon. |

Polut ovat **suhteellisia nykyisen pelikansion juureen** (`games/invaders/`). Esim. `"level2.tsx"` tai `"win.tsx"`. Absoluuttiset polut (`/...`) hyväksytään sellaisenaan.

Navigointipyyntö käsitellään **framen lopussa** (`drainScriptNavigation`), joten kutsu `update()`-funktiossa on turvallinen:

```tsx
function update(props) {
  if (waveCleared) {
    saveGameData({ score1: s.score1, score2: s.score2, level: 2 });
    loadGame("win.tsx");
  }
  return props.state;
}
```

### Tyypillinen kulku

```
index.tsx  ──pushGame("level2.tsx")──►  level2.tsx  ──loadGame("win.tsx")──►  win.tsx
                                                                                    │
                                                                         popGame()  │
                                                                                    ▼
                                                                              index.tsx
                                                                         (tai menu jos pino tyhjä)
```

- **Taso 1 → taso 2:** `pushGame("level2.tsx")` — pelaaja voi teoriassa palata `popGame()`:lla (esim. pause-valikosta).
- **Taso 2 → voitto:** `loadGame("win.tsx")` — korvaa koko pelin tilan, pino tyhjenee.
- **Voitto → menu:** `popGame()` — palaa `index.tsx`:ään (koska `pushGame` tallensi sen pinon pohjalle). Vaihtoehto: Q/Esc hostissa → launcher.

Kutsu tehdään yleensä reunalla (näppäin tai pelitilan muutos), ei joka framella:

```tsx
function update(props) {
  if (props.action) {
    popGame();
  }
  return props.state;
}
```

## Taustakuvat ja `resources()`

Jokainen ruututiedosto voi rekisteröidä omat resurssinsa. Kuva ladataan kerran `setupScene()`-vaiheessa.

```tsx
function resources() {
  return [
    { kind: "image", id: "bg", path: "assets/image.png" }
  ];
}

function backgroundImage() {
  return "bg";
}
```

| Kenttä | Merkitys |
|--------|----------|
| `resources()[].kind` | `"image"` (PNG/JPEG) |
| `resources()[].id` | Lyhyt tunniste, jota `backgroundImage()` palauttaa |
| `resources()[].path` | Polku **suhteessa skriptin kansioon** (`assets/image.png`) |

Host skaalaa kuvan peittämään koko framebufferin (`blitCover`). Sama `image.png` voidaan käyttää useassa ruudussa — jokainen ruutu lataa sen oman `resources()`-kutsunsa kautta (välimuisti `game_image_loader.rgr`:ssä).

Vaihtoehto runtime-aikana: aseta `state.background` uuteen `resources()`-id:hen tai polkuun; host vaihtaa taustan automaattisesti (`syncBackgroundFromState`).

Yksinkertainen demo: [`background_demo.game.tsx`](./background_demo.game.tsx).

## Pelikohtainen tallennus (`gamedata.json`)

Tallennus on **yhden pelikansion sisäinen**. Kaikki ruudut (`index.tsx`, `level2.tsx`, `win.tsx`) jakavat saman `gamedata.json`:n, koska host asettaa `gameDir`:ksi pelikansion (`wireNativeBridge`).

| Funktio | Toiminto |
|---------|----------|
| `loadGameData()` | Lukee `gamedata.json`. Palauttaa tyhjän objektin `{}`, jos tiedostoa ei ole. |
| `saveGameData(obj)` | Kirjoittaa koko objektin `gamedata.json`:iin (korvaa edellisen sisällön). |
| `resetGameData()` | Poistaa `gamedata.json`:n. |

Tiedosto on tavallinen JSON-objekti. Peli määrittelee kentät vapaasti — moottori ei tunne skeemaa.

```json
{
  "score1": 120,
  "score2": 2,
  "level": 2
}
```

### Lukeminen `initState()`:ssa

```tsx
function readScore(data, key, fallback) {
  const v = data[key];
  if (v == null) {
    return fallback;
  }
  return v;
}

function initState() {
  const data = loadGameData();
  return {
    score1: readScore(data, "score1", 0),
    score2: readScore(data, "score2", 3)
  };
}
```

Käytä aina oletusarvoja: ensimmäisellä ajolla tiedostoa ei ole.

### Kirjoittaminen

Tallenna kun tila muuttuu merkittävästi (taso voitettu, game over), älä joka frame:

```tsx
function update(props) {
  const s = props.state;
  if (allAliensDead) {
    saveGameData({ score1: s.score1, score2: s.score2 });
    loadGame("win.tsx");
  }
  return s;
}
```

`saveGameData` kirjoittaa vain JSON-yhteensopivia arvoja (numerot, merkkijonot, booleanit, taulukot, tasaiset objektit). Älä yritä tallentaa funktioita tai syklisiä rakenteita.

## Esimerkkiruudut

### `win.tsx` — voittoruutu, vain HUD

Ei sprittejä. Lukee pisteet tallennuksesta. Space → takaisin edelliseen ruutuun.

```tsx
/// <reference path="../../scripting/game.d.ts" />

function resources() {
  return [
    { kind: "image", id: "bg", path: "assets/image.png" }
  ];
}

function backgroundImage() {
  return "bg";
}

function sprites() {
  return [];
}

function readScore(data, key, fallback) {
  const v = data[key];
  if (v == null) {
    return fallback;
  }
  return v;
}

function initState() {
  const data = loadGameData();
  return {
    score1: readScore(data, "score1", 0),
    score2: readScore(data, "score2", 0)
  };
}

function update(props) {
  if (props.action) {
    popGame();
  }
  return props.state;
}

function hud(props) {
  const s = props.state;
  return (
    <View width="100%" height="100%" flexDirection="column" justifyContent="center" align="center">
      <Label color="#fff060">YOU WIN</Label>
      <Label color="#8fd3ff">SCORE {s.score1}</Label>
      <Label color="#aaaaaa">SPACE MENU</Label>
    </View>
  );
}
```

### `level2.tsx` — taso jaetulla logiikalla

Ladataan `pushGame`:lla. Jaettu koodi omassa moduulissa.

```tsx
/// <reference path="../../scripting/game.d.ts" />

import {
  buildSprites,
  makePlayState,
  playHud,
  runPlayUpdate
} from "./invaders_shared";

function resources() {
  return [
    { kind: "image", id: "bg", path: "assets/image.png" }
  ];
}

function backgroundImage() {
  return "bg";
}

function sprites() {
  return buildSprites();
}

function readScore(data, key, fallback) {
  const v = data[key];
  if (v == null) {
    return fallback;
  }
  return v;
}

function initState() {
  const data = loadGameData();
  const score1 = readScore(data, "score1", 0);
  const score2 = readScore(data, "score2", 3);
  return makePlayState(score1, score2, "LEVEL 2");
}

function update(props) {
  return runPlayUpdate(props, 9, "level2");
}

function hud(props) {
  const s = props.state;
  return playHud(s.levelLabel, s.score1, s.score2);
}
```

### `index.tsx` — siirtymä tasolle 2

Kun ensimmäinen aalto on selvä, tallenna ja avaa seuraava ruutu:

```tsx
function update(props) {
  const s = props.state;
  // ... pelilogiikka ...
  if (waveCleared) {
    saveGameData({ score1: s.score1, score2: s.score2 });
    pushGame("level2.tsx");
    return s;
  }
  return s;
}
```

`level2.tsx`:ssä voiton jälkeen:

```tsx
if (waveCleared) {
  saveGameData({ score1: s.score1, score2: s.score2 });
  loadGame("win.tsx");
}
```

## Jaetut moduulit ruutujen välillä

`import` toimii kuten tavallisissa peleissä — polku suhteessa skriptin kansioon:

```tsx
import { buildSprites, runPlayUpdate } from "./invaders_shared";
```

Host asettaa `setScriptDir` ennen latausta, joten `./invaders_shared.tsx` ratkaistaan `games/invaders/`-kansiosta riippumatta siitä, kumpi ruutu on aktiivinen.

## Hot reload

Kun hot reload on päällä, yksittäisen ruututiedoston muutos päivittää vain kyseisen skriptin. Navigointi toiseen tiedostoon lataa aina koko ruudun uudelleen. `gamedata.json` ei päivity automaattisesti — vain `saveGameData`-kutsu kirjoittaa levylle.

## Tyypit ja toteutus

Globaalit funktiot on määritelty [`engine.d.ts`](./engine.d.ts):

```ts
declare function loadGame(screenPath: string): void;
declare function pushGame(screenPath: string): void;
declare function popGame(): void;
declare function loadGameData(): Record<string, unknown>;
declare function saveGameData(data: Record<string, unknown>): void;
declare function resetGameData(): void;
```

Toteutus:

| Tiedosto | Rooli |
|----------|-------|
| `game_host_native.rgr` | Native bridge: kutsujen käsittely, polkujen ratkaisu |
| `game_sdl_runner.rgr` | Navigaatiopino, `loadScriptAt`, äänen nollaus ruudun vaihdossa |
| `game_persistence.rgr` | JSON luku/kirjoitus `gamedata.json` |
| `game_runtime.rgr` | `resources()`, `backgroundImage()`, `setupScene()` |

Testit: [`game_host_native_demo.rgr`](./game_host_native_demo.rgr) (persistence + `loadGame`-polku).
