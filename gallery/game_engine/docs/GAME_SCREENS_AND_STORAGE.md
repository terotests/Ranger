# Peliruutujen lataus ja pelikohtainen tallennus

> Täydentää [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md) ja [`../README.md`](../README.md).

Kaksi erillistä mekanismia:

1. **Tiedostopohjaiset ruudut** — `loadGame` / `pushGame` / `popGame` vaihtaa
   toiseen `.tsx`-skriptiin samassa pelikansiossa. Kukin ruutu on täysi
   GameRunner-skripti (`initState`, `sprites`, `hud`, …).
2. **Pysyvä tallennus** — `loadGameData` / `saveGameData` / `resetGameData` lukee
   ja kirjoittaa pelikansion `gamedata.json`-tiedoston.

Nämä eivät ole sama kuin Breakoutin **multi-screen**-malli (`state.screen` +
`state.screens` yhdessä tiedostossa) — tiedostoruudut ovat erillisiä skriptejä.

## Milloin käyttää mitä

| Tarve | Ratkaisu |
|-------|----------|
| Pelin sisäinen valikko / game over yhdessä tiedostossa | `state.screen` + `state.screens` (Breakout) |
| Erillinen taso tai voittoruutu omassa tiedostossa | `pushGame` / `loadGame` + erillinen `.tsx` |
| High score, edistyminen, asetukset | `saveGameData` → `gamedata.json` |
| Takaisin launcher-valikkoon | `popGame()` kun pino tyhjä, tai Q/Esc hostissa |

## Ruutujen navigointi

Globaalit funktiot (ei importtia), toteutus
[`game_host_native.rgr`](../scripting/game_host_native.rgr) +
[`game_sdl_runner.rgr`](../scripting/game_sdl_runner.rgr):

| Funktio | Käyttäytyminen |
|---------|----------------|
| `loadGame(path)` | Korvaa nykyisen ruudun ja **tyhjentää** navigaatiopinon. |
| `pushGame(path)` | Tallentaa nykyisen polun pinoon, avaa uuden ruudun. |
| `popGame()` | Lataa edellisen ruudun pinosta; jos pino tyhjä → host palaa launcheriin. |

Polut ovat **suhteellisia pelikansion juureen** (`"level2.tsx"`); absoluuttiset
`/...`-polut hyväksytään sellaisenaan. Navigointipyyntö käsitellään framen lopussa
(`drainScriptNavigation`), joten kutsu `update()`:ssa on turvallinen. Tee kutsu
reunalla (näppäin tai pelitilan muutos), ei joka framella:

```tsx
function update(props) {
  const s = props.state;
  if (waveCleared) {
    saveGameData({ score1: s.score1, level: 2 });
    pushGame("level2.tsx");   // tai loadGame("win.tsx")
  }
  return s;
}
```

Tyypillinen kulku: `index.tsx` ──`pushGame`──► `level2.tsx` ──`loadGame`──►
`win.tsx` ──`popGame`──► `index.tsx` (koska `pushGame` tallensi sen pinoon; jos
pino tyhjä, host palaa menuun).

## Taustakuvat ja `resources()`

Kukin ruutu rekisteröi omat resurssinsa; kuva ladataan kerran
`setupScene()`-vaiheessa (välimuisti `game_image_loader.rgr`).

```tsx
function resources() {
  return [{ kind: "image", id: "bg", path: "assets/image.png" }];
}
function backgroundImage() { return "bg"; }
```

- `path` on suhteessa skriptin kansioon.
- Host skaalaa kuvan peittämään framebufferin (`blitCover`).
- Runtime-aikana: aseta `state.background` uuteen id:hen/polkuun → host vaihtaa
  taustan (`syncBackgroundFromState`).

Demo: [`background_demo.game.tsx`](../scripting/background_demo.game.tsx).

## Pelikohtainen tallennus (`gamedata.json`)

Yhden pelikansion sisäinen: kaikki ruudut jakavat saman `gamedata.json`:n
(host asettaa `gameDir`:ksi pelikansion, `wireNativeBridge`).

| Funktio | Toiminto |
|---------|----------|
| `loadGameData()` | Lukee `gamedata.json`. Palauttaa `{}`, jos tiedostoa ei ole. |
| `saveGameData(obj)` | Kirjoittaa koko objektin (korvaa edellisen). |
| `resetGameData()` | Poistaa `gamedata.json`:n. |

Tiedosto on tavallinen JSON — peli määrittelee kentät vapaasti (moottori ei tunne
skeemaa). Vain JSON-yhteensopivat arvot (numerot, merkkijonot, booleanit,
taulukot, tasaiset objektit); ei funktioita eikä syklisiä rakenteita.

Lue `initState()`:ssa aina oletusarvolla (ensimmäisellä ajolla tiedostoa ei ole);
tallenna kun tila muuttuu merkittävästi (taso voitettu, game over), ei joka frame:

```tsx
function initState() {
  const data = loadGameData();
  const score1 = data.score1 == null ? 0 : data.score1;
  return { score1: score1, score2: 3 };
}
```

## Jaetut moduulit ja hot reload

`import` toimii kuten tavallisissa peleissä — polku suhteessa skriptin kansioon
(`import { buildSprites } from "./invaders_shared"`). Host asettaa `setScriptDir`
ennen latausta, joten polku ratkeaa oikein riippumatta aktiivisesta ruudusta.

Hot reloadissa yksittäisen ruudun muutos päivittää vain sen skriptin; navigointi
toiseen tiedostoon lataa koko ruudun uudelleen. `gamedata.json` päivittyy vain
`saveGameData`-kutsulla.

## Tyypit ja toteutus

Globaalit funktiot on määritelty [`engine.d.ts`](../scripting/engine.d.ts):

```ts
declare function loadGame(screenPath: string): void;
declare function pushGame(screenPath: string): void;
declare function popGame(): void;
declare function loadGameData(): Record<string, unknown>;
declare function saveGameData(data: Record<string, unknown>): void;
declare function resetGameData(): void;
```

| Tiedosto | Rooli |
|----------|-------|
| `game_host_native.rgr` | Native bridge: kutsujen käsittely, polkujen ratkaisu |
| `game_sdl_runner.rgr` | Navigaatiopino, `loadScriptAt`, äänen nollaus; split-modessa `drainSplitScriptNavigation` lataa **vain sen paneelin**, joka kutsui `pushGame`/`loadGame` |
| `game_split_screen.rgr` | Kaksi `GameHostNativeBridge`-instanssia; `consumePendingNav` + `reloadPane` |
| `game_persistence.rgr` | JSON luku/kirjoitus `gamedata.json` |
| `game_runtime.rgr` | `resources()`, `backgroundImage()`, `setupScene()` |

Testit: [`game_host_native_demo.rgr`](../scripting/game_host_native_demo.rgr)
(persistence + `loadGame`-polku).
