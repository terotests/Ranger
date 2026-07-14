# Pelimoottorin suunnittelu: korjaukset ja seuraavat askeleet

> Täydentää [`GAME_SCRIPTING.md`](./GAME_SCRIPTING.md) ja [`TSX_ENGINE_ISSUES.md`](./TSX_ENGINE_ISSUES.md).
> Kuvaa nykytilan ongelmat, oikea retained-mode + JSX -malli, ja mitä enginessä
> pitää vielä korjata.

## Nykytila (heinäkuu 2026)

Kolme esimerkkiä kattaa eri kerrokset:

| Esimerkki | Maailma | UI | Entityjä | Tyypillinen FPS (dummy SDL) |
|-----------|---------|-----|----------|----------------------------|
| [`pong.game.tsx`](../scripting/pong.game.tsx) | retained `sprites()` | built-in digit-font | 3 | ~250 |
| [`invaders.game.tsx`](../scripting/invaders.game.tsx) | retained pixel-rectit | built-in digit-font | ~487 | ~8 |
| [`breakout.game.tsx`](../scripting/breakout.game.tsx) | retained tiilet/pallo | **JSX `hud()`** | 52 | ~150+ |

**Ongelma:** GameRunner piirtää maailman `SoftCanvas`-primitiiveillä (rect/circle).
JSX toimii vain erillisessä `menu.game.tsx`-polussa (`callRender("render")` ilman
pelisilmukkaa) tai uudessa kevyessä `hud()`-polussa (`game_hud.rgr`). Koko ruutu
ei vielä ole yhtenäinen EVG/JSX-puu kuten [`RENDERING_EVG.md`](../RENDERING_EVG.md)
suunnittelee.

---

## Oikea arkkitehtuuri: kaksi kerrosta, yksi framebuffer

```
┌─────────────────────────────────────────┐
│  hud()  — JSX → EVGLayout → overlay     │  ← UI (teksti, paneelit, valikot)
├─────────────────────────────────────────┤
│  sprites() — retained GameEntity        │  ← Maailma (nopea, liikutetaan vain)
├─────────────────────────────────────────┤
│  SoftCanvas RGBA → gfx_present (SDL2)   │
└─────────────────────────────────────────┘
```

### 1. Alustus (kerran, `setupScene`)

```tsx
function sprites() {
  return [
    { id: "paddle", kind: "rect", w: 64, h: 10, r: 120, g: 220, b: 255 },
    { id: "ball", kind: "circle", rad: 5, r: 245, g: 245, b: 130 },
    // yksi sprite per objekti — EI yhtä rectiä per pikseli
  ];
}
function initState() { return { entities: { paddle: {x,y}, ball: {x,y} }, ... }; }
```

**Sääntö:** `sprites()` luo kaikki graafiset objektit pelin alussa. Muoto, väri ja
koko eivät muutu runtime-aikana. Tämä on retained-mode:n ydin.

### 2. Simulaatio (jokainen frame, `update`)

```tsx
function update(props) {
  const s = props.state;
  // lue props.dt, props.left/right/up/down
  // palauta UUSI tila — älä mutatoi vanhaa jaettua objektia tarpeettomasti
  return {
    entities: {
      paddle: { x: newPx, y: s.entities.paddle.y },
      ball: { x: bx, y: by },
      b12: { x: -40, y: -40, visible: 0 }  // kuollut tiili piiloon
    },
    score: s.score + 10
  };
}
```

**Sääntö:** `update()` palauttaa vain **muuttuneet sijainnit** (ja valinnaisen
`visible`-lipun). GameRunnerin `syncFromState()` siirtää ne olemassa oleville
`GameEntity`-olioille — ei luo uusia sprittejä eikä parsaa JSX:ää uudelleen.

### 3. Piirto (jokainen frame, host `draw()`)

Nykyinen järjestys `game_runtime.rgr`:ssa:

1. `canvas.clear(bg)`
2. Piirrä vain `visible == true` -entityt (off-screen culling)
3. Jos skriptissä on `hud()`, kutsu `callRender("hud", { state, time, dt })` ja
   compositoi EVG-puu päälle (`game_hud.rgr`)
4. Muuten built-in digit-font pisteille

### 4. JSX vain UI:lle (toistaiseksi)

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

Tämä on oikea käyttömalli tänään: JSX **HUD:iin**, retained spritet **maailmaan**.

---

## Miksi Invaders on hidas (~8 FPS)

Invaders rikkoo useita suunnittelusääntöjä tarkoituksella (stressitesti):

| Ongelma | Vaikutus |
|---------|----------|
| 32 px × 15 alienia = **480 rect-spriteä** | Jokainen `fillRect` käy pikselit yksitellen |
| `update()` rakentaa koko `entities`-kartan uudelleen | Interpreter + `while`-loopit joka frame |
| `placeAlienPixels()` laskee bitmapin uudelleen animaatiolle | Turhaa kun sprite voisi olla 1 rect/alien |
| Kiinteä `dt = 16` SDL-loopissa | Matala FPS hidastaa myös simulaatiota |

### Korjaus Invadersille (tai uusille peleille)

1. **Yksi sprite per alien** (esim. 24×18 rect), ei 32 pikseliä
2. Animaatio: kaksi sprite-tilaa (`alien0a`, `alien0b`) tai `kind: "bitmap"` tulevaisuudessa
3. Kuolleet alienit: `visible: 0` — runner ohittaa piirron (tehty `syncFromState`:ssa)
4. `update()`: päivitä vain liikkuvat id:t (aalto-offset + laiva + ammus), ei kaikkia 480 kohtaa
5. **Delta-time:** SDL-loopin tulisi mitata todellinen `dt`, ei kiinteää 16 ms

---

## Mitä enginessä pitää vielä korjata

### Prioriteetti 1 — GameRunner (`game_runtime.rgr`)

| Tehtävä | Tila | Kuvaus |
|---------|------|--------|
| `sprites()` kerran | ✅ | Retained `GameEntity` |
| `update()` + `syncFromState` | ✅ | Sijainnit reducer-tyylillä |
| Off-screen / `visible` culling | ✅ (2026-07-08) | Ohita piirto ja synkka kun ei näy |
| `lastX`/`lastY` skip | ✅ | Vältä turhaa kirjoitusta |
| JSX `hud()` | ✅ (kevyt) | `game_hud.rgr` — View/Label, ei täyttä EVG:ä |
| Geneerinen sprite-protokolla | ✅ (2026-07-08) | `game_sprite.rgr` — `rect`/`circle`/`wedge`, pose `{x,y,r,g,b,rad,p0..p2}` |
| `showNet` state-flag | ✅ | Ei pelikohtaisia layout-haaruja verkkoon |
| Todellinen `dt` SDL-hostissa | ❌ | `game_sdl_runner.rgr` käyttää kiinteää 16 |
| **Äänet** | ❌ | Engine-tason API (ei peliskripteissä) |
| `EVGRasterRenderer` HUD:lle | ❌ | TTF-fontit, varjot, gradientit |
| Sprite atlas / `blit` | ❌ | Bitmap-spritet ilman tuhansia rectejä |

### Prioriteetti 2 — ComponentEngine

| Tehtävä | Tila |
|---------|------|
| `while`-loopit | ✅ |
| Member assignment | ✅ |
| Nested `callFunction` | ✅ |
| `getGlobal` / `moduleScope` | ✅ |
| `return` loopin sisällä | ❌ |
| Unicode `//`-kommentit natiivissa | ❌ |
| `**` precedenssi | ❌ |

### Prioriteetti 3 — SoftCanvas / rasterointi

- `clear()`: täysi puskurin silmukka — voisi käyttää `memset`-tyylistä täyttöä natiivissa
- `fillRect()`: pikseli kerrallaan — rivikohtainen `memcpy` tai span-fill
- Dirty rectangle -seuranta: piirrä vain muuttuneet alueet (myöhemmin)

### Prioriteetti 4 — Yhtenäinen JSX-maailma (pitkän aikavälin)

[`RENDERING_EVG.md`](../RENDERING_EVG.md) kuvaa tavoitteen: koko frame EVG:llä.
Vaiheittainen polku:

1. ✅ `hud()` kevyellä EVGLayout-blitterillä
2. `world()` JSX — staattiset taustaelementit EVG:llä, liikkuvat retained-spritet päälle
3. Täysi `render({ state })` GameRunnerissa → `EVGRasterRenderer` koko ruudulle
4. GPU-polku (GLES2) Pi:lle

---

## Esimerkkien vertailu (mitä opimme)

### Pong — oikea minimal-malli
- 3 entityä, puhdas reducer, nopea
- Ei JSX:ää (digit-font riittää)

### Invaders — mitä EI tehdä tuotannossa
- Pixel-per-rect on stressitesti evaluatorille, ei grafiikkamalli
- Käytä vain regressiotestinä

### Breakout — suositeltu uusi pohja
- 52 entityä (50 tiiliä + maila + pallo)
- `hud()` JSX:llä pisteet/elämät/status
- Kuolleet tiilet `visible: 0` + off-screen
- Odotettu FPS: selvästi korkeampi kuin Invaders

---

## Ajaminen

```bash
# SDL-ikkuna (hot reload oletuksena päällä — tallenna .game.tsx → AST-patch lennossa)
npm run engine:game-sdl:run:pacman
npm run engine:game:watch:invaders   # sama, dev-launcher

# Eksplisiittinen lippu
./tmp/game-sdl/game_sdl --hot-reload gallery/game_engine/scripting/breakout.game.tsx

# Headless-smoke (hot reload pois, maxFrames)
npm run engine:game-sdl:smoke:breakout

# Node-runner (testit)
node bin/output.js -es6 gallery/game_engine/scripting/breakout_runner_demo.rgr \
  -d=./tests/.output -o=breakout_runner_demo.js -nodecli
node ./tests/.output/breakout_runner_demo.js 420
```

### Hot reload (runtime-optio, TS-interpreter / Path A)

`GameRunner` + `ComponentEngine.patchScript()`:

| Optio | Oletus | Kuvaus |
|-------|--------|--------|
| `options.hotReload` | `false` (aseta hostissa) | Pollaa `trackScriptFile()`-polun mtime |
| `setHotReload(true)` | SDL-interaktiivinen | AST-diff + vaihda muuttuneet funktiot/constit |
| `--hot-reload` / `--no-hot-reload` | `game_sdl` CLI | Yliajaa oletuksen |
| `maxFrames` > 0 | hot reload **pois** | CI/smoke ei pollaa tiedostoa |

Scene reset vain kun muuttuu `initState`, `sprites`, `resources` tai top-level `const`.
Pelkkä `update()` / `hud()` säilyttää pelitilan.

Toteutus: `gallery/ts_parser/ts_ast_patch.rgr`, testi `hot_reload_runner_demo.rgr`.

---

## Yhteenveto yhdellä lauseella

**Sprites kerran alussa, sijainnit reducerilla joka framella, JSX vain HUD:iin —
älä koskaan rakenna satoja rect-spritejä uudelleen joka frame.**

---

## Nimetty screen-malli (HTML-sivujen kaltainen)

Peli voi koostua useista **nimetyistä screeneistä** (`play`, `gameOver`, `menu`, …).
Vaihtaessa screeniä edellinen jää muistiin jäädytettynä; uudelle screenille
alustetaan omat spritet ja tila.

### Rakenne

```tsx
function screens() {
  return ["play", "gameOver"];
}

function initState() {
  return {
    screen: "play",
    screens: { play: initPlayState() }
  };
}

function sprites(props) {
  if (props.screen == "play") { return [ /* paddle, ball, bricks */ ]; }
  return [];
}

function update(props) {
  if (props.state.screen == "gameOver" && props.action) {
    return { screen: "play", screens: { gameOver: ..., play: initPlayState() } };
  }
  // play -> gameOver when lives == 0 or all bricks gone
}
```

### Engine (`game_runtime.rgr`)

| Toiminto | Kuvaus |
|----------|--------|
| `state.screen` | Aktiivinen screen-nimi |
| `state.screens[name]` | Kunkin screenin oma tila |
| `sprites({ screen })` | Lazy sprite load ensimmäisellä vierailulla |
| `syncFromState()` / `draw()` | Vain aktiivisen screenin entityt |
| `props.action` | Space (SDL bit 4) |

Taaksepäin yhteensopiva: ilman `state.screens` toimii Pong/Invaders.

Esimerkki: [`breakout.game.tsx`](../scripting/breakout.game.tsx).
