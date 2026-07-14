# Pelimoottorin suunnittelu: retained-mode + JSX-HUD

> Täydentää [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md) (API-referenssi) ja
> [`TSX_ENGINE_ISSUES.md`](./TSX_ENGINE_ISSUES.md). Tämä dokumentti kuvaa
> **suunnittelumallin**: miten peli jäsennetään niin että se pysyy nopeana.

## Arkkitehtuuri: kaksi kerrosta, yksi framebuffer

```
┌─────────────────────────────────────────┐
│  hud()  — JSX → EVGLayout → overlay      │  ← UI (teksti, paneelit, valikot)
├─────────────────────────────────────────┤
│  sprites() — retained GameEntity         │  ← Maailma (nopea, liikutetaan vain)
├─────────────────────────────────────────┤
│  SoftCanvas RGBA → gfx_present (SDL2)     │
└─────────────────────────────────────────┘
```

GameRunner piirtää maailman `SoftCanvas`-primitiiveillä (rect/circle/…) ja
compositoi JSX-HUD:in päälle. Koko ruudun yhtenäinen EVG/JSX-puu
([`RENDERING_EVG.md`](../RENDERING_EVG.md)) on pitkän aikavälin tavoite; tänään
oikea malli on **JSX HUD:iin, retained-spritet maailmaan**.

### 1. Alustus kerran — `sprites()` + `initState()`

```tsx
function sprites() {
  return [
    { id: "paddle", kind: "rect", w: 64, h: 10, r: 120, g: 220, b: 255 },
    { id: "ball", kind: "circle", rad: 5, r: 245, g: 245, b: 130 },
    // yksi sprite per objekti — EI yhtä rectiä per pikseli
  ];
}
function initState() { return { entities: { paddle: { x, y }, ball: { x, y } } }; }
```

**Sääntö:** `sprites()` luo kaikki graafiset objektit pelin alussa. Muoto, väri ja
koko eivät muutu runtime-aikana — tämä on retained-moden ydin.

### 2. Simulaatio joka framella — `update()`

```tsx
function update(props) {
  const s = props.state;              // lue props.dt, props.up/down/left/right
  return {
    entities: {
      paddle: { x: newPx, y: s.entities.paddle.y },
      ball: { x: bx, y: by },
      b12: { x: -40, y: -40, visible: 0 }   // kuollut tiili piiloon
    },
    score: s.score + 10
  };
}
```

**Sääntö:** `update()` palauttaa vain **muuttuneet sijainnit** (ja valinnaisen
`visible`-lipun). Runnerin `syncFromState()` siirtää ne olemassa oleville
`GameEntity`-olioille — ei luo uusia sprittejä eikä parsaa JSX:ää uudelleen.
Päivitä vain liikkuvat id:t, älä rakenna koko `entities`-karttaa uudelleen joka
frame.

### 3. Piirto joka framella (runnerin `draw()`)

1. `canvas.clear(bg)`
2. Piirrä vain `visible != 0` -entityt (off-screen culling)
3. Jos skriptissä on `hud()`, kutsu `callRender("hud", { state, time, dt })` ja
   compositoi EVG-puu päälle (`game_hud.rgr`); muuten built-in digit-font pisteille

### 4. JSX vain UI:lle

```tsx
function hud(props) {
  return (
    <View flexDirection="row" padding="6px" background="#0b1020cc">
      <Label color="#8fd3ff">SCORE</Label>
      <Label color="#ffffff">{props.state.score}</Label>
    </View>
  );
}
```

## Yhteenveto yhdellä lauseella

**Sprites kerran alussa, sijainnit reducerilla joka framella, JSX vain HUD:iin —
älä koskaan rakenna satoja rect-spritejä uudelleen joka frame.**

## Esimerkkien opetukset

- **Pong** — minimaalinen malli: 3 entityä, puhdas reducer, digit-font riittää
  (ei JSX:ää).
- **Breakout** — suositeltu pohja: 50 tiiltä + maila + pallo, `hud()` JSX:llä
  pisteille/elämille, kuolleet tiilet `visible: 0`, nimetyt `play`/`gameOver`
  screenit.
- **Invaders** — monta `kind: "bitmap"` -alienia, kaksi cachattua animaatioframea
  per alien (`p0` vaihtaa framen), ei yhtä rectiä per pikseli.

## Nimetty screen-malli (yhden skriptin sisällä)

Peli voi koostua useista **nimetyistä screeneistä** (`play`, `gameOver`, `menu`, …)
saman skriptin sisällä. Screeniä vaihtaessa edellinen jää muistiin jäädytettynä;
uudelle screenille alustetaan omat spritet ja tila. (Erillisiin tiedostoihin
jaetut screenit + tallennus: [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md) →
*Multi-file screens*.)

```tsx
function screens() { return ["play", "gameOver"]; }

function initState() {
  return { screen: "play", screens: { play: initPlayState() } };
}

function sprites(props) {
  if (props.screen == "play") { return [ /* paddle, ball, bricks */ ]; }
  return [];
}

function update(props) {
  if (props.state.screen == "gameOver" && props.action) {
    return { screen: "play", screens: { play: initPlayState() } };
  }
  // play -> gameOver kun lives == 0 tai kaikki tiilet poissa
}
```

Runnerin (`game_runtime.rgr`) tuki:

| Toiminto | Kuvaus |
|----------|--------|
| `state.screen` | Aktiivinen screen-nimi |
| `state.screens[name]` | Kunkin screenin oma tila |
| `sprites({ screen })` | Lazy sprite-lataus ensimmäisellä vierailulla |
| `syncFromState()` / `draw()` | Vain aktiivisen screenin entityt |
| `props.action` | Space / ACTION-nappi |

Taaksepäin yhteensopiva: ilman `state.screens` toimii litteä Pong/Invaders-malli.
Käytä `game_helpers.tsx`:n `getScreen` / `activeScreen` -apureita raa'an
`state.screens[name]`-indeksoinnin sijaan. Esimerkki:
[`breakout.game.tsx`](../scripting/breakout.game.tsx).

## Ajaminen ja hot reload

SDL-ikkuna (hot reload oletuksena päällä — tallenna `.tsx` → AST-patch lennossa):

```bash
npm run engine:game-sdl:run:breakout   # tai :pong, :invaders, :ylos2, …
npm run engine:game:watch:invaders     # dev-launcher, sama käytös
```

Scene resetoituu vain kun `initState`, `sprites`, `resources` tai top-level `const`
muuttuu; pelkkä `update()` / `hud()` säilyttää pelitilan. Täydet komennot,
Node-runnerit ja lippujen (`--hot-reload` / `--no-hot-reload` / `maxFrames`)
semantiikka: [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md). Toteutus:
`gallery/ts_parser/ts_ast_patch.rgr`, testi `hot_reload_runner_demo.rgr`.
